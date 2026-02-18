/**
 * TrustiScore Configuration Loader
 * Charge et gère la configuration paramétrable du site
 */

class TrustiScoreConfig {
    constructor() {
        this.config = null;
        this.loaded = false;
        // Détection automatique de l'URL de l'API
        this.apiUrl = this.getApiUrl();
    }

    /**
     * Détermine l'URL de l'API selon l'environnement
     * @returns {string} URL de l'API
     */
    getApiUrl() {
        // En production, utiliser l'URL de votre API déployée
        // Pour l'instant, détection automatique local/prod
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        
        // TODO: Remplacer par votre URL API en production
        // return 'https://api.trustiscore.com';
        return 'http://localhost:3001'; // Par défaut pour l'instant
    }

    /**
     * Charge la configuration depuis l'API (BDD) avec fallback sur fichier local
     * @returns {Promise<Object>} Configuration chargée
     */
    async load() {
        try {
            // 1. PRIORITÉ : Charger depuis l'API (Base de données)
            console.log('🔄 Tentative de chargement depuis l\'API...');
            const apiResponse = await fetch(`${this.apiUrl}/api/config`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (apiResponse.ok) {
                this.config = await apiResponse.json();
                this.loaded = true;
                console.log('✅ Configuration chargée depuis la base de données');
                return this.config;
            }

            throw new Error(`API returned ${apiResponse.status}`);

        } catch (apiError) {
            // 2. FALLBACK : Charger depuis le fichier local
            console.warn('⚠️ API non disponible, chargement depuis le fichier local...', apiError.message);
            
            try {
                const fileResponse = await fetch('assets/config.json');
                if (!fileResponse.ok) {
                    throw new Error('Erreur de chargement du fichier config.json');
                }

                this.config = await fileResponse.json();
                this.loaded = true;
                console.log('📄 Configuration chargée depuis le fichier local (fallback)');
                return this.config;
            } catch (fileError) {
                console.error('❌ Erreur lors du chargement de la configuration:', fileError);
                throw fileError;
            }
        }
    }

    /**
     * Obtient une valeur de configuration par chemin
     * @param {string} path - Chemin vers la valeur (ex: 'footer.copyright')
     * @param {*} defaultValue - Valeur par défaut si non trouvée
     * @returns {*} Valeur trouvée ou valeur par défaut
     */
    get(path, defaultValue = null) {
        if (!this.loaded) {
            console.warn('Configuration non chargée. Appelez load() d\'abord.');
            return defaultValue;
        }

        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Obtient tous les critères
     * @returns {Object} Critères de notation
     */
    getCriteria() {
        return this.get('criteria', {});
    }

    /**
     * Obtient un critère spécifique
     * @param {string} key - Clé du critère (ex: 'gouvernance')
     * @returns {Object} Données du critère
     */
    getCriterion(key) {
        return this.get(`criteria.${key}`, null);
    }

    /**
     * Obtient les descriptions des notes
     * @returns {Object} Descriptions des notes A-E
     */
    getGradeDescriptions() {
        return this.get('gradeDescriptions', {});
    }

    /**
     * Obtient la description d'une note spécifique
     * @param {string} grade - Note (A, B, C, D ou E)
     * @returns {Object} Description de la note
     */
    getGradeDescription(grade) {
        return this.get(`gradeDescriptions.${grade}`, null);
    }

    /**
     * Obtient les seuils de notation
     * @returns {Object} Seuils en pourcentage
     */
    getGradeThresholds() {
        return this.get('gradeThresholds', { A: 80, B: 60, C: 40, D: 20 });
    }

    /**
     * Détermine la note en fonction du score
     * @param {number} score - Score sur 100
     * @returns {string} Note (A, B, C, D ou E)
     */
    getGradeFromScore(score) {
        const thresholds = this.getGradeThresholds();
        
        if (score >= thresholds.A) return 'A';
        if (score >= thresholds.B) return 'B';
        if (score >= thresholds.C) return 'C';
        if (score >= thresholds.D) return 'D';
        return 'E';
    }

    /**
     * Obtient la configuration du simulateur
     * @returns {Object} Configuration du simulateur
     */
    getSimulatorConfig() {
        return this.get('simulator', {});
    }

    /**
     * Obtient le nom du site
     * @returns {string} Nom du site
     */
    getSiteName() {
        return this.get('siteName', 'TrustiScore');
    }

    /**
     * Obtient le slogan du site
     * @returns {string} Slogan
     */
    getSiteTagline() {
        return this.get('siteTagline', 'Reprenez votre souveraineté numérique');
    }

    /**
     * Obtient les informations du footer
     * @returns {Object} Footer avec copyright et infos additionnelles
     */
    getFooter() {
        return this.get('footer', {
            copyright: '© 2026 TrustiScore',
            additionalInfo: ''
        });
    }

    /**
     * Obtient les sections de la page d'accueil
     * @returns {Array} Sections de contenu
     */
    getHomepageSections() {
        return this.get('homepage.sections', []);
    }

    /**
     * Applique la configuration au header de la page
     */
    applyToHeader() {
        const headerTitle = document.querySelector('header h1');
        const headerSubtitle = document.querySelector('header p');

        if (headerTitle) {
            headerTitle.textContent = this.getSiteName();
        }

        if (headerSubtitle) {
            headerSubtitle.textContent = this.getSiteTagline();
        }
    }

    /**
     * Applique la configuration au footer de la page
     */
    applyToFooter() {
        const footer = this.getFooter();
        const footerElement = document.querySelector('footer');

        if (footerElement) {
            const paragraphs = footerElement.querySelectorAll('p');
            if (paragraphs[0]) {
                paragraphs[0].textContent = footer.copyright;
            }
            if (paragraphs[1] && footer.additionalInfo) {
                paragraphs[1].textContent = footer.additionalInfo;
            }
        }
    }

    /**
     * Génère le HTML pour une échelle de notation
     * @returns {string} HTML de l'échelle
     */
    generateGradeScale() {
        const grades = this.getGradeDescriptions();
        let html = '<div class="grade-scale">';

        ['A', 'B', 'C', 'D', 'E'].forEach(grade => {
            const gradeData = grades[grade];
            if (gradeData) {
                html += `
                    <div class="grade-card grade-${grade.toLowerCase()}">
                        <h4>Note ${grade}</h4>
                        <h5>${gradeData.title}</h5>
                        <p>${gradeData.shortDescription || gradeData.description}</p>
                    </div>
                `;
            }
        });

        html += '</div>';
        return html;
    }

    /**
     * Génère le HTML pour la grille de critères
     * @returns {string} HTML de la grille
     */
    generateCriteriaGrid() {
        const criteria = this.getCriteria();
        let html = '<div class="criteria-grid">';

        Object.values(criteria).forEach(criterion => {
            html += `
                <div class="criteria-item">
                    <strong>${criterion.detailedDescription}</strong>
                    <p><strong>Note A :</strong> ${criterion.gradeAExample}<br>
                       <strong>Note E :</strong> ${criterion.gradeEExample}</p>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Génère le HTML pour un critère du simulateur
     * @param {string} criterionKey - Clé du critère
     * @param {number} index - Index d'affichage
     * @returns {string} HTML du critère
     */
    generateSimulatorCriterion(criterionKey, index) {
        const criterion = this.getCriterion(criterionKey);
        if (!criterion) return '';

        let html = `
            <div class="criterion-item" data-criterion="${criterionKey}">
                <div class="criterion-header">
                    <div class="criterion-title">
                        <h3>${index}. ${criterion.name} (${criterion.weight}%)</h3>
                        <p>${criterion.description}</p>
                    </div>
                    <div class="criterion-select">
                        <label>Évaluation :</label>
                        <div class="star-rating">
        `;

        // Générer les options (en ordre décroissant : 4, 3, 2, 1, 0)
        criterion.options.forEach(option => {
            html += `
                <label class="star-option star-value-${option.value + 1}">
                    <input type="radio" name="${criterionKey}" value="${option.value}" ${option.value === 4 ? 'required' : ''}>
                    <div class="star-icon">${option.icon}</div>
                    <div class="star-label">${option.label}</div>
                </label>
            `;
        });

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Calcule le score TrustiScore basé sur les réponses
     * @param {FormData} formData - Données du formulaire
     * @returns {Object} Résultats avec score, note et détails
     */
    calculateScore(formData) {
        const criteria = this.getCriteria();
        let totalScore = 0;
        const scores = {};

        // Calcul du score pondéré
        for (let [key, value] of formData.entries()) {
            const score = parseInt(value);
            const criterion = criteria[key];
            if (criterion) {
                const weight = criterion.weight;
                const weightedScore = (score / 4) * weight;
                totalScore += weightedScore;
                scores[key] = { 
                    raw: score, 
                    weighted: weightedScore,
                    criterion: criterion
                };
            }
        }

        const finalScore = Math.round(totalScore);
        const grade = this.getGradeFromScore(finalScore);
        const gradeDescription = this.getGradeDescription(grade);

        return {
            score: finalScore,
            grade: grade,
            gradeData: gradeDescription,
            details: scores
        };
    }

    /**
     * Génère le HTML pour afficher les résultats
     * @param {Object} results - Résultats du calcul
     * @returns {string} HTML des résultats
     */
    generateResultsHTML(results) {
        const { score, grade, gradeData, details } = results;
        
        let html = `
            <div class="result-score result-grade-${grade.toLowerCase()}">${grade}</div>
            <div class="result-description">
                <strong>${gradeData.title}</strong><br>
                ${gradeData.description}<br>
                <small style="color: #94a3b8; margin-top: 1rem; display: block;">
                    Score final : ${score} / 100
                </small>
            </div>
            <div class="result-details">
                <h3>Détails de l'évaluation</h3>
                <div class="result-breakdown">
        `;

        // Détail par critère
        for (let [key, scoreData] of Object.entries(details)) {
            const stars = '★'.repeat(scoreData.raw) + '☆'.repeat(4 - scoreData.raw);
            html += `
                <div class="breakdown-item">
                    <strong>${scoreData.criterion.name} (${scoreData.criterion.weight}%)</strong>
                    <span>${stars} (${scoreData.raw}/4)</span>
                    <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.3rem;">
                        ${scoreData.weighted.toFixed(1)} pts
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }
}

// Instance globale
const trustiConfig = new TrustiScoreConfig();

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrustiScoreConfig;
}
