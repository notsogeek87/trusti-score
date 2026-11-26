#!/usr/bin/env node
/**
 * Pages ES, IT, NL, PL, PT générées à partir des pages anglaises (en/*.html).
 *
 * Les pages anglaises servent de modèle : même balisage, mêmes scripts, mêmes chemins
 * (../assets/). Seuls les textes changent ; leur traduction vit dans
 * i18n/pages/<lang>.json, sous la forme { "texte anglais": "traduction" }.
 *
 *   node scripts/i18n-pages.mjs            régénère es/, it/, nl/, pl/, pt/ et met à jour
 *                                          le sélecteur de langue et les hreflang des pages FR, EN, DE
 *   node scripts/i18n-pages.mjs --missing  liste les textes anglais sans traduction (rien n'est écrit)
 *
 * Après une modification de page : FR, puis EN et DE à la main, puis ajouter dans
 * i18n/pages/<lang>.json les textes anglais que --missing signale, relancer sans option,
 * et enfin node scripts/check-i18n.mjs --update. Voir docs/guides/traduction.md.
 *
 * Textes extraits d'une page anglaise : texte entre balises (hors <style>, <pre>, JSON-LD,
 * commentaires), attributs alt / title / aria-label / placeholder / content (description,
 * og:title…), chaînes JavaScript qui ressemblent à une phrase, et paramètres subject / body /
 * title des e-mails et tickets GitHub pré-remplis (décodés). Un texte qui ne se traduit pas
 * (nom propre, adresse, code) figure dans le JSON avec la même valeur.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://trusti-score.eu';
const PAGES = ['index.html', 'simulateur.html', 'liens.html', 'mentions-legales.html', 'confidentialite.html', 'presentation.html', 'developpeurs.html'];
export const LANGS = ['fr', 'en', 'de', 'es', 'it', 'nl', 'pl', 'pt'];
const GENERATED = ['es', 'it', 'nl', 'pl', 'pt'];
const NAMES = { fr: 'Français', en: 'English', de: 'Deutsch', es: 'Español', it: 'Italiano', nl: 'Nederlands', pl: 'Polski', pt: 'Português' };
const OG_LOCALE = { es: 'es_ES', it: 'it_IT', nl: 'nl_NL', pl: 'pl_PL', pt: 'pt_PT' };
// Phrases JavaScript construites avec des variables : non extraites, remplacées telles quelles.
const TEMPLATES = {
    '`${filled} / ${total} criteria completed`': {
        es: '`${filled} / ${total} criterios completados`', it: '`${filled} / ${total} criteri completati`',
        nl: '`${filled} / ${total} criteria ingevuld`', pl: '`Wypełnione kryteria: ${filled} / ${total}`',
        pt: '`${filled} / ${total} critérios preenchidos`',
    },
};

const hasWords = (t) => /[A-Za-z]{2,}/.test(t);
const norm = (t) => t.replace(/\s+/g, ' ').trim();

/** Textes traduisibles d'une page : [{ start, end, text, kind }], sans chevauchement. */
function segments(src) {
    const out = [];
    const excluded = [...src.matchAll(/<style[\s\S]*?<\/style>|<pre[\s\S]*?<\/pre>|<script type="application\/ld\+json">[\s\S]*?<\/script>|<!--[\s\S]*?-->/g)]
        .map((m) => [m.index, m.index + m[0].length]);
    // Liens du sélecteur de langue (FR, EN…) : reconstruits à part ; son aria-label reste traduit.
    for (const m of src.matchAll(/(<nav class="lang-switch"[^>]*>)[\s\S]*?<\/nav>/g)) excluded.push([m.index + m[1].length, m.index + m[0].length]);
    const isExcl = (i) => excluded.some(([a, b]) => i >= a && i < b);
    const scripts = [...src.matchAll(/<script(?![^>]*\ssrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)]
        .map((m) => [m.index + m[0].indexOf('>') + 1, m.index + m[0].length - 9]);
    const inScript = (i) => scripts.some(([a, b]) => i >= a && i < b);

    // Texte après une balise (y compris dans du HTML construit en JavaScript)
    for (const m of src.matchAll(/(<[a-zA-Z][^<>]*>|<\/[a-zA-Z0-9]+>)([^<>]+)(?=<)/g)) {
        const start = m.index + m[1].length;
        const text = m[2];
        if (isExcl(start) || !hasWords(text)) continue;
        if (inScript(start) && /[{};]/.test(text)) continue;
        const lead = text.match(/^\s*/)[0].length;
        let core = text.slice(lead, text.length - text.match(/\s*$/)[0].length);
        if (inScript(start)) { const q = core.search(/['"`]\s*[+,)]/); if (q >= 0) core = core.slice(0, q).trimEnd(); }
        if (!hasWords(core)) continue;
        out.push({ start: start + lead, end: start + lead + core.length, text: core, kind: 'text' });
    }
    // Attributs
    for (const m of src.matchAll(/\s(alt|title|aria-label|placeholder|content|data-tooltip|data-label)="([^"]*)"/g)) {
        const start = m.index + m[0].indexOf('"') + 1;
        const val = m[2];
        if (isExcl(start) || !hasWords(val) || /^https?:|^\.\.?\/|\.png$|^width=|^[a-z_]+$|^summary_large_image$|' \+|\+ '/.test(val)) continue;
        if (m[1] === 'content') {
            const tag = src.slice(src.lastIndexOf('<', m.index), m.index);
            if (!/name="description"|property="og:(title|description|image:alt)"|name="twitter:(title|description)"/.test(tag)) continue;
        }
        if (m[1] === 'title' && Object.values(NAMES).includes(val)) continue;
        out.push({ start, end: start + val.length, text: val, kind: 'attr' });
    }
    // E-mails et tickets pré-remplis
    for (const m of src.matchAll(/href="((?:mailto:|https:\/\/github\.com\/[^"]*\/issues\/new)[^"?]*\?)([^"]*)"/g)) {
        let pos = m.index + 6 + m[1].length;
        for (const part of m[2].split('&amp;')) {
            const eq = part.indexOf('=');
            if (['subject', 'body', 'title'].includes(part.slice(0, eq))) {
                out.push({ start: pos + eq + 1, end: pos + part.length, text: decodeURIComponent(part.slice(eq + 1)).replace(/\n/g, '\\n'), kind: 'url' });
            }
            pos += part.length + 5;
        }
    }
    // Chaînes JavaScript qui ressemblent à une phrase
    for (const [a, b] of scripts) {
        for (const m of src.slice(a, b).matchAll(/(['"])((?:(?!\1)[^\\\n<>]|\\.)*?)\1/g)) {
            const v = m[2];
            if (!/[a-z]{3,} [a-zA-Z]{2,}/.test(v) || /^https?:|[{}]|^[\w-]+$|=|\$\{/.test(v)) continue;
            const start = a + m.index + 1;
            if (out.some((s) => start >= s.start && start < s.end)) continue;
            out.push({ start, end: start + v.length, text: v, kind: 'js' });
        }
    }
    out.sort((x, y) => x.start - y.start);
    const clean = [];
    let last = -1;
    for (const s of out) if (s.start >= last) { clean.push(s); last = s.end; }
    return { segs: clean, inScript };
}

const href = (page, from, to) => (from === to ? page : (from === 'fr' ? '' : '../') + (to === 'fr' ? '' : `${to}/`) + page);

/** Bloc <link rel="alternate" hreflang> : toutes les langues + x-default. */
function alternates(src, page) {
    const slug = page === 'index.html' ? '' : page.replace(/\.html$/, '');
    return src.replace(/(\s*)<link rel="alternate" hreflang="fr"[^>]*>(?:\s*<link rel="alternate" hreflang="[^"]+"[^>]*>)*/, (m, ws) =>
        [...LANGS, 'x-default'].map((l) => `${ws}<link rel="alternate" hreflang="${l}" href="${SITE}/${l === 'fr' || l === 'x-default' ? '' : `${l}/`}${slug}">`).join(''));
}

/** Sélecteurs de langue (<nav class="lang-switch">) : toutes les langues, attributs et séparateurs conservés. */
function langSwitch(src, page, lang) {
    return src.replace(/(<nav class="lang-switch"[^>]*>)([\s\S]*?)(<\/nav>)/g, (m, open, inner, close) => {
        const sep = inner.match(/<\/a>(\s*)<a/)?.[1] ?? '';
        const links = LANGS.map((l) => `<a href="${href(page, lang, l)}" hreflang="${l}" lang="${l}" title="${NAMES[l]}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`);
        return open + inner.match(/^\s*/)[0] + links.join(sep) + inner.match(/\s*$/)[0] + close;
    });
}

const allLangs = (s) => s.replace(/"inLanguage":\[[^\]]*\]/g, `"inLanguage":${JSON.stringify(LANGS)}`);

function translatePage(page, lang, dict, missing) {
    let src = readFileSync(join(ROOT, 'en', page), 'utf-8');
    const { segs, inScript } = segments(src);
    const pairs = [];
    for (const s of [...segs].reverse()) {
        const key = norm(s.text);
        if (!(key in dict)) { missing.add(key); continue; }
        const t = dict[key];
        if (t === key) continue;   // texte qui ne se traduit pas : laissé tel quel
        let out;
        if (s.kind === 'url') out = encodeURIComponent(t.replace(/\\n/g, '\n')).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
        else if (s.kind === 'attr') out = t.replace(/"/g, '&quot;');
        else out = t;
        if (inScript(s.start) && s.kind !== 'url') out = out.replace(/(^|[^\\])(['"])/g, '$1\\$2').replace(/(^|[^\\])(['"])/g, '$1\\$2');
        pairs.push([key, t]);
        src = src.slice(0, s.start) + out + src.slice(s.end);
    }
    const jsonEsc = (s) => JSON.stringify(s).slice(1, -1);
    src = src.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, json) => {
        for (const [en, t] of pairs) json = json.split(`"${jsonEsc(en)}"`).join(`"${jsonEsc(t.replace(/&amp;/g, '&'))}"`);
        json = json.replace(/"inLanguage":"en"/g, `"inLanguage":"${lang}"`).replace(/trusti-score\.eu\/en\//g, `trusti-score.eu/${lang}/`);
        return `<script type="application/ld+json">${allLangs(json)}</script>`;
    });
    for (const [from, to] of Object.entries(TEMPLATES)) src = src.split(from).join(to[lang]);
    src = src.replace('<html lang="en"', `<html lang="${lang}"`)
        .replace('<meta property="og:locale" content="en_GB">', `<meta property="og:locale" content="${OG_LOCALE[lang]}">`)
        .replace(/(<link rel="canonical" href="https:\/\/trusti-score\.eu\/)en\//, `$1${lang}/`)
        .replace(/(<meta property="og:url" content="https:\/\/trusti-score\.eu\/)en\//, `$1${lang}/`)
        .split('/assets/og-image-en.png').join(`/assets/og-image-${lang}.png`);
    return langSwitch(alternates(src, page), page, lang);
}

const onlyMissing = process.argv.includes('--missing');
let total = 0;
for (const lang of GENERATED) {
    const dict = JSON.parse(readFileSync(join(ROOT, 'i18n', 'pages', `${lang}.json`), 'utf-8'));
    const missing = new Set();
    const pages = PAGES.map((p) => [p, translatePage(p, lang, dict, missing)]);
    if (missing.size) {
        total += missing.size;
        console.log(`${lang} : ${missing.size} texte(s) anglais sans traduction dans i18n/pages/${lang}.json`);
        for (const m of missing) console.log(`  ${JSON.stringify(m)}`);
    }
    if (onlyMissing) continue;
    mkdirSync(join(ROOT, lang), { recursive: true });
    for (const [p, html] of pages) writeFileSync(join(ROOT, lang, p), html);
}
if (!onlyMissing) {
    // Pages écrites à la main : seulement le sélecteur de langue, les hreflang et inLanguage.
    for (const lang of ['fr', 'en', 'de']) {
        for (const page of PAGES) {
            const p = join(ROOT, lang === 'fr' ? '' : lang, page);
            writeFileSync(p, langSwitch(alternates(allLangs(readFileSync(p, 'utf-8')), page), page, lang));
        }
    }
    console.log(`Pages générées : ${GENERATED.join(', ')}${total ? ` (${total} texte(s) laissé(s) en anglais)` : ''}.`);
}
process.exit(onlyMissing && total ? 1 : 0);
