import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Hyperfluid fournit le secret de la base sous forme de bloc JSON
 * (host, port, internal_database_url...) : on en extrait l'adresse interne.
 * Une adresse classique (postgres://...) est renvoyée telle quelle.
 */
function resolveDatabaseUrl(raw = process.env.DATABASE_URL) {
    const text = String(raw || '').trim();
    if (!text.startsWith('{')) return text;
    try {
        const obj = JSON.parse(text);
        return obj.internal_database_url || obj.database_url || text;
    } catch {
        return text;
    }
}

const DATABASE_URL = resolveDatabaseUrl();
// SSL pour Neon (ou si l'adresse le demande) ; pas pour la base interne Hyperfluid.
const useSsl = /neon\.tech/.test(DATABASE_URL) || /sslmode=require/.test(DATABASE_URL);

// Configuration PostgreSQL (base interne Hyperfluid)
const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false
});

// Derrière le proxy d'entrée (Hyperfluid) : IP et protocole réels du visiteur.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Anciennes adresses : renvoyées vers l'adresse officielle, chemin et paramètres conservés.
const CANONICAL_ORIGIN = 'https://trusti-score.eu';
const LEGACY_HOSTS = new Set(['trusti-score.lielu.eu', 'www.trusti-score.eu', 'trustiscore.eu', 'www.trustiscore.eu']);
app.use((req, res, next) => {
    const host = String(req.hostname || '').toLowerCase();
    if (!LEGACY_HOSTS.has(host)) return next();
    const code = req.method === 'GET' || req.method === 'HEAD' ? 301 : 308;
    return res.redirect(code, CANONICAL_ORIGIN + req.originalUrl);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logs des requêtes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ========================================
// TEST DE CONNEXION BDD
// ========================================

app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error('Erreur de connexion BDD:', error);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

// ========================================
// GESTION DE LA CONFIGURATION
// ========================================

// GET - Récupérer la configuration actuelle
app.get('/api/config', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT config_data, updated_at FROM trustiscore_config WHERE id = 1'
        );

        if (result.rows.length === 0) {
            // Si pas de config en BDD, charger depuis le fichier par défaut
            const fs = await import('fs/promises');
            const path = await import('path');
            const { fileURLToPath } = await import('url');
            const __dirname = path.dirname(fileURLToPath(import.meta.url));
            const configPath = path.join(__dirname, '..', 'assets', 'config.json');
            
            const defaultConfig = JSON.parse(
                await fs.readFile(configPath, 'utf-8')
            );
            return res.json(defaultConfig);
        }

        res.json(result.rows[0].config_data);

    } catch (error) {
        console.error('Erreur lors de la récupération de la config:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
    }
});

// ========================================
// INITIALISATION DE LA BASE DE DONNÉES
// ========================================

async function initDatabase() {
    try {
        console.log('🔧 Initialisation de la base de données...');

        // Créer la table de configuration principale
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trustiscore_config (
                id INTEGER PRIMARY KEY,
                config_data JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Créer la table d'historique (optionnel)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trustiscore_config_history (
                id SERIAL PRIMARY KEY,
                config_data JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Ancienne interface admin (supprimée) : table des sessions devenue inutile
        await pool.query('DROP TABLE IF EXISTS admin_sessions');

        // Créer un trigger pour l'historique automatique
        await pool.query(`
            CREATE OR REPLACE FUNCTION save_config_history()
            RETURNS TRIGGER AS $$
            BEGIN
                INSERT INTO trustiscore_config_history (config_data, updated_at)
                VALUES (NEW.config_data, NEW.updated_at);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await pool.query(`
            DROP TRIGGER IF EXISTS config_history_trigger ON trustiscore_config;
            CREATE TRIGGER config_history_trigger
            AFTER INSERT OR UPDATE ON trustiscore_config
            FOR EACH ROW
            EXECUTE FUNCTION save_config_history();
        `);

        await seedConfigIfEmpty();

        console.log('✅ Base de données initialisée ');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la BDD:', error);
        throw error;
    }
}

/**
 * Base neuve (ex. première installation sur Hyperfluid) : reprend la configuration
 * publiée (backend/seed-config.json, copie de GET /api/config), sinon assets/config.json.
 */
async function seedConfigIfEmpty() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM trustiscore_config');
    if (rows[0].n > 0) return;
    const candidates = [
        path.join(__dirname, 'seed-config.json'),
        path.join(__dirname, '..', 'assets', 'config.json'),
    ];
    const file = candidates.find((f) => fs.existsSync(f));
    if (!file) return;
    const config = JSON.parse(fs.readFileSync(file, 'utf-8'));
    await pool.query(
        'INSERT INTO trustiscore_config (id, config_data, updated_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO NOTHING',
        [JSON.stringify(config)]
    );
    console.log(`🌱 Configuration initiale chargée depuis ${path.basename(file)}`);
}

// ========================================
// SITE STATIQUE
// ========================================
// Dans l'image Docker, les pages publiques sont copiées dans ../public.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
if (fs.existsSync(PUBLIC_DIR)) {
    app.use(express.static(PUBLIC_DIR, { extensions: ['html'], maxAge: '1h' }));
}

// ========================================
// DÉMARRAGE DU SERVEUR
// ========================================

async function startServer() {
    try {
        // Initialiser la BDD
        await initDatabase();

        // Démarrer le serveur
        app.listen(PORT, '0.0.0.0', () => {
            console.log('');
            console.log('🚀 ============================================');
            console.log(`   TrustiScore API démarrée sur le port ${PORT}`);
            console.log('   ============================================');
            console.log('');
            console.log('   Endpoints disponibles :');
            console.log(`   - GET  http://localhost:${PORT}/api/health`);
            console.log(`   - GET  http://localhost:${PORT}/api/config`);
            console.log('');
            console.log('   Connexion BDD : PostgreSQL');
            console.log('');
        });

    } catch (error) {
        console.error('❌ Impossible de démarrer le serveur:', error);
        process.exit(1);
    }
}

// Gestion propre de l'arrêt
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
    console.log('\n👋 Arrêt du serveur...');
    await pool.end();
    process.exit(0);
});

// Lancer le serveur
startServer();
