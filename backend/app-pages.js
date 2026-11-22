// Fiches publiques des applications notées : /applications/<slug> (FR), /en/…, /de/…
// Générées à la demande depuis l'export de l'API ouverte (api.trusti-score.eu), mis en cache.
// Voir docs/guides/referencement.md.
import fs from 'fs';
import path from 'path';

const SITE = 'https://trusti-score.eu';
const API = (process.env.TRUSTI_PUBLIC_API || 'https://api.trusti-score.eu/api/v1').replace(/\/$/, '');
const LANGS = ['fr', 'en', 'de'];
const DATA_TTL = 60 * 60 * 1000;          // export rechargé toutes les heures (quota API : 20 exports/h)
const ALT_TTL = 6 * 60 * 60 * 1000;       // alternatives : 6 h (vidé dès qu'une note change)
const POLL_EVERY = Math.max(60, Number(process.env.APP_PAGES_POLL_SECONDS) || 300) * 1000;  // vérification des notes : 5 min
const POLL_MAX_APPS = 5;                  // au-delà, rechargement complet (6 appels API par app)
const FULL_RELOAD_MIN_GAP = 15 * 60 * 1000;  // l'API garde l'export 10 min en cache ; quota 20 exports/h
const PAGE_MAX_AGE = 300;                 // cache navigateur des fiches : 5 min
const ALT_CALLS_PER_MIN = 30;             // quota API : 60 req/min, on en garde la moitié
const FETCH_TIMEOUT = 20000;

// ---------------------------------------------------------------- textes
const T = {
    fr: {
        home: 'Accueil', list: 'Applications notées', prefix: '',
        titleApp: (n, g) => `${n} : note TrustiScore ${g} - données, RGPD, alternatives`,
        h1App: (n) => `${n}`, sub: (g) => `Souveraineté numérique notée ${g}`,
        descFallback: (n, g, s) => `${n} obtient la note ${g} (${s}/100) au TrustiScore : où sont les données, qui peut y accéder, et quelles alternatives européennes choisir.`,
        score: 'Score', outOf: 'sur 100', assessed: 'Évaluée le', provisional: 'Évaluation provisoire : certains points restent à confirmer.',
        range: (a, b) => `Selon ces points, le score pourrait aller de ${a} à ${b}.`,
        facts: 'En bref', developer: 'Éditeur', category: 'Catégorie', european: 'Éditeur européen', openSource: 'Open source', license: 'Licence', website: 'Site officiel',
        yes: 'Oui', no: 'Non', unknown: 'Non renseigné',
        criteria: 'Le détail des 5 critères', weight: 'poids', points: 'points', sources: 'Sources', toConfirm: 'à confirmer',
        alternatives: (n) => `Alternatives mieux notées à ${n}`, noAlt: 'Aucune alternative mieux notée n\'est encore référencée dans cette catégorie.',
        openTrusti: 'Voir dans l\'app Trusti', installTrusti: 'Installer Trusti (Google Play)', openShort: 'Voir dans Trusti', download: 'Télécharger', stickyText: (n, g) => `${n} : note ${g}`, method: 'Comment la note est calculée',
        contest: 'Une erreur ? Contester la note', contestSubject: 'Contestation de note',
        attribution: 'Données sous licence CC BY 4.0, réutilisables via l\'API ouverte.', api: 'API ouverte',
        listTitle: 'Applications notées - souveraineté numérique de A à E | TrustiScore',
        listH1: 'Toutes les applications notées', listIntro: (n) => `${n} applications et services évalués sur 5 critères : juridiction, localisation des données, contrôle technique, conformité, transparence. Cliquez sur une application pour voir le détail de sa note et ses alternatives.`,
        listDesc: (n) => `La note de souveraineté numérique (A à E) de ${n} applications : messageries, e-mail, IA, cloud, réseaux sociaux… et leurs alternatives européennes.`,
        gradeHead: { A: 'Note A - Souverain et privé', B: 'Note B - Bon', C: 'Note C - Moyen', D: 'Note D - Risqué', E: 'Note E - Critique' },
        filter: 'Filtrer par nom', apps: 'applications', footer: 'Pour une souveraineté numérique européenne',
        legal: 'Mentions légales', privacy: 'Confidentialité', simulator: 'Simulateur', skip: 'Aller au contenu', langNav: 'Langue',
        unavailable: 'Les fiches sont momentanément indisponibles. Réessayez dans quelques minutes.',
    },
    en: {
        home: 'Home', list: 'Rated apps', prefix: 'en/',
        titleApp: (n, g) => `${n}: TrustiScore grade ${g} - data, GDPR, alternatives`,
        h1App: (n) => `${n}`, sub: (g) => `Digital sovereignty graded ${g}`,
        descFallback: (n, g, s) => `${n} gets grade ${g} (${s}/100) on TrustiScore: where the data lives, who can access it, and which European alternatives to choose.`,
        score: 'Score', outOf: 'out of 100', assessed: 'Assessed on', provisional: 'Provisional assessment: some points are still to be confirmed.',
        range: (a, b) => `Depending on these points, the score could range from ${a} to ${b}.`,
        facts: 'At a glance', developer: 'Publisher', category: 'Category', european: 'European publisher', openSource: 'Open source', license: 'Licence', website: 'Official website',
        yes: 'Yes', no: 'No', unknown: 'Not specified',
        criteria: 'The 5 criteria in detail', weight: 'weight', points: 'points', sources: 'Sources', toConfirm: 'to be confirmed',
        alternatives: (n) => `Better-rated alternatives to ${n}`, noAlt: 'No better-rated alternative is listed in this category yet.',
        openTrusti: 'Open in the Trusti app', installTrusti: 'Get Trusti on Google Play', openShort: 'Open in Trusti', download: 'Download', stickyText: (n, g) => `${n}: grade ${g}`, method: 'How the grade is calculated',
        contest: 'Spotted a mistake? Contest the grade', contestSubject: 'Grade dispute',
        attribution: 'Data licensed under CC BY 4.0, reusable through the open API.', api: 'Open API',
        listTitle: 'Rated apps - digital sovereignty from A to E | TrustiScore',
        listH1: 'All rated apps', listIntro: (n) => `${n} apps and services assessed on 5 criteria: jurisdiction, data location, technical control, compliance, transparency. Click an app to see the details of its grade and its alternatives.`,
        listDesc: (n) => `The digital sovereignty grade (A to E) of ${n} apps: messaging, e-mail, AI, cloud, social networks… and their European alternatives.`,
        gradeHead: { A: 'Grade A - Sovereign and private', B: 'Grade B - Good', C: 'Grade C - Average', D: 'Grade D - Risky', E: 'Grade E - Critical' },
        filter: 'Filter by name', apps: 'apps', footer: 'For European digital sovereignty',
        legal: 'Legal notice', privacy: 'Privacy', simulator: 'Simulator', skip: 'Skip to content', langNav: 'Language',
        unavailable: 'App pages are temporarily unavailable. Please try again in a few minutes.',
    },
    de: {
        home: 'Startseite', list: 'Bewertete Apps', prefix: 'de/',
        titleApp: (n, g) => `${n}: TrustiScore-Note ${g} - Daten, DSGVO, Alternativen`,
        h1App: (n) => `${n}`, sub: (g) => `Digitale Souveränität: Note ${g}`,
        descFallback: (n, g, s) => `${n} erhält die TrustiScore-Note ${g} (${s}/100): wo die Daten liegen, wer darauf zugreifen kann und welche europäischen Alternativen es gibt.`,
        score: 'Punktzahl', outOf: 'von 100', assessed: 'Bewertet am', provisional: 'Vorläufige Bewertung: Einige Punkte sind noch zu bestätigen.',
        range: (a, b) => `Je nach diesen Punkten könnte die Punktzahl zwischen ${a} und ${b} liegen.`,
        facts: 'Auf einen Blick', developer: 'Anbieter', category: 'Kategorie', european: 'Europäischer Anbieter', openSource: 'Open Source', license: 'Lizenz', website: 'Offizielle Website',
        yes: 'Ja', no: 'Nein', unknown: 'Keine Angabe',
        criteria: 'Die 5 Kriterien im Detail', weight: 'Gewicht', points: 'Punkte', sources: 'Quellen', toConfirm: 'zu bestätigen',
        alternatives: (n) => `Besser bewertete Alternativen zu ${n}`, noAlt: 'In dieser Kategorie ist noch keine besser bewertete Alternative erfasst.',
        openTrusti: 'In der Trusti-App öffnen', installTrusti: 'Trusti bei Google Play laden', openShort: 'In Trusti öffnen', download: 'Herunterladen', stickyText: (n, g) => `${n}: Note ${g}`, method: 'So wird die Note berechnet',
        contest: 'Fehler entdeckt? Note anfechten', contestSubject: 'Anfechtung einer Note',
        attribution: 'Daten unter CC BY 4.0, wiederverwendbar über die offene API.', api: 'Offene API',
        listTitle: 'Bewertete Apps - digitale Souveränität von A bis E | TrustiScore',
        listH1: 'Alle bewerteten Apps', listIntro: (n) => `${n} Apps und Dienste, bewertet nach 5 Kriterien: Rechtsraum, Datenstandort, technische Kontrolle, Konformität, Transparenz. Klicken Sie auf eine App, um die Details der Note und ihre Alternativen zu sehen.`,
        listDesc: (n) => `Die Note für digitale Souveränität (A bis E) von ${n} Apps: Messenger, E-Mail, KI, Cloud, soziale Netzwerke… und ihre europäischen Alternativen.`,
        gradeHead: { A: 'Note A - Souverän und privat', B: 'Note B - Gut', C: 'Note C - Mittel', D: 'Note D - Riskant', E: 'Note E - Kritisch' },
        filter: 'Nach Namen filtern', apps: 'Apps', footer: 'Für europäische digitale Souveränität',
        legal: 'Impressum', privacy: 'Datenschutz', simulator: 'Simulator', skip: 'Zum Inhalt springen', langNav: 'Sprache',
        unavailable: 'Die App-Seiten sind vorübergehend nicht verfügbar. Bitte versuchen Sie es in einigen Minuten erneut.',
    },
};
const GRADES = ['A', 'B', 'C', 'D', 'E'];
const TRUSTI_PLAY = 'https://play.google.com/store/apps/details?id=eu.trusti.app';
/** Lien vers l'app web, marqué ?src=site pour compter les visites venues des fiches (journal du serveur de l'app). */
const trustiLink = (url) => {
    try { const u = new URL(safeUrl(url) || 'https://app.trusti-score.eu/'); u.searchParams.set('src', 'site'); return u.toString(); } catch { return 'https://app.trusti-score.eu/?src=site'; }
};
/** Lien Play Store de Trusti avec un referrer UTM : la console Play montre les installations venues des fiches. */
const trustiPlayLink = (slug) => `${TRUSTI_PLAY}&referrer=${encodeURIComponent(`utm_source=trusti-score.eu&utm_medium=fiche&utm_campaign=${slug}`)}`;
const LOCALE = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE' };

// ---------------------------------------------------------------- utilitaires
const decode = (s) => String(s ?? '')
    .replace(/&nbsp;/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const esc = (s) => decode(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeUrl = (u) => (typeof u === 'string' && /^https?:\/\/[^\s"<>]+$/i.test(u) ? u : null);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const clip = (s, n) => { s = decode(s).replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };
const fmtDate = (d, lang) => { const t = Date.parse(d); return Number.isNaN(t) ? '' : new Date(t).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };
const pageUrl = (lang, rest = '') => `${SITE}/${T[lang].prefix}${rest}`;
const abs = (lang, rest = '') => `/${T[lang].prefix}${rest}`;

export function slugify(s) {
    return decode(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
}

/** Adresse lisible et stable : l'identifiant s'il est déjà propre, sinon le nom (avant « : » ou « - »). */
export function buildSlugs(apps) {
    const bySlug = new Map();
    const sorted = [...apps].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const clean = (id) => /^[a-z][a-z0-9-]{1,59}$/.test(id) && !id.startsWith('app-');
    // D'abord les identifiants propres (prioritaires), puis les autres.
    for (const pass of [true, false]) {
        for (const a of sorted) {
            const id = String(a.id);
            if (clean(id) !== pass) continue;
            let base = pass ? id : slugify(String(a.name).split(/\s[-–—|]\s|:|\(/)[0]) || slugify(a.name) || 'app';
            let slug = base, i = 2;
            while (bySlug.has(slug)) slug = `${base}-${i++}`;
            bySlug.set(slug, id);
        }
    }
    const byId = new Map([...bySlug].map(([s, id]) => [id, s]));
    return { bySlug, byId };
}

async function getJson(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    try {
        const r = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json', 'user-agent': 'trusti-score-site' } });
        if (!r.ok) throw new Error(`HTTP ${r.status} sur ${url}`);
        return await r.json();
    } finally { clearTimeout(timer); }
}

// ---------------------------------------------------------------- données (cache)
let store = null;           // { at, slugs, apps: { fr: Map(id → app), en, de }, list: [ids] }
let loading = null;
let lastFullLoad = 0;
async function loadData() {
    lastFullLoad = Date.now();
    const exports = await Promise.all(LANGS.map((l) => getJson(`${API}/export?lang=${l}`)));
    const apps = {};
    LANGS.forEach((l, i) => { apps[l] = new Map(exports[i].data.filter((a) => a && a.id && GRADES.includes(a.grade)).map((a) => [String(a.id), a])); });
    const fr = [...apps.fr.values()];
    store = { at: Date.now(), slugs: buildSlugs(fr), apps, list: fr.map((a) => String(a.id)) };
    console.log(`📇 Fiches applications : ${fr.length} applications chargées`);
    return store;
}
/** Empreinte de ce qui compte pour le visiteur : note, score, évaluation, nom. */
const fingerprint = (a) => JSON.stringify([a.name, a.grade, a.gradeReason, a.assessment?.score ?? null, a.assessment?.provisional ?? null, a.assessment?.assessedAt ?? null, a.updatedAt ?? null]);

/**
 * Vérification rapide (toutes les 5 min) : la liste légère des apps est comparée aux données en mémoire.
 * Peu de changements → seules les fiches concernées sont rechargées ; sinon, export complet.
 */
let polling = false;
async function poll() {
    if (polling || loading || !store) return;
    polling = true;
    try {
        const list = [];
        for (let page = 1; page <= 20; page++) {
            const j = await getJson(`${API}/apps?per_page=100&page=${page}&lang=fr`);
            list.push(...(j.data || []));
            if (page >= (j.meta?.pagination?.totalPages || 1)) break;
        }
        const remote = new Map(list.filter((a) => a && a.id && GRADES.includes(a.grade)).map((a) => [String(a.id), a]));
        const changed = [...remote.keys()].filter((id) => store.apps.fr.has(id) && fingerprint(remote.get(id)) !== fingerprint(store.apps.fr.get(id)));
        const structural = remote.size !== store.apps.fr.size || [...remote.keys()].some((id) => !store.apps.fr.has(id));
        if (!changed.length && !structural) return;

        if (structural || changed.length > POLL_MAX_APPS) {
            if (Date.now() - lastFullLoad < FULL_RELOAD_MIN_GAP) return;   // on réessaiera au prochain passage
            console.log(`🔄 Fiches applications : ${structural ? 'apps ajoutées ou retirées' : `${changed.length} apps modifiées`}, rechargement complet`);
            loading = loadData().finally(() => { loading = null; });
            await loading;
        } else {
            for (const id of changed) {
                for (const lang of LANGS) {
                    const [app, detail] = await Promise.all([
                        getJson(`${API}/apps/${encodeURIComponent(id)}?lang=${lang}`),
                        getJson(`${API}/apps/${encodeURIComponent(id)}/assessment?lang=${lang}`).catch(() => ({ data: null })),
                    ]);
                    if (app?.data) store.apps[lang].set(id, { ...app.data, assessmentDetail: detail?.data ?? null });
                }
            }
            console.log(`🔄 Fiches applications mises à jour : ${changed.map((id) => store.apps.fr.get(id)?.name || id).join(', ')}`);
        }
        altCache.clear();   // une note qui change peut modifier les alternatives des autres apps
    } catch (e) {
        console.error('⚠️ Vérification des notes :', e.message);
    } finally { polling = false; }
}

async function data() {
    if (store && Date.now() - store.at < DATA_TTL) return store;
    if (!loading) loading = loadData().catch((e) => { console.error('❌ Fiches applications :', e.message); if (store) store.at = Date.now() - DATA_TTL + 5 * 60 * 1000; return store; }).finally(() => { loading = null; });
    // Données périmées mais présentes : on les sert tout de suite, le rechargement continue en arrière-plan.
    return store || loading;
}

const altCache = new Map();   // `${id}:${lang}` → { at, ids }
let altWindow = { start: 0, count: 0 };
async function alternatives(s, id, lang) {
    const key = `${id}:${lang}`;
    const hit = altCache.get(key);
    if (hit && Date.now() - hit.at < ALT_TTL) return hit.ids;
    const now = Date.now();
    if (now - altWindow.start > 60000) altWindow = { start: now, count: 0 };
    let ids = null;
    if (altWindow.count < ALT_CALLS_PER_MIN) {
        altWindow.count++;
        try {
            const j = await getJson(`${API}/apps/${encodeURIComponent(id)}/alternatives?lang=${lang}`);
            ids = (j.data || []).map((a) => String(a.id)).filter((x) => s.apps.fr.has(x));
            altCache.set(key, { at: now, ids });
        } catch { /* on se rabat sur la catégorie */ }
    }
    if (!ids || !ids.length) {
        // Repli : mêmes catégorie, meilleure note, les mieux classées d'abord.
        const app = s.apps.fr.get(id);
        const rank = (a) => GRADES.indexOf(a.grade);
        ids = [...s.apps.fr.values()]
            .filter((a) => a.category && a.category === app.category && rank(a) < rank(app))
            .sort((a, b) => rank(a) - rank(b) || (b.assessment?.score ?? 0) - (a.assessment?.score ?? 0))
            .slice(0, 6).map((a) => String(a.id));
        if (hit) ids = hit.ids.length ? hit.ids : ids;
    }
    return ids.slice(0, 8);
}

// ---------------------------------------------------------------- traductions des critères (config du site)
function criteriaLabels(publicDir) {
    const out = { fr: {}, en: {}, de: {} };
    try {
        const fr = JSON.parse(fs.readFileSync(path.join(publicDir, 'assets', 'config.json'), 'utf8')).criteria;
        for (const lang of LANGS) {
            let tr = {};
            if (lang !== 'fr') { try { tr = JSON.parse(fs.readFileSync(path.join(publicDir, 'assets', 'i18n', `config.${lang}.json`), 'utf8')).criteria || {}; } catch { /* FR par défaut */ } }
            for (const [key, c] of Object.entries(fr)) {
                const t = tr[key] || {};
                const levels = {};
                (c.options || []).forEach((o, i) => {
                    const lab = (t.options?.[i]?.label || o.label || '').replace(/^\s*\d+\s*pts?\s*-\s*/i, '');
                    levels[o.value] = { label: lab, description: t.options?.[i]?.description || o.description || '' };
                });
                out[lang][key] = { name: t.name || c.name, description: t.description || c.description, levels };
            }
        }
    } catch (e) { console.error('⚠️ Libellés des critères introuvables :', e.message); }
    return out;
}

// ---------------------------------------------------------------- gabarit
const STYLE = `
    .badge-a { background: var(--ga); color: var(--ga-ink); } .badge-b { background: var(--gb); color: var(--gb-ink); }
    .badge-c { background: var(--gc); color: var(--gc-ink); } .badge-d { background: var(--gd); color: var(--gd-ink); }
    .badge-e { background: var(--ge); color: var(--ge-ink); }
    .crumbs { font-size: .9rem; margin: 0 0 8px; } .crumbs a { color: inherit; }
    .app-head { display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; }
    .app-icon { width: 64px; height: 64px; border-radius: 14px; background: #fff; object-fit: contain; flex: none; }
    .app-icon.sm { width: 32px; height: 32px; border-radius: 8px; }
    .grade { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 14px; font-size: 2rem; font-weight: 900; flex: none; }
    .grade.sm { width: 36px; height: 36px; font-size: 1.2rem; border-radius: 10px; }
    .score-line { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin: 0 0 12px; }
    .score-line strong { font-size: 1.4rem; }
    .note { background: var(--warn-bg); border-left: 4px solid var(--warn-line); color: var(--warn-ink); padding: 10px 14px; border-radius: 8px; }
    .facts { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; margin: 0; } main dl.facts dt, main dl.facts dd { margin: 0; padding: 0; line-height: 1.5; } .facts dt { font-weight: 700; } .facts dd { overflow-wrap: anywhere; }
    .crit { border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 16px; margin: 0 0 12px; background: var(--paper-2); }
    .crit h3 { margin: 0 0 4px; font-size: 1.05rem; } .crit .lvl { margin: 0 0 6px; color: var(--ink-2); }
    .pts { display: inline-block; min-width: 3.2em; font-weight: 800; }
    .crit ul { margin: 6px 0 0; padding-left: 1.2em; font-size: .9rem; } .crit li { overflow-wrap: anywhere; }
    .alts, .app-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
    .alts a, .app-list a { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--paper-2); color: var(--ink); text-decoration: none; min-height: 48px; }
    .alts a:hover, .app-list a:hover { border-color: var(--accent); }
    .alts .nm, .app-list .nm { font-weight: 700; } .alts small, .app-list small { display: block; color: var(--ink-2); }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin: 12px 0 0; }
    .grade-group h2 { display: flex; gap: 12px; align-items: center; }
    .filter { width: 100%; max-width: 420px; padding: 10px 12px; border: 1px solid var(--line-strong); border-radius: 10px; font: inherit; margin: 0 0 16px; }
    .fine { font-size: .875rem; color: var(--ink-2); }
    .cta-top { justify-content: center; }
    .sticky-cta { position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; display: flex; align-items: center; gap: 10px;
        padding: 10px max(16px, env(safe-area-inset-right, 0px)) calc(10px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
        background: var(--paper-2); border-top: 1px solid var(--line); box-shadow: 0 -2px 12px rgba(31, 58, 95, .12);
        transform: translateY(110%); transition: transform .2s ease; }
    .sticky-cta.visible { transform: translateY(0); }
    .sticky-cta .txt { flex: 1; min-width: 0; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sticky-cta .btn { flex: none; padding: 8px 14px; }
    @media (min-width: 760px) { .sticky-cta { display: none; } }
    @media (max-width: 759px) { body.has-sticky { padding-bottom: 72px; } }
    @media (prefers-reduced-motion: reduce) { .sticky-cta { transition: none; } }
`;

function layout({ lang, title, description, canonicalPath, alternatesPath, robots, ogImage, jsonLd, header, main, extraHead = '' }) {
    const t = T[lang];
    const href = (l) => `${SITE}/${T[l].prefix}${alternatesPath}`;
    const sw = LANGS.map((l) => `<a href="${abs(l, alternatesPath)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`).join('');
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="robots" content="${robots}">
    <meta name="description" content="${esc(description)}">
    <link rel="icon" type="image/png" href="/assets/logo.png">
${LANGS.map((l) => `    <link rel="alternate" hreflang="${l}" href="${href(l)}">`).join('\n')}
    <link rel="alternate" hreflang="x-default" href="${href('fr')}">
    <link rel="canonical" href="${SITE}/${canonicalPath}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="TrustiScore">
    <meta property="og:locale" content="${LOCALE[lang].replace('-', '_')}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${SITE}/${canonicalPath}">
    <meta property="og:image" content="${ogImage}">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
    <title>${esc(title)}</title>
    <link rel="stylesheet" href="/assets/trusti.css">
    <style>${STYLE}</style>${extraHead}
</head>
<body>
    <a href="#contenu" class="skip-link">${t.skip}</a>
    <header>
${header}
        <nav class="lang-switch" aria-label="${t.langNav}">${sw}</nav>
    </header>
    <main id="contenu" class="container">
${main}
    </main>
    <footer>
        <nav class="footer-links" aria-label="TrustiScore">
            <a href="${abs(lang)}">${t.home}</a>
            <a href="${abs(lang, 'applications')}">${t.list}</a>
            <a href="${abs(lang, 'simulateur')}">${t.simulator}</a>
            <a href="${abs(lang, 'developpeurs')}">${t.api}</a>
            <a href="${abs(lang, 'mentions-legales')}">${t.legal}</a>
            <a href="${abs(lang, 'confidentialite')}">${t.privacy}</a>
        </nav>
        <p>&copy; ${new Date().getUTCFullYear()} TrustiScore - ${t.footer}</p>
    </footer>
</body>
</html>`;
}

const badge = (g, cls = '') => `<span class="grade ${cls} badge-${g.toLowerCase()}">${g}</span>`;
const icon = (a, size = 64, cls = 'app-icon') => (safeUrl(a.icon) ? `<img class="${cls}" src="${esc(a.icon)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '');

function renderApp(s, id, lang, altIds, labels, robots) {
    const t = T[lang];
    const a = s.apps[lang].get(id) || s.apps.fr.get(id);
    const fr = s.apps.fr.get(id);
    const slug = s.slugs.byId.get(id);
    const d = a.assessmentDetail || {};
    const score = d.score ?? a.assessment?.score;
    const name = decode(fr.name);
    const shortName = decode(String(fr.name).split(/\s[-–—|]\s|:/)[0]).trim() || name;
    const summary = decode(d.summary || '');
    const description = clip(summary || t.descFallback(shortName, a.grade, score), 158);
    const pathRel = `applications/${slug}`;
    const L = labels[lang] || {};

    const stores = [['playStore', 'Google Play'], ['appStore', 'App Store'], ['fDroid', 'F-Droid'], ['github', 'GitHub']]
        .filter(([k]) => safeUrl(a.links?.[k])).map(([k, n]) => `<a href="${esc(a.links[k])}" rel="nofollow noopener noreferrer" target="_blank">${n}</a>`).join(' · ');
    const openHref = esc(trustiLink(a.trustiUrl));
    const playHref = esc(trustiPlayLink(slug));
    const yesNo = (v) => (v === true ? t.yes : v === false ? t.no : t.unknown);
    const facts = [
        a.developer && [t.developer, esc(a.developer)],
        lang === 'fr' && a.category && [t.category, esc(a.category)],
        [t.european, yesNo(a.isEuropean)],
        [t.openSource, yesNo(a.isOpenSource)],
        a.license && [t.license, esc(a.license)],
        stores && [t.download, `<span class="store-links">${stores}</span>`],
        safeUrl(a.website) && [t.website, `<a href="${esc(a.website)}" rel="nofollow noopener noreferrer" target="_blank">${esc(host(a.website))}</a>`],
    ].filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

    const order = ['gouvernance', 'localisation', 'controle', 'conformite', 'transparence'];
    const crits = [...(d.criteria || [])].sort((x, y) => order.indexOf(x.key) - order.indexOf(y.key)).map((c) => {
        const lab = L[c.key] || {};
        const lvl = lab.levels?.[c.points] || {};
        const srcs = (c.sources || []).map((src) => safeUrl(src.url) && `<li><a href="${esc(src.url)}" rel="nofollow noopener noreferrer" target="_blank">${esc(host(src.url))}</a>${src.toConfirm ? ` (${t.toConfirm})` : ''}</li>`).filter(Boolean);
        return `            <div class="crit">
                <h3>${esc(lab.name || c.name)} <span class="fine">(${t.weight} ${c.weight}&nbsp;%)</span></h3>
                <p class="lvl"><span class="pts">${c.points}/4</span> ${esc(lvl.label || c.level || '')}${lvl.description || c.levelDescription ? ` - ${esc(lvl.description || c.levelDescription)}` : ''}${c.provisional ? ` <em>(${t.toConfirm})</em>` : ''}</p>
                ${c.rationale ? `<p>${esc(c.rationale)}</p>` : ''}
                ${srcs.length ? `<ul aria-label="${t.sources}">${srcs.join('')}</ul>` : ''}
            </div>`;
    }).join('\n');

    const alts = altIds.map((x) => s.apps[lang].get(x) || s.apps.fr.get(x)).filter(Boolean).map((b) => {
        const bs = s.slugs.byId.get(String(b.id));
        return `<li><a href="${abs(lang, `applications/${esc(bs)}`)}">${badge(b.grade, 'sm')}${icon(b, 36, 'app-icon sm')}<span><span class="nm">${esc(s.apps.fr.get(String(b.id)).name)}</span>${b.developer ? `<small>${esc(b.developer)}</small>` : ''}</span></a></li>`;
    }).join('');

    const contestUrl = `https://github.com/notsogeek87/trusti-score/issues/new?title=${encodeURIComponent(`${t.contestSubject} : ${name}`)}`;

    const header = `        <p class="crumbs"><a href="${abs(lang)}">${t.home}</a> › <a href="${abs(lang, 'applications')}">${t.list}</a></p>
        <div class="app-head">${icon(a)}<h1>${esc(t.h1App(shortName))}</h1></div>
        <p>${esc(t.sub(a.grade))}</p>
        <div class="actions cta-top" id="ctaTop"><a class="btn btn-primary" href="${openHref}" target="_blank" rel="noopener">${t.openTrusti}</a><a class="btn btn-ghost" href="${playHref}" target="_blank" rel="noopener">${t.installTrusti}</a></div>`;

    const sticky = `
        <div class="sticky-cta" id="stickyCta" aria-hidden="true">
            ${badge(a.grade, 'sm')}<span class="txt">${esc(t.stickyText(shortName, a.grade))}</span>
            <a class="btn btn-primary" href="${openHref}" target="_blank" rel="noopener" tabindex="-1">${t.openShort}</a>
        </div>
        <script>(function(){var b=document.getElementById('stickyCta'),c=document.getElementById('ctaTop');if(!b||!c||!('IntersectionObserver' in window))return;document.body.classList.add('has-sticky');var l=b.querySelector('a');new IntersectionObserver(function(e){var v=!e[0].isIntersecting&&e[0].boundingClientRect.top<0;b.classList.toggle('visible',v);b.setAttribute('aria-hidden',v?'false':'true');l.tabIndex=v?0:-1;}).observe(c);})();</script>`;
    const main = `        <section>
            <div class="sec-inner">
                <div class="score-line">${badge(a.grade)}<span><strong>${score ?? '?'}</strong> ${t.outOf}</span>${d.assessedAt || a.assessment?.assessedAt ? `<span class="fine">${t.assessed} ${fmtDate(d.assessedAt || a.assessment.assessedAt, lang)}</span>` : ''}</div>
                ${summary ? `<p>${esc(summary)}</p>` : ''}
                ${d.provisional || a.assessment?.provisional ? `<p class="note">${t.provisional}${d.scoreRange && !/\d+\s*\(?[A-E]\)?\s*(à|to|bis|und)\s*\d+/.test(summary) ? ' ' + t.range(d.scoreRange.min, d.scoreRange.max) : ''}</p>` : ''}
            </div>
        </section>
        <section>
            <div class="sec-inner">
                <h2>${t.facts}</h2>
                <dl class="facts">${facts}</dl>
            </div>
        </section>
        <section class="band">
            <div class="sec-inner">
                <h2>${t.criteria}</h2>
${crits}
                <p><a href="${abs(lang)}#methode">${t.method}</a> · <a href="${esc(contestUrl)}" rel="nofollow noopener" target="_blank">${t.contest}</a></p>
            </div>
        </section>
        <section>
            <div class="sec-inner wide">
                <h2>${esc(t.alternatives(shortName))}</h2>
                ${alts ? `<ul class="alts">${alts}</ul>` : `<p>${t.noAlt}</p>`}
                <p class="fine">${t.attribution} <a href="${abs(lang, 'developpeurs')}">${t.api}</a></p>
            </div>
        </section>${sticky}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'SoftwareApplication', name, url: `${SITE}/${T[lang].prefix}${pathRel}`,
                ...(a.developer ? { author: { '@type': 'Organization', name: decode(a.developer) } } : {}),
                ...(safeUrl(a.icon) ? { image: a.icon } : {}),
                ...(a.links?.playStore || a.links?.appStore ? { operatingSystem: [a.links?.playStore && 'Android', a.links?.appStore && 'iOS'].filter(Boolean).join(', ') } : {}),
                review: {
                    '@type': 'Review',
                    author: { '@type': 'Organization', name: 'TrustiScore', url: `${SITE}/` },
                    ...(d.assessedAt ? { datePublished: d.assessedAt } : {}),
                    reviewBody: summary || undefined,
                    reviewRating: { '@type': 'Rating', ratingValue: score, bestRating: 100, worstRating: 0 },
                },
            },
            {
                '@type': 'BreadcrumbList', itemListElement: [
                    { '@type': 'ListItem', position: 1, name: t.home, item: pageUrl(lang) },
                    { '@type': 'ListItem', position: 2, name: t.list, item: pageUrl(lang, 'applications') },
                    { '@type': 'ListItem', position: 3, name: shortName },
                ],
            },
        ],
    };
    const og = `${SITE}/assets/og-image${lang === 'fr' ? '' : `-${lang}`}.png`;
    return layout({ lang, title: t.titleApp(shortName, a.grade), description, canonicalPath: `${T[lang].prefix}${pathRel}`, alternatesPath: pathRel, robots, ogImage: og, jsonLd, header, main });
}

function renderList(s, lang, robots) {
    const t = T[lang];
    const all = s.list.map((id) => s.apps[lang].get(id) || s.apps.fr.get(id));
    const groups = GRADES.map((g) => {
        const items = all.filter((a) => a.grade === g).sort((x, y) => decode(s.apps.fr.get(String(x.id)).name).localeCompare(decode(s.apps.fr.get(String(y.id)).name), 'fr', { sensitivity: 'base' }));
        if (!items.length) return '';
        const li = items.map((a) => `<li><a href="${abs(lang, `applications/${esc(s.slugs.byId.get(String(a.id)))}`)}" data-n="${esc(decode(s.apps.fr.get(String(a.id)).name).toLowerCase())}">${icon(a, 32, 'app-icon sm')}<span><span class="nm">${esc(s.apps.fr.get(String(a.id)).name)}</span>${lang === 'fr' && a.category ? `<small>${esc(a.category)}</small>` : a.developer ? `<small>${esc(a.developer)}</small>` : ''}</span></a></li>`).join('');
        return `        <section class="grade-group" id="note-${g.toLowerCase()}">
            <div class="sec-inner wide">
                <h2>${badge(g, 'sm')} ${t.gradeHead[g]} <span class="fine">(${items.length} ${t.apps})</span></h2>
                <ul class="app-list">${li}</ul>
            </div>
        </section>`;
    }).join('\n');
    const n = all.length;
    const header = `        <p class="crumbs"><a href="${abs(lang)}">${t.home}</a></p>
        <h1>${t.listH1}</h1>
        <p>${esc(t.listIntro(n))}</p>`;
    const main = `        <section>
            <div class="sec-inner wide">
                <label class="fine" for="flt">${t.filter}</label><br>
                <input id="flt" class="filter" type="search" autocomplete="off">
                <p>${GRADES.map((g) => `<a href="#note-${g.toLowerCase()}">${t.gradeHead[g]}</a>`).join(' · ')}</p>
            </div>
        </section>
${groups}`;
    const filterJs = `
    <script>document.addEventListener('DOMContentLoaded',function(){var f=document.getElementById('flt');if(!f)return;f.addEventListener('input',function(){var q=f.value.trim().toLowerCase();document.querySelectorAll('.app-list a').forEach(function(a){a.parentNode.hidden=q&&a.getAttribute('data-n').indexOf(q)<0;});});});</script>`;
    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.listH1, url: pageUrl(lang, 'applications'), inLanguage: lang,
        isPartOf: { '@type': 'WebSite', name: 'TrustiScore', url: `${SITE}/` },
        mainEntity: { '@type': 'ItemList', numberOfItems: n },
    };
    const og = `${SITE}/assets/og-image${lang === 'fr' ? '' : `-${lang}`}.png`;
    return layout({ lang, title: t.listTitle, description: clip(t.listDesc(n), 158), canonicalPath: `${T[lang].prefix}applications`, alternatesPath: 'applications', robots, ogImage: og, jsonLd, header, main, extraHead: filterJs });
}

function renderSitemap(s) {
    const alt = (rest) => [...LANGS.map((l) => [l, l]), ['x-default', 'fr']].map(([hl, l]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${pageUrl(l, rest)}"/>`).join('\n');
    const entry = (rest, lastmod) => LANGS.map((l) => `  <url>\n    <loc>${pageUrl(l, rest)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}${alt(rest)}\n  </url>`).join('\n');
    const latest = (a) => [a.updatedAt, a.assessmentDetail?.assessedAt, a.assessment?.assessedAt].map((x) => Date.parse(x)).filter((x) => !Number.isNaN(x)).sort().pop();
    const day = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : '');
    const apps = s.list.map((id) => s.apps.fr.get(id));
    const newest = Math.max(...apps.map(latest).filter(Boolean));
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entry('applications', day(newest))}
${apps.map((a) => entry(`applications/${s.slugs.byId.get(String(a.id))}`, day(latest(a)))).join('\n')}
</urlset>
`;
}

// ---------------------------------------------------------------- routes
/**
 * Monte les routes des fiches. L'indexation suit celle de la page d'accueil :
 * tant que index.html est en noindex, les fiches le sont aussi.
 */
export function mountAppPages(app, publicDir) {
    const labels = criteriaLabels(publicDir);
    const robots = () => {
        try { return /<meta name="robots" content="[^"]*noindex/.test(fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8')) ? 'noindex, nofollow' : 'index, follow'; } catch { return 'noindex, nofollow'; }
    };
    const ROBOTS = robots();
    const send = (res, html, maxAge = PAGE_MAX_AGE) => res.set('Cache-Control', `public, max-age=${maxAge}`).type('html').send(html);
    const unavailable = (res, lang) => res.status(503).set('Retry-After', '300').type('html').send(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>TrustiScore</title><link rel="stylesheet" href="/assets/trusti.css"></head><body><main class="container"><p>${T[lang].unavailable}</p><p><a href="/">TrustiScore</a></p></main></body></html>`);

    // Chargement initial en arrière-plan, sans bloquer le démarrage.
    data().catch(() => {});
    setInterval(() => { poll(); }, POLL_EVERY).unref();

    for (const lang of LANGS) {
        const prefix = lang === 'fr' ? '' : `/${lang}`;
        app.get(`${prefix}/applications/`, (req, res, next) => (req.path.endsWith('/') ? res.redirect(301, `${prefix}/applications`) : next()));
        app.get(`${prefix}/applications`, async (req, res, next) => {
            try { const s = await data(); if (!s) return unavailable(res, lang); send(res, renderList(s, lang, ROBOTS)); } catch (e) { next(e); }
        });
        app.get(`${prefix}/applications/:slug`, async (req, res, next) => {
            try {
                const s = await data();
                if (!s) return unavailable(res, lang);
                const raw = String(req.params.slug);
                let id = s.slugs.bySlug.get(raw);
                if (!id) {
                    // Ancien lien par identifiant ou adresse en majuscules : redirection vers l'adresse canonique.
                    const slug = s.slugs.byId.get(raw) || (s.slugs.bySlug.has(raw.toLowerCase()) ? raw.toLowerCase() : null);
                    if (slug) return res.redirect(301, `${prefix}/applications/${slug}`);
                    return next();   // → page 404
                }
                const alt = await alternatives(s, id, lang);
                send(res, renderApp(s, id, lang, alt, labels, ROBOTS));
            } catch (e) { next(e); }
        });
    }
    app.get('/sitemap-applications.xml', async (req, res, next) => {
        try { const s = await data(); if (!s) return res.status(503).set('Retry-After', '300').end(); res.set('Cache-Control', 'public, max-age=3600').type('application/xml').send(renderSitemap(s)); } catch (e) { next(e); }
    });
}
