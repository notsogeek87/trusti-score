/**
 * Script de FORCE initialisation de la base de données
 * ÉCRASE la configuration existante avec le contenu de config.json
 * ⚠️ ATTENTION : Supprime toutes les modifications faites via l'admin !
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_URL = 'http://localhost:3001';
const ADMIN_PASSWORD = '9xWL5JVP$Nj1l6'; // À changer en production

async function forceInitDatabase() {
    console.log('');
    console.log('⚠️  ========================================');
    console.log('   RÉINITIALISATION FORCÉE DE LA BDD');
    console.log('   ========================================');
    console.log('');
    console.log('⚠️  ATTENTION : Toutes les modifications admin');
    console.log('   seront écrasées par le contenu de config.json');
    console.log('');

    try {
        // 1. Lire le fichier config.json
        console.log('📖 Lecture de config.json...');
        const configPath = path.join(__dirname, '..', 'assets', 'config.json');
        const configData = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        console.log('✅ Configuration lue :', Object.keys(configData).length, 'clés principales');
        console.log('');

        // 2. Authentification
        console.log('🔐 Authentification admin...');
        const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: ADMIN_PASSWORD })
        });

        if (!loginResponse.ok) {
            throw new Error(`Authentification échouée: ${loginResponse.status}`);
        }

        const { token } = await loginResponse.json();
        console.log('✅ Authentification réussie');
        console.log('');

        // 3. Envoyer la configuration à l'API (ÉCRASE l'existant)
        console.log('💾 Écrasement de la configuration en BDD...');
        const saveResponse = await fetch(`${API_URL}/api/config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(configData)
        });

        if (!saveResponse.ok) {
            const errorText = await saveResponse.text();
            throw new Error(`Erreur lors de la sauvegarde: ${saveResponse.status} - ${errorText}`);
        }

        const result = await saveResponse.json();
        console.log('✅ Configuration écrasée avec succès !');
        console.log('   Date de sauvegarde :', result.updated_at);
        console.log('');

        // 4. Vérification
        console.log('🔍 Vérification...');
        const verifyResponse = await fetch(`${API_URL}/api/config`);
        
        if (verifyResponse.ok) {
            const savedConfig = await verifyResponse.json();
            console.log('✅ Configuration bien présente en BDD');
            console.log('   Nom du site :', savedConfig.siteName);
            console.log('   Nombre de critères :', Object.keys(savedConfig.criteria || {}).length);
            console.log('');
        }

        console.log('========================================');
        console.log('  ✅ Réinitialisation réussie !');
        console.log('========================================');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('❌ ERREUR lors de la réinitialisation :');
        console.error('   ', error.message);
        console.error('');
        
        if (error.message.includes('fetch')) {
            console.error('💡 Vérifiez que le backend est démarré :');
            console.error('   cd backend');
            console.error('   npm start');
            console.error('');
        }
        
        process.exit(1);
    }
}

// Lancer la réinitialisation forcée
forceInitDatabase();
