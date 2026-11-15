#!/usr/bin/env node
/**
 * Contrôle des traductions du site (FR → EN, DE). Sans dépendance : `node scripts/check-i18n.mjs`.
 *
 * Vérifie que :
 *  1. chaque page FR a sa version dans en/ et de/ ;
 *  2. chaque version a la bonne langue, les liens hreflang et le sélecteur de langue ;
 *  3. les trois versions ont la même structure (id, balises, liens, scripts, images) ;
 *  4. les pages traduites pointent vers ../assets/ (et non assets/) ;
 *  5. la traduction de la configuration (assets/i18n/config.<lang>.json) couvre tous les
 *     textes de la configuration publiée (backend/seed-config.json), sans clé en trop ;
 *  6. les traductions ont été mises à jour après la dernière modification des pages FR
 *     (empreintes enregistrées dans i18n.manifest.json).
 *
 * Après avoir mis à jour les traductions d'une page FR modifiée :
 *   node scripts/check-i18n.mjs --update   (réenregistre les empreintes, puis revérifie)
 *
 * Voir docs/guides/traduction.md.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://trusti-score.eu';
const PAGES = ['index.html', 'simulateur.html', 'liens.html', 'mentions-legales.html', 'confidentialite.html', 'presentation.html'];
const LANGS = ['fr', 'en', 'de'];
const TRANSLATED = LANGS.filter((l) => l !== 'fr');
// Valeurs de la configuration qui ne se traduisent pas
const CONFIG_SKIP = new Set(['icon', 'id', 'type', 'siteName']);
const MANIFEST = join(ROOT, 'i18n.manifest.json');

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const read = (rel) => readFileSync(join(ROOT, rel), 'utf-8');
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const pathOf = (lang, page) => (lang === 'fr' ? page : `${lang}/${page}`);

// ---------- Pages ----------

function all(re, s) {
    return [...s.matchAll(re)].map((m) => m[1]);
}

function langSwitches(s) {
    return all(/<nav class="lang-switch"[^>]*>([\s\S]*?)<\/nav>/g, s);
}

// Sélecteur de langue et notes propres à une traduction (attribut data-i18n-note,
// ex. « seule la version française fait foi ») : exclus de la comparaison de structure.
function withoutSwitches(s) {
    return s
        .replace(/<nav class="lang-switch"[^>]*>[\s\S]*?<\/nav>/g, '')
        .replace(/<(\w+) data-i18n-note[^>]*>[\s\S]*?<\/\1>/g, '');
}

function normalizeHref(h) {
    h = h.replace(/^(\.\.\/)+/, '');
    if (/^mailto:|github\.com\/[^"]*\/issues\/new/.test(h)) h = h.split('?')[0];
    return h;
}

/** Empreinte structurelle : ce qui doit être identique d'une langue à l'autre. */
function structure(s) {
    s = withoutSwitches(s);
    const tags = {};
    for (const t of s.matchAll(/<(section|h[1-6]|ul|ol|li|a|button|dialog|form|nav|p|img|svg|script|input|label)\b/g)) {
        tags[t[1]] = (tags[t[1]] || 0) + 1;
    }
    return {
        ids: all(/\sid="([^"]+)"/g, s).join(' '),
        tags: JSON.stringify(tags),
        hrefs: all(/\shref="([^"]*)"/g, s).filter((h) => !/^\.\.?\/?assets\/|^assets\//.test(h)).map(normalizeHref).join(' '),
        scripts: all(/<script[^>]*\ssrc="([^"]+)"/g, s).map(normalizeHref).join(' '),
        images: all(/\ssrc="([^"]+\.(?:png|jpe?g|svg|webp))"/g, s).map(normalizeHref).join(' '),
    };
}

function expectedHref(page, from, to) {
    if (from === to) return page;
    return (from === 'fr' ? '' : '../') + (to === 'fr' ? '' : `${to}/`) + page;
}

function checkPage(page) {
    const fr = read(page);
    const frStruct = structure(fr);
    for (const lang of LANGS) {
        const rel = pathOf(lang, page);
        if (!existsSync(join(ROOT, rel))) { err(`${rel} : page manquante`); continue; }
        const s = lang === 'fr' ? fr : read(rel);

        if (!new RegExp(`<html lang="${lang}"`).test(s)) err(`${rel} : <html lang="${lang}"> attendu`);

        const slug = page === 'index.html' ? '' : page.replace(/\.html$/, '');
        for (const l of [...LANGS, 'x-default']) {
            const url = `${SITE}/${l === 'fr' || l === 'x-default' ? '' : `${l}/`}${slug}`;
            if (!s.includes(`<link rel="alternate" hreflang="${l}" href="${url}">`)) err(`${rel} : lien hreflang="${l}" manquant ou faux (${url})`);
        }

        const switches = langSwitches(s);
        if (!switches.length) err(`${rel} : sélecteur de langue (.lang-switch) manquant`);
        for (const sw of switches) {
            for (const l of LANGS) {
                const want = expectedHref(page, lang, l);
                const m = sw.match(new RegExp(`<a href="([^"]*)" hreflang="${l}"[^>]*>`));
                if (!m) err(`${rel} : le sélecteur n'a pas de lien vers ${l}`);
                else if (m[1] !== want) err(`${rel} : le sélecteur pointe vers ${m[1]} pour ${l}, ${want} attendu`);
                else if ((l === lang) !== /aria-current="true"/.test(m[0])) err(`${rel} : aria-current mal placé dans le sélecteur`);
            }
        }

        if (lang === 'fr') continue;
        if (/\s(?:src|href)="assets\//.test(s) || /src=\\?"assets\//.test(s)) err(`${rel} : chemin assets/ relatif à la page, ../assets/ attendu`);
        const st = structure(s);
        for (const key of Object.keys(frStruct)) {
            if (st[key] !== frStruct[key]) {
                err(`${rel} : structure différente de ${page} (${key})\n    FR : ${frStruct[key]}\n    ${lang.toUpperCase()} : ${st[key]}`);
            }
        }
    }
}

// ---------- Configuration ----------

function stringLeaves(obj, path = [], out = new Map()) {
    if (Array.isArray(obj)) obj.forEach((v, i) => stringLeaves(v, [...path, i], out));
    else if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
            if (CONFIG_SKIP.has(k) && typeof v === 'string') continue;
            stringLeaves(v, [...path, k], out);
        }
    } else if (typeof obj === 'string') out.set(path.join('.'), obj);
    return out;
}

function allLeaves(obj, path = [], out = new Map()) {
    if (Array.isArray(obj)) obj.forEach((v, i) => allLeaves(v, [...path, i], out));
    else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) allLeaves(v, [...path, k], out);
    else out.set(path.join('.'), obj);
    return out;
}

function frConfigTexts() {
    return stringLeaves(JSON.parse(read('backend/seed-config.json')));
}

function checkConfig() {
    const fr = frConfigTexts();
    for (const lang of TRANSLATED) {
        const rel = `assets/i18n/config.${lang}.json`;
        if (!existsSync(join(ROOT, rel))) { err(`${rel} : fichier manquant`); continue; }
        let over;
        try { over = JSON.parse(read(rel)); } catch (e) { err(`${rel} : JSON invalide (${e.message})`); continue; }
        const leaves = allLeaves(over);
        for (const [path, value] of leaves) {
            if (typeof value !== 'string') err(`${rel} : ${path} n'est pas un texte (les nombres restent dans la configuration FR)`);
            else if (!fr.has(path)) err(`${rel} : ${path} n'existe pas dans la configuration FR`);
            else if (!value.trim()) err(`${rel} : ${path} est vide`);
        }
        for (const path of fr.keys()) if (!leaves.has(path)) err(`${rel} : traduction manquante pour ${path}`);
    }
}

// ---------- Fraîcheur ----------

function currentFingerprints() {
    const pages = {};
    for (const p of PAGES) pages[p] = sha(read(p));
    return { pages, config: sha(JSON.stringify([...frConfigTexts()])) };
}

function checkFreshness(update) {
    const now = currentFingerprints();
    if (update) {
        writeFileSync(MANIFEST, `${JSON.stringify({
            _note: 'Empreintes des sources FR au moment de la dernière mise à jour des traductions. Régénérer avec : node scripts/check-i18n.mjs --update',
            ...now,
        }, null, 2)}\n`);
        console.log('i18n.manifest.json mis à jour.');
        return;
    }
    if (!existsSync(MANIFEST)) { err('i18n.manifest.json manquant : lancer node scripts/check-i18n.mjs --update'); return; }
    const saved = JSON.parse(readFileSync(MANIFEST, 'utf-8'));
    for (const p of PAGES) {
        if (saved.pages?.[p] !== now.pages[p]) {
            err(`${p} a changé depuis la dernière traduction : mettre à jour en/${p} et de/${p}, puis lancer node scripts/check-i18n.mjs --update`);
        }
    }
    if (saved.config !== now.config) {
        warn('backend/seed-config.json : des textes FR ont changé depuis la dernière traduction. Mettre à jour assets/i18n/config.en.json et config.de.json, puis lancer node scripts/check-i18n.mjs --update');
    }
}

// ---------- Exécution ----------

const update = process.argv.includes('--update');
PAGES.forEach(checkPage);
checkConfig();
if (update && errors.length) {
    console.error('Empreintes non mises à jour : corriger d\'abord ces erreurs.');
} else {
    checkFreshness(update);
}

for (const w of warnings) console.warn(`::warning::${w}`);
for (const e of errors) console.error(`✗ ${e}`);
if (errors.length) {
    console.error(`\n${errors.length} erreur(s) de traduction.`);
    process.exit(1);
}
console.log(`✓ Traductions OK : ${PAGES.length} pages × ${LANGS.length} langues, configuration ${TRANSLATED.join(', ')}.`);
