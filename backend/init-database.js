/**
 * Script d'initialisation de la base de données
 * Charge config.json et l'envoie dans PostgreSQL via l'API
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_URL = 'http://localhost:3001';
const ADMIN_PASSWORD = '9xWL5JVP$Nj1l6'; // À changer en production

async function initDatabase() {
    console.log('');
    console.log('========================================');
    console.log('  Initialisation de la Base de Données');
    console.log('========================================');
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

        // 3. Vérifier si une config existe déjà
        console.log('🔍 Vérification de la configuration existante...');
        const checkResponse = await fetch(`${API_URL}/api/config`);
        
        if (checkResponse.ok) {
            const existingConfig = await checkResponse.json();
            
            // Si config existe et a du contenu
            if (existingConfig && existingConfig.siteName) {
                console.log('⚠️  Une configuration existe déjà en base de données !');
                console.log('   Nom du site actuel :', existingConfig.siteName);
                console.log('');
                console.log('❌ Initialisation annulée pour éviter l\'écrasement');
                console.log('   Si vous voulez réinitialiser, supprimez d\'abord la config en BDD');
                console.log('');
                return;
            }
        }

        console.log('✅ Aucune configuration existante, initialisation possible');
        console.log('');

        // 4. Envoyer la configuration à l'API
        console.log('💾 Envoi de la configuration vers la base de données...');
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
        console.log('✅ Configuration sauvegardée avec succès !');
        console.log('   Date de sauvegarde :', result.updated_at);
        console.log('');

        // 5. Vérification
        console.log('🔍 Vérification de la sauvegarde...');
        const verifyResponse = await fetch(`${API_URL}/api/config`);
        
        if (verifyResponse.ok) {
            const savedConfig = await verifyResponse.json();
            console.log('✅ Configuration bien présente en BDD');
            console.log('   Nom du site :', savedConfig.siteName);
            console.log('   Nombre de critères :', Object.keys(savedConfig.criteria || {}).length);
            console.log('');
        }

        console.log('========================================');
        console.log('  ✅ Initialisation réussie !');
        console.log('========================================');
        console.log('');
        console.log('Les pages publiques (index.html, simulateur.html)');
        console.log('chargeront maintenant depuis la base de données.');
        console.log('');
        console.log('Pour tester :');
        console.log('1. Ouvrez http://localhost:8000');
        console.log('2. Ouvrez la console (F12)');
        console.log('3. Vous devriez voir : "Configuration chargée depuis la base de données"');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('❌ ERREUR lors de l\'initialisation :');
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

// Lancer l'initialisation
initDatabase();
