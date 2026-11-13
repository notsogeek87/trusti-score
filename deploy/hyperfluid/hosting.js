// Mention « Hébergé en France par Hyperfluid » (même texte, lien et logo que l'app Trusti).
// Ce fichier n'est copié que dans l'image Hyperfluid (voir Dockerfile) : sur un autre
// hébergeur, /assets/hosting.js n'existe pas et rien ne s'affiche.
(function () {
  var title = document.querySelector('header h1') || document.querySelector('h1');
  if (!title || document.getElementById('hosting-credit')) return;

  var p = document.createElement('p');
  p.id = 'hosting-credit';
  p.style.cssText = 'margin:.35rem 0 0;font-size:12px;line-height:1.3;opacity:.8;';

  var a = document.createElement('a');
  a.href = 'https://www.hyperfluid.cloud/';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.style.cssText = 'color:inherit;text-decoration:underline;text-underline-offset:2px;display:inline-flex;align-items:center;gap:4px;';
  a.appendChild(document.createTextNode('Hébergé en France par Hyperfluid'));

  var img = document.createElement('img');
  img.src = '/assets/hosting/hyperfluid.svg';
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  img.style.cssText = 'width:12px;height:12px;object-fit:contain;flex-shrink:0;';
  img.onerror = function () { img.remove(); };
  a.appendChild(img);

  p.appendChild(a);
  // La mention se colle sous le titre : on lui transfère la marge basse du titre,
  // sinon elle tombe loin du titre, près du contenu suivant (cas de liens.html).
  var gap = window.getComputedStyle(title).marginBottom;
  title.style.marginBottom = '0';
  p.style.marginBottom = gap;
  title.insertAdjacentElement('afterend', p);
})();
