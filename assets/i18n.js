/**
 * TrustiScore — langues du site (FR, EN, DE).
 *
 * - Mémorise la langue choisie dans le sélecteur (.lang-switch).
 * - Si aucun choix n'est mémorisé et que la langue préférée du navigateur est
 *   une autre langue du site, propose la page équivalente dans un bandeau discret.
 *   Jamais de redirection automatique (robots, francophones à l'étranger…).
 *
 * Les pages traduites vivent dans /en/ et /de/, voir docs/guides/traduction.md.
 */
(function () {
    'use strict';

    var LANGS = ['fr', 'en', 'de'];
    var KEY = 'trusti-lang';
    var pageLang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();

    var BANNER = {
        fr: { text: 'Cette page existe aussi en français.', go: 'Lire en français', close: 'Non merci' },
        en: { text: 'This page is also available in English.', go: 'Read in English', close: 'No thanks' },
        de: { text: 'Diese Seite gibt es auch auf Deutsch.', go: 'Auf Deutsch lesen', close: 'Nein danke' }
    };

    function read() {
        try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function save(lang) {
        try { window.localStorage.setItem(KEY, lang); } catch (e) { /* navigation privée */ }
    }

    // Le choix fait dans le sélecteur vaut préférence.
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('.lang-switch a[hreflang]');
        if (a) save(a.getAttribute('hreflang'));
    });

    function preferredLang() {
        var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
        for (var i = 0; i < list.length; i++) {
            var l = String(list[i]).slice(0, 2).toLowerCase();
            if (LANGS.indexOf(l) !== -1) return l;
        }
        return null;
    }

    function suggest() {
        if (document.body && document.body.hasAttribute('data-no-lang-banner')) return;
        if (read()) return;
        var want = preferredLang();
        if (!want || want === pageLang) return;
        var link = document.querySelector('.lang-switch a[hreflang="' + want + '"]');
        if (!link) return;
        var t = BANNER[want];

        var bar = document.createElement('div');
        bar.className = 'lang-banner';
        bar.setAttribute('role', 'region');
        bar.setAttribute('lang', want);
        bar.setAttribute('aria-label', t.text);
        bar.style.cssText = 'position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:200;' +
            'max-width:min(420px,calc(100vw - 32px));display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;' +
            'padding:14px 16px;background:#fff;color:#1B2A3A;border-radius:14px;box-shadow:0 8px 28px rgba(31,58,95,.22);' +
            'font:inherit;font-size:15px;line-height:1.4;';

        var text = document.createElement('span');
        text.textContent = t.text;
        text.style.cssText = 'flex:1 1 100%;';

        var go = document.createElement('a');
        go.href = link.getAttribute('href');
        go.textContent = t.go;
        go.setAttribute('hreflang', want);
        go.style.cssText = 'display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:999px;' +
            'background:#1F3A5F;color:#fff;font-weight:700;text-decoration:none;';
        go.addEventListener('click', function () { save(want); });

        var close = document.createElement('button');
        close.type = 'button';
        close.textContent = t.close;
        close.style.cssText = 'min-height:44px;padding:0 12px;border:0;background:none;color:#44546A;' +
            'font:inherit;text-decoration:underline;cursor:pointer;';
        close.addEventListener('click', function () { save(pageLang); bar.remove(); });

        bar.appendChild(text);
        bar.appendChild(go);
        bar.appendChild(close);
        document.body.appendChild(bar);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', suggest);
    else suggest();
})();
