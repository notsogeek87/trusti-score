import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration PostgreSQL (Neon.tech)
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
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
// AUTHENTIFICATION
// ========================================

// Sessions en mémoire (pour la démo - en production, utiliser Redis ou PostgreSQL)
const sessions = new Map();

app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Mot de passe requis' });
    }

    try {
        // Vérifier le mot de passe
        const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

        if (!isValid) {
            console.warn('⚠️ Tentative de connexion échouée');
            return res.status(401).json({ error: 'Mot de passe incorrect' });
        }

        // Générer un token de session
        const token = generateToken();
        const expiresAt = Date.now() + (4 * 60 * 60 * 1000); // 4 heures

        sessions.set(token, { expiresAt });

        console.log('✅ Connexion admin réussie');
        res.json({ token, expiresAt });

    } catch (error) {
        console.error('Erreur lors de l\'authentification:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Middleware de vérification du token
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    const session = sessions.get(token);

    if (!session) {
        return res.status(401).json({ error: 'Session invalide' });
    }

    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return res.status(401).json({ error: 'Session expirée' });
    }

    next();
}

app.post('/api/auth/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    sessions.delete(token);
    res.json({ message: 'Déconnexion réussie' });
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

// PUT - Sauvegarder la configuration (protégé)
app.put('/api/config', requireAuth, async (req, res) => {
    const configData = req.body;

    if (!configData) {
        return res.status(400).json({ error: 'Configuration vide' });
    }

    try {
        // Upsert : INSERT ou UPDATE selon si la ligne existe
        const result = await pool.query(
            `INSERT INTO trustiscore_config (id, config_data, updated_at)
             VALUES (1, $1, NOW())
             ON CONFLICT (id)
             DO UPDATE SET config_data = $1, updated_at = NOW()
             RETURNING updated_at`,
            [JSON.stringify(configData)]
        );

        console.log('✅ Configuration sauvegardée en BDD');
        res.json({
            message: 'Configuration sauvegardée avec succès',
            updated_at: result.rows[0].updated_at
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde de la configuration' });
    }
});

// GET - Historique des modifications (optionnel, pour audit)
app.get('/api/config/history', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, updated_at 
             FROM trustiscore_config_history 
             ORDER BY updated_at DESC 
             LIMIT 20`
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
    }
});

// ========================================
// UTILITAIRES
// ========================================

function generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

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

        console.log('✅ Base de données initialisée');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la BDD:', error);
        throw error;
    }
}

// ========================================
// DÉMARRAGE DU SERVEUR
// ========================================

async function startServer() {
    try {
        // Initialiser la BDD
        await initDatabase();

        // Démarrer le serveur
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ============================================');
            console.log(`   TrustiScore API démarrée sur le port ${PORT}`);
            console.log('   ============================================');
            console.log('');
            console.log('   Endpoints disponibles :');
            console.log(`   - GET  http://localhost:${PORT}/api/health`);
            console.log(`   - POST http://localhost:${PORT}/api/auth/login`);
            console.log(`   - GET  http://localhost:${PORT}/api/config`);
            console.log(`   - PUT  http://localhost:${PORT}/api/config (auth)`);
            console.log('');
            console.log('   Connexion BDD : Neon.tech PostgreSQL');
            console.log('');
        });

    } catch (error) {
        console.error('❌ Impossible de démarrer le serveur:', error);
        process.exit(1);
    }
}

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
    console.log('\n👋 Arrêt du serveur...');
    await pool.end();
    process.exit(0);
});

// Lancer le serveur
startServer();
