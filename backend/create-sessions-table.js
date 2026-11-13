/**
 * Script de création de la table de sessions admin
 * À exécuter une fois sur une base neuve (la table est aussi créée au démarrage du serveur)
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createSessionsTable() {
    console.log('');
    console.log('========================================');
    console.log('  Création de la table de sessions');
    console.log('========================================');
    console.log('');

    try {
        // Créer la table de sessions
        console.log('📊 Création de la table admin_sessions...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_sessions (
                token VARCHAR(64) PRIMARY KEY,
                expires_at BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Table admin_sessions créée avec succès');
        console.log('');
        
        // Créer un index sur expires_at pour optimiser le nettoyage
        console.log('🔧 Création d\'index sur expires_at...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires 
            ON admin_sessions(expires_at);
        `);
        
        console.log('✅ Index créé');
        console.log('');
        
        // Vérifier la table
        console.log('🔍 Vérification de la table...');
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'admin_sessions'
            ORDER BY ordinal_position;
        `);
        
        console.log('✅ Structure de la table admin_sessions :');
        result.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
        console.log('');
        
        console.log('========================================');
        console.log('  ✅ Configuration réussie !');
        console.log('========================================');
        console.log('');
        console.log('Table de sessions prête.');
        console.log('Les sessions sont stockées dans PostgreSQL.');
        console.log('');
        
    } catch (error) {
        console.error('');
        console.error('❌ ERREUR lors de la création :');
        console.error('   ', error.message);
        console.error('');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Lancer la création
createSessionsTable();
