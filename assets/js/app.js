(function () {
  'use strict';
  var WA = '221774820049';
  var FREE = 30000;
  var RAYONS = ['sans-gluten', 'farines-pates-cereales', 'graines-et-noix', 'epices-et-divers', 'huiles', 'laits-vegetaux', 'beurres-pates', 'sucres-et-substitut', 'supplements-sportifs', 'thes-tisanes', 'fabira-by-amsa'];
  var FEATURED = [2487, 2178, 12043, 6912, 2193, 6703, 2732, 9038, 6167, 12327];
  var D = { products: [], cats: [] }, catBy = {}, prodBy = {}, kids = {};
  var cart = load('hgs-cart', {}), favs = load('hgs-favs', {});
  var view = { q: '', sort: 'pop', max: 0, sg: false };

  function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return Number(n).toLocaleString('fr-FR').replace(/[  ]/g, ' '); }
  function money(n) { return fmt(n) + ' FCFA'; }
  var tt;
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('on'); }, 2400); }

  /* ---------- data helpers ---------- */
  function inRayon(p, slug) {
    if (p.cats.indexOf(slug) > -1) return true;
    return (kids[slug] || []).some(function (k) { return p.cats.indexOf(k) > -1; });
  }
  function rayonCount(slug) { return D.products.filter(function (p) { return inRayon(p, slug); }).length; }
  function img(p, cls) {
    return p.imgs.length ? '<img src="' + esc(p.imgs[0]) + '" alt="' + esc(p.name) + '" loading="lazy" width="360" height="360">'
      : '<img class="ph-logo" src="assets/img/logo.png" alt="" loading="lazy">';
  }
  function priceHTML(p) {
    if (!p.price) return '<span class="from">Prix selon option</span>';
    return (p.variable ? '<span class="from">À partir de</span>' : '') + '<span class="p">' + money(p.price) + '</span>' + (p.regular ? '<s>' + money(p.regular) + '</s>' : '');
  }
  function badge(p) {
    if (p.regular) return '<span class="pbadge sale">-' + Math.round((1 - p.price / p.regular) * 100) + '%</span>';
    if (p.cats.indexOf('sans-gluten') > -1) return '<span class="pbadge">Sans gluten</span>';
    return '';
  }
  function card(p) {
    var f = favs[p.id] ? 'true' : 'false';
    var action = p.price ? '<button class="addbtn" data-add="' + p.id + '">Ajouter au panier</button>'
      : '<a class="addbtn alt" style="text-align:center" href="#produit/' + esc(p.slug) + '">Choisir une option</a>';
    var c = catBy[p.cats[0]];
    return '<article class="card">' + badge(p) + '<a class="ph" href="#produit/' + esc(p.slug) + '" aria-label="' + esc(p.name) + '">' + img(p) +
      '<span class="acts"><button type="button" data-fav="' + p.id + '" aria-pressed="' + f + '">Favori</button></span></a>' +
      '<div class="body"><div class="cl">' + esc(c ? c.name : '') + '</div><h3><a href="#produit/' + esc(p.slug) + '">' + esc(p.name) + '</a></h3><div class="pr">' + priceHTML(p) + '</div>' + action + '</div></article>';
  }
  function rail(id, list) {
    return '<div class="rail" id="' + id + '">' + list.map(card).join('') + '</div>';
  }
  function railHead(title, id) {
    return '<div class="section-head"><h2>' + title + '</h2><span class="railbtns"><button data-rail="' + id + '" data-d="-1" aria-label="Précédent">‹</button><button data-rail="' + id + '" data-d="1" aria-label="Suivant">›</button></span></div>';
  }

  /* ---------- cart ---------- */
  function cartTotals() {
    var n = 0, t = 0;
    Object.keys(cart).forEach(function (id) { var p = prodBy[id]; if (p && cart[id] > 0) { n += cart[id]; t += cart[id] * p.price; } });
    return { n: n, t: t };
  }
  function cartUI() {
    var c = cartTotals();
    $('#cartN').textContent = c.n; $('#cartT').textContent = money(c.t);
    var f = Object.keys(favs).length; $('#favN').textContent = f + ' produit' + (f > 1 ? 's' : '');
  }
  function addToCart(id, q) { cart[id] = (cart[id] || 0) + (q || 1); save('hgs-cart', cart); cartUI(); toast(prodBy[id].name + ' ajouté au panier'); }

  /* ---------- pages ---------- */
  function pageAccueil() {
    var feat = FEATURED.map(function (i) { return prodBy[i]; }).filter(Boolean);
    var sales = D.products.filter(function (p) { return p.regular; });
    var news = D.products.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 10);
    var sg = D.products.filter(function (p) { return p.cats.indexOf('sans-gluten') > -1 && p.imgs.length; }).slice(0, 3);
    var tiles = RAYONS.filter(function (s) { return catBy[s]; }).map(function (s) {
      var c = catBy[s];
      return '<a class="cat" href="#boutique/' + s + '"><img src="' + esc(c.img) + '" alt="" loading="lazy" width="320" height="213"><span>' + esc(c.name) + '<small>' + rayonCount(s) + ' produits</small></span></a>';
    }).join('');
    return '<div class="page">' +
      '<div class="slider" id="slider" aria-roledescription="carrousel">' +
      '<div class="slide s1 on"><i class="arch"></i><div><div class="star" aria-hidden="true">✦ ✦ ✦</div><h1>Votre compagnon de choix pour une alimentation saine et naturelle</h1><p class="lead">Épicerie en ligne à Dakar : farines locales, graines, huiles, sirops et produits bio, livrés chez vous.</p><a class="btn" href="#boutique">Découvrir la boutique</a></div>' +
      '<div class="frames"><div class="frame"><img src="assets/img/hero-agave.jpg" alt="Sirop d\'agave bio Kirkland"></div><div class="frame"><img src="assets/img/hero-maple.jpg" alt="Sirop d\'érable bio Kirkland"></div><div class="frame"><img src="assets/img/hero-coco.jpg" alt="Huile de coco vierge bio Kirkland"></div></div></div>' +
      '<div class="slide s2"><div><span class="badge">Rayon</span><h1>' + rayonCount('sans-gluten') + ' produits sans gluten en stock</h1><p class="lead">Farines, pâtes, graines et bien plus, sélectionnés pour une alimentation sans gluten.</p><a class="btn light" href="#boutique/sans-gluten">Voir le rayon</a></div>' +
      '<div class="frames sq">' + sg.map(function (p) { return '<div class="frame"><img src="' + esc(p.imgs[0]) + '" alt="' + esc(p.name) + '"></div>'; }).join('') + '</div></div>' +
      '<div class="slide s3"><div><span class="badge">Livraison</span><h1>Livraison gratuite dès 30 000 FCFA</h1><p class="lead">Commande passée avant 15 h : livrée le jour même à Dakar. Paiement Wave, Orange Money ou cash.</p><a class="btn light" href="#boutique">Commander maintenant</a></div>' +
      '<div class="frames sq">' + feat.slice(0, 3).map(function (p) { return '<div class="frame"><img src="' + esc(p.imgs[0]) + '" alt="' + esc(p.name) + '"></div>'; }).join('') + '</div></div>' +
      '<button class="sarrow prev" data-slide="-1" aria-label="Précédent">‹</button><button class="sarrow next" data-slide="1" aria-label="Suivant">›</button><div class="dots" id="dots"></div></div>' +
      '<div class="trust"><div><b>Livraison le jour même</b><span>commande avant 15 h</span></div><div><b>Wave · Orange Money</b><span>ou cash à la livraison</span></div><div><b>Produits naturels et bio</b><span>sélection Healthy</span></div><div><b>Retrait au magasin</b><span>Mamelles, Dakar</span></div></div>' +
      '<div class="section"><div class="section-head"><h2>Acheter par rayon</h2><a class="link" href="#boutique">Tout voir</a></div><div class="cats">' + tiles + '</div></div>' +
      '<div class="section">' + railHead('Les plus commandés', 'r1') + rail('r1', feat) + '</div>' +
      '<div class="promo"><div><h2>Sans gluten ? ' + rayonCount('sans-gluten') + ' produits pour vous.</h2><p>Farines, pâtes, graines et douceurs, en stock à Dakar.</p></div><a class="btn" href="#boutique/sans-gluten">Voir le rayon</a></div>' +
      (sales.length ? '<div class="section">' + railHead('En promotion', 'r2') + rail('r2', sales) + '</div>' : '') +
      '<div class="section">' + railHead('Nouveautés', 'r3') + rail('r3', news) + '</div>' +
      '<div class="section split" style="align-items:center"><div><h2 style="font-size:clamp(22px,3vw,30px)">Une question ? Écrivez-nous sur WhatsApp.</h2><p style="margin-top:10px;color:var(--muted)">Conseil sur un produit, disponibilité, commande en gros.</p><div class="cta-row"><a class="btn wa" href="https://wa.me/' + WA + '" target="_blank" rel="noopener">WhatsApp · +221 77 482 00 49</a></div></div>' +
      '<div class="box"><h3>Au magasin</h3><p>Mamelles, Dakar</p><p style="color:var(--muted);margin-top:4px">Lun–Ven 9 h–18 h · Sam 12 h–18 h</p><p style="margin-top:12px"><a class="link" href="#magasin">Horaires et accès</a></p></div></div></div>';
  }

  function pageBoutique(slug) {
    var title = 'Tous les produits';
    var list = D.products.filter(function (p) {
      if (slug === 'promo') return p.regular;
      if (slug && slug !== 'all') return inRayon(p, slug);
      return true;
    });
    if (slug === 'promo') title = 'Promotions'; else if (catBy[slug]) title = catBy[slug].name;
    if (view.q) { var q = view.q.toLowerCase(); list = list.filter(function (p) { return p.name.toLowerCase().indexOf(q) > -1; }); title = 'Recherche : ' + esc(view.q); }
    if (view.sg) list = list.filter(function (p) { return p.cats.indexOf('sans-gluten') > -1; });
    var maxP = Math.max.apply(null, D.products.map(function (p) { return p.price; }));
    if (view.max && view.max < maxP) list = list.filter(function (p) { return p.price <= view.max; });
    list.sort(function (a, b) {
      return view.sort === 'asc' ? a.price - b.price : view.sort === 'desc' ? b.price - a.price : view.sort === 'name' ? a.name.localeCompare(b.name, 'fr') : b.id - a.id;
    });
    var side = '<li><button data-slug="all" aria-pressed="' + (!slug || slug === 'all') + '">Tous les produits <span class="n">' + D.products.length + '</span></button></li>' +
      RAYONS.filter(function (s) { return catBy[s]; }).map(function (s) {
        var subs = (kids[s] || []).filter(function (k) { return catBy[k]; }).map(function (k) {
          return '<li><button data-slug="' + k + '" aria-pressed="' + (slug === k) + '">' + esc(catBy[k].name) + ' <span class="n">' + rayonCount(k) + '</span></button></li>';
        }).join('');
        return '<li><button data-slug="' + s + '" aria-pressed="' + (slug === s) + '">' + esc(catBy[s].name) + ' <span class="n">' + rayonCount(s) + '</span></button></li>' + (subs ? '<li><ul class="sub" style="list-style:none;padding:0;margin:0">' + subs + '</ul></li>' : '');
      }).join('');
    return '<div class="page"><div class="crumbs"><a href="#accueil">Accueil</a> / Boutique</div><h1 style="font-size:clamp(28px,4vw,42px);margin-bottom:22px">' + title + '</h1>' +
      '<div class="shop"><aside class="filters" aria-label="Filtres"><h3>Rayons</h3><ul>' + side + '</ul>' +
      '<h3>Régime</h3><ul><li><button id="sgBtn" aria-pressed="' + view.sg + '">Sans gluten uniquement</button></li></ul>' +
      '<h3>Prix maximum</h3><input class="range" id="maxRange" type="range" min="500" max="' + maxP + '" step="500" value="' + (view.max || maxP) + '" aria-label="Prix maximum"><div class="mono" id="maxLbl" style="font-size:13px;color:var(--muted);margin-top:4px">' + money(view.max || maxP) + '</div></aside>' +
      '<div><div class="toolbar"><span style="font-size:13px;color:var(--muted)">' + list.length + ' produit' + (list.length > 1 ? 's' : '') + '</span>' +
      '<label style="font-size:13.5px;display:flex;align-items:center;gap:8px">Trier par <select id="sort"><option value="pop"' + (view.sort === 'pop' ? ' selected' : '') + '>Nouveautés</option><option value="asc"' + (view.sort === 'asc' ? ' selected' : '') + '>Prix croissant</option><option value="desc"' + (view.sort === 'desc' ? ' selected' : '') + '>Prix décroissant</option><option value="name"' + (view.sort === 'name' ? ' selected' : '') + '>Nom</option></select></label></div>' +
      (list.length ? '<div class="grid">' + list.map(card).join('') + '</div>' : '<div class="empty">Aucun produit ne correspond. Essayez un autre rayon ou retirez un filtre.</div>') +
      '</div></div></div>';
  }

  var pdpState = { q: 1, img: 0, tab: 'desc' };
  function pagePdp(slug) {
    var p = D.products.filter(function (x) { return x.slug === slug; })[0];
    if (!p) return '<div class="page"><div class="empty">Produit introuvable. <a class="link" href="#boutique">Retour à la boutique</a></div></div>';
    pdpState.q = 1; pdpState.img = 0; pdpState.tab = 'desc';
    var c = catBy[p.cats[0]];
    var rel = D.products.filter(function (x) { return x.id !== p.id && x.cats.some(function (k) { return p.cats.indexOf(k) > -1; }); }).slice(0, 8);
    var thumbs = p.imgs.length > 1 ? '<div class="thumbs">' + p.imgs.map(function (s, i) { return '<button data-thumb="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(s) + '" alt=""></button>'; }).join('') + '</div>' : '';
    var wa = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Bonjour, je souhaite commander : ' + p.name);
    return '<div class="page"><div class="crumbs"><a href="#accueil">Accueil</a> / <a href="#boutique">Boutique</a>' + (c ? ' / <a href="#boutique/' + c.slug + '">' + esc(c.name) + '</a>' : '') + ' / ' + esc(p.name) + '</div>' +
      '<div class="pdp"><div class="gal"><div class="main" id="mainImg">' + (p.imgs.length ? '<img src="' + esc(p.imgs[0]) + '" alt="' + esc(p.name) + '" width="700" height="700">' : '<img class="ph-logo" src="assets/img/logo.png" alt="">') + '</div>' + thumbs + '</div>' +
      '<div>' + (c ? '<div class="eyebrow">' + esc(c.name) + '</div>' : '') + '<h1>' + esc(p.name) + '</h1>' +
      '<div class="price">' + (p.price ? (p.variable ? '<small style="font-size:14px;color:var(--muted);font-weight:600">À partir de </small>' : '') + money(p.price) + (p.regular ? '<s>' + money(p.regular) + '</s>' : '') : '<span style="font-size:20px">Prix selon l\'option choisie</span>') + '</div>' +
      (p.short ? '<p class="short">' + esc(p.short) + '</p>' : '') +
      '<div class="buy"><div class="qty"><button id="pMinus" aria-label="Moins">−</button><output id="pQ">1</output><button id="pPlus" aria-label="Plus">+</button></div>' +
      (p.price ? '<button class="btn orange" id="pAdd" data-id="' + p.id + '" style="flex:1 1 180px">Ajouter au panier</button>' : '<a class="btn orange" href="' + wa + '" target="_blank" rel="noopener" style="flex:1 1 180px">Demander le prix</a>') + '</div>' +
      '<a class="btn wa block" href="' + wa + '" target="_blank" rel="noopener">Commander par WhatsApp</a>' +
      '<div class="facts"><div><b>Livraison</b>Aujourd\'hui si avant 15 h</div><div><b>Stock</b>Disponible</div><div><b>Paiement</b>Wave · OM · cash</div></div>' +
      '<div class="ptabs"><div class="bar" role="tablist" id="ptBar"><button role="tab" aria-selected="true" data-t="desc">Description</button><button role="tab" aria-selected="false" data-t="liv">Livraison</button></div><div class="panel" id="ptPanel">' + esc(p.desc || p.short || 'Produit naturel sélectionné par Healthy Grocery Store.') + '</div></div></div></div>' +
      (rel.length ? '<div class="section">' + railHead('Vous aimerez aussi', 'r4') + rail('r4', rel) + '</div>' : '') + '</div>';
  }

  function pagePanier() {
    var ids = Object.keys(cart).filter(function (k) { return cart[k] > 0 && prodBy[k]; });
    var sub = 0; ids.forEach(function (i) { sub += prodBy[i].price * cart[i]; });
    var left = FREE - sub;
    var lines = ids.length ? ids.map(function (i) {
      var p = prodBy[i];
      return '<div class="line"><img src="' + esc(p.imgs[0] || 'assets/img/logo.png') + '" alt=""><div><div class="nm"><a href="#produit/' + esc(p.slug) + '">' + esc(p.name) + '</a></div><div class="sub">' + money(p.price) + ' l\'unité</div><button class="rm" data-rm="' + i + '">Retirer</button></div><div class="end"><b>' + money(p.price * cart[i]) + '</b><div class="qty"><button data-q="' + i + '" data-d="-1" aria-label="Moins">−</button><output>' + cart[i] + '</output><button data-q="' + i + '" data-d="1" aria-label="Plus">+</button></div></div></div>';
    }).join('') : '<div class="empty">Votre panier est vide.<br><a class="link" href="#boutique">Découvrir la boutique</a></div>';
    return '<div class="page"><div class="crumbs"><a href="#accueil">Accueil</a> / Panier</div><h1 style="font-size:clamp(28px,4vw,42px);margin-bottom:22px">Votre commande</h1><div class="checkout"><div>' +
      '<div class="progress">' + (sub === 0 ? 'Livraison gratuite à Dakar dès <b>' + money(FREE) + '</b>.' : left > 0 ? '<b>Plus que ' + money(left) + '</b> pour la livraison gratuite à Dakar.' : '<b>Livraison gratuite à Dakar.</b>') + '<div class="track"><div class="fill" style="width:' + Math.min(100, Math.round(sub / FREE * 100)) + '%"></div></div></div>' + lines +
      '<p style="margin-top:14px"><a class="link" href="#boutique">Continuer mes achats</a></p></div>' +
      '<form class="box" id="orderForm"><h3>Livraison et paiement</h3><div class="two"><label class="field">Nom<input type="text" id="f-name" required autocomplete="name"></label><label class="field">Téléphone<input type="tel" id="f-tel" required autocomplete="tel"></label></div>' +
      '<label class="field">Quartier et repère<input type="text" id="f-adr" required></label>' +
      '<label class="field">Créneau<select id="f-slot"><option>Aujourd\'hui, avant 18 h (commande avant 15 h)</option><option>Demain matin, 9 h–12 h</option><option>Demain après-midi, 14 h–18 h</option><option>Retrait au magasin, Mamelles</option></select></label>' +
      '<div style="font-family:var(--display);font-weight:800;font-size:13px;margin-bottom:6px">Paiement</div><div class="pay"><label><input type="radio" name="pay" value="Wave" checked> Wave</label><label><input type="radio" name="pay" value="Orange Money"> Orange Money</label><label><input type="radio" name="pay" value="Cash à la livraison"> Cash à la livraison</label></div>' +
      '<div class="sumrow"><span>Sous-total</span><b>' + money(sub) + '</b></div><div class="sumrow"><span>Livraison Dakar</span><span>' + (sub >= FREE ? 'Gratuite' : 'Selon quartier') + '</span></div><div class="sumrow total"><span>Total</span><span>' + money(sub) + '</span></div>' +
      '<button class="btn wa block" style="margin-top:14px"' + (ids.length ? '' : ' disabled') + ' type="submit">Envoyer ma commande sur WhatsApp</button><p style="font-size:12.5px;color:var(--muted);margin-top:10px">Maquette : la commande s\'envoie pour l\'instant par WhatsApp. Le paiement en ligne viendra avec WooCommerce.</p></form></div></div>';
  }

  function pageMagasin() {
    return '<div class="page"><div class="eyebrow">Notre magasin</div><h1 style="font-size:clamp(28px,4vw,44px);margin:8px 0 12px;max-width:22ch">Votre compagnon de choix pour une alimentation saine et naturelle.</h1><p style="color:var(--muted);max-width:60ch">Healthy Grocery Store sélectionne des produits naturels et bio pour Dakar. Passez au magasin à Mamelles ou commandez en ligne, nous livrons.</p>' +
      '<div class="section split"><div><div class="map" role="img" aria-label="Plan schématique de Mamelles, Dakar"><div class="sea"></div><div class="pin">Healthy Grocery Store</div><div class="cap">Mamelles · schéma</div></div><div class="cta-row"><a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=Healthy+Grocery+Store+Mamelles+Dakar" target="_blank" rel="noopener">Ouvrir dans Google Maps</a></div></div>' +
      '<div><h2 style="font-size:24px;margin-bottom:10px">Horaires</h2><table class="hours"><tbody><tr><td>Lundi à vendredi</td><td>9 h – 18 h</td></tr><tr><td>Samedi</td><td>12 h – 18 h</td></tr><tr><td>Dimanche</td><td>fermé</td></tr></tbody></table>' +
      '<h2 style="font-size:24px;margin:26px 0 10px">Nous joindre</h2><p>+221 77 482 00 49</p><p>info@hgsdakar.com</p><p style="margin-top:6px;color:var(--muted)">Mamelles, Dakar, Sénégal · 12300</p><div class="cta-row"><a class="btn wa" href="https://wa.me/' + WA + '" target="_blank" rel="noopener">Écrire sur WhatsApp</a></div></div></div>' +
      '<div class="section"><h2 style="font-size:24px;margin-bottom:12px">Livraison</h2><div class="promises"><div class="promise"><b>Avant 15 h</b><span>Livré le jour même.</span></div><div class="promise"><b>Après 15 h</b><span>Livré le lendemain.</span></div><div class="promise"><b>Dès 30 000 FCFA</b><span>Livraison gratuite à Dakar.</span></div></div></div></div>';
  }

  function pageCompte() {
    return '<div class="page"><h1 style="font-size:clamp(28px,4vw,42px);margin-bottom:22px">Mon compte</h1><div class="split"><form class="box" id="loginForm"><h3>Se connecter</h3><label class="field">Email ou téléphone<input type="text" required></label><label class="field">Mot de passe<input type="password" required></label><button class="btn block" type="submit">Connexion</button><p style="margin-top:12px"><button type="button" class="link">Mot de passe oublié</button></p></form>' +
      '<div class="box"><h3>Nouveau client ?</h3><p style="color:var(--muted)">Créez un compte pour retrouver vos commandes et recommander en un clic. Vous pouvez aussi commander sans compte.</p><div class="cta-row"><button class="btn ghost" type="button" id="regBtn">Créer un compte</button></div></div></div></div>';
  }

  function pageLegal() {
    return '<div class="page"><h1 style="font-size:clamp(28px,4vw,42px);margin-bottom:18px">Politiques</h1><div style="max-width:780px">' +
      '<details open><summary>Politique de remboursement</summary><p>Texte à reprendre du site actuel.</p></details><details><summary>Politique de confidentialité</summary><p>Texte à reprendre du site actuel.</p></details><details><summary>Livraison</summary><p>Livraison gratuite à Dakar dès 30 000 FCFA d\'achat. Commande passée avant 15 h : livrée le jour même. Après 15 h : livrée le lendemain.</p></details></div></div>';
  }

  /* ---------- router ---------- */
  var slideTimer, si = 0;
  function route() {
    var h = (location.hash || '#accueil').slice(1), parts = h.split('/'), p = parts[0] || 'accueil', arg = decodeURIComponent(parts[1] || '');
    var app = $('#app'), html;
    if (p === 'boutique') html = pageBoutique(arg);
    else if (p === 'produit') html = pagePdp(arg);
    else if (p === 'panier') html = pagePanier();
    else if (p === 'magasin') html = pageMagasin();
    else if (p === 'compte') html = pageCompte();
    else if (p === 'legal') html = pageLegal();
    else html = pageAccueil();
    app.innerHTML = html;
    var pt = { boutique: 'Boutique', produit: 'Produit', panier: 'Panier', magasin: 'Notre magasin', compte: 'Mon compte', legal: 'Politiques' }[p];
    document.title = (pt ? pt + ' | ' : '') + 'Healthy Grocery Store';
    clearInterval(slideTimer);
    if ($('#slider')) initSlider();
    if (p !== 'boutique') view.q = view.q && p === 'boutique' ? view.q : '';
    window.scrollTo(0, 0);
  }
  function initSlider() {
    var sl = $$('#slider .slide'), dots = $('#dots'); si = 0;
    dots.innerHTML = sl.map(function (_, i) { return '<button data-dot="' + i + '" aria-label="Diapositive ' + (i + 1) + '"></button>'; }).join('');
    function show(i) { si = (i + sl.length) % sl.length; sl.forEach(function (x, k) { x.classList.toggle('on', k === si); }); $$('#dots button').forEach(function (d, k) { d.setAttribute('aria-current', k === si); }); }
    show(0);
    $('#slider').addEventListener('click', function (e) { var a = e.target.closest('[data-slide]'), d = e.target.closest('[data-dot]'); if (a) show(si + +a.dataset.slide); if (d) show(+d.dataset.dot); });
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      slideTimer = setInterval(function () { show(si + 1); }, 6500);
      $('#slider').addEventListener('mouseenter', function () { clearInterval(slideTimer); });
    }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var fav = t.closest('[data-fav]');
    if (fav) { e.preventDefault(); var id = fav.dataset.fav; if (favs[id]) { delete favs[id]; fav.setAttribute('aria-pressed', 'false'); toast('Retiré des favoris'); } else { favs[id] = 1; fav.setAttribute('aria-pressed', 'true'); toast('Ajouté aux favoris'); } save('hgs-favs', favs); cartUI(); return; }
    var add = t.closest('[data-add]'); if (add) { addToCart(+add.dataset.add, 1); return; }
    var r = t.closest('[data-rail]'); if (r) { var el = document.getElementById(r.dataset.rail); el.scrollBy({ left: +r.dataset.d * el.clientWidth * .8, behavior: 'smooth' }); return; }
    var sb = t.closest('.filters [data-slug]'); if (sb) { view.q = ''; location.hash = sb.dataset.slug === 'all' ? 'boutique' : 'boutique/' + sb.dataset.slug; return; }
    if (t.closest('#sgBtn')) { view.sg = !view.sg; route(); return; }
    var th = t.closest('[data-thumb]'); if (th) { var pr = D.products.filter(function (x) { return x.slug === decodeURIComponent(location.hash.split('/')[1]); })[0]; if (pr) { $('#mainImg').innerHTML = '<img src="' + esc(pr.imgs[+th.dataset.thumb]) + '" alt="' + esc(pr.name) + '">'; $$('[data-thumb]').forEach(function (b) { b.setAttribute('aria-pressed', b === th); }); } return; }
    if (t.closest('#pMinus')) { pdpState.q = Math.max(1, pdpState.q - 1); $('#pQ').textContent = pdpState.q; return; }
    if (t.closest('#pPlus')) { pdpState.q++; $('#pQ').textContent = pdpState.q; return; }
    var pa = t.closest('#pAdd'); if (pa) { addToCart(+pa.dataset.id, pdpState.q); return; }
    var pt = t.closest('#ptBar button'); if (pt) { var p = D.products.filter(function (x) { return x.slug === decodeURIComponent(location.hash.split('/')[1]); })[0]; $$('#ptBar button').forEach(function (b) { b.setAttribute('aria-selected', b === pt); }); $('#ptPanel').textContent = pt.dataset.t === 'liv' ? 'Livraison gratuite à Dakar dès 30 000 FCFA. Commande avant 15 h : livrée aujourd\'hui. Retrait possible au magasin de Mamelles.' : (p.desc || p.short || 'Produit naturel sélectionné par Healthy Grocery Store.'); return; }
    var q = t.closest('[data-q]'); if (q) { var i = q.dataset.q; cart[i] = Math.max(0, (cart[i] || 0) + +q.dataset.d); if (!cart[i]) delete cart[i]; save('hgs-cart', cart); cartUI(); route(); return; }
    var rm = t.closest('[data-rm]'); if (rm) { delete cart[rm.dataset.rm]; save('hgs-cart', cart); cartUI(); route(); return; }
    if (t.closest('#favBtn')) { toast(Object.keys(favs).length ? 'Vos favoris sont marqués sur les fiches produit.' : 'Aucun favori pour l\'instant.'); return; }
    if (t.closest('#regBtn')) { toast('Création de compte : disponible avec WooCommerce.'); return; }
    if (!t.closest('.mega-wrap') || t.closest('#mega a')) megaSet(false);
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'sort') { view.sort = e.target.value; route(); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'maxRange') { view.max = +e.target.value; $('#maxLbl').textContent = money(view.max); clearTimeout(view._t); view._t = setTimeout(route, 250); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.id === 'searchForm') { e.preventDefault(); view.q = $('#q').value.trim(); var c = $('#qcat').value; view.sg = false; location.hash = c ? 'boutique/' + c : 'boutique'; route(); }
    if (f.id === 'newsForm') { e.preventDefault(); toast('Merci, nous vous écrirons pour les prochains arrivages.'); f.reset(); }
    if (f.id === 'loginForm') { e.preventDefault(); toast('Connexion : disponible avec WooCommerce.'); }
    if (f.id === 'orderForm') {
      e.preventDefault();
      var ids = Object.keys(cart).filter(function (k) { return cart[k] > 0 && prodBy[k]; }), sub = 0;
      var lines = ids.map(function (i) { var p = prodBy[i]; sub += p.price * cart[i]; return '- ' + cart[i] + ' x ' + p.name + ' (' + money(p.price * cart[i]) + ')'; });
      var msg = 'Bonjour, nouvelle commande :\n' + lines.join('\n') + '\nTotal : ' + money(sub) + '\nNom : ' + $('#f-name').value + '\nTéléphone : ' + $('#f-tel').value + '\nAdresse : ' + $('#f-adr').value + '\nCréneau : ' + $('#f-slot').value + '\nPaiement : ' + (($('input[name=pay]:checked') || {}).value || '');
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    }
  });
  var mega = $('#mega'), megaBtn = $('#megaBtn');
  function megaSet(o) { mega.hidden = !o; megaBtn.setAttribute('aria-expanded', o); }
  megaBtn.addEventListener('click', function (e) { e.stopPropagation(); megaSet(mega.hidden); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') megaSet(false); });
  window.addEventListener('hashchange', route);

  /* ---------- boot ---------- */
  fetch('assets/data/catalog.json').then(function (r) { return r.json(); }).then(function (d) {
    D = d;
    D.cats.forEach(function (c) { catBy[c.slug] = c; });
    D.cats.forEach(function (c) { if (c.parent) { var par = D.cats.filter(function (x) { return x.id === c.parent; })[0]; if (par) (kids[par.slug] = kids[par.slug] || []).push(c.slug); } });
    D.products.forEach(function (p) { prodBy[p.id] = p; });
    $('#qcat').innerHTML += RAYONS.filter(function (s) { return catBy[s]; }).map(function (s) { return '<option value="' + s + '">' + esc(catBy[s].name) + '</option>'; }).join('');
    mega.innerHTML = '<div class="mcol"><h4>Alimentation</h4>' + ['farines-pates-cereales', 'graines-et-noix', 'epices-et-divers', 'huiles', 'laits-vegetaux', 'beurres-pates', 'sucres-et-substitut'].filter(function (s) { return catBy[s]; }).map(function (s) {
      return '<a href="#boutique/' + s + '">' + esc(catBy[s].name) + '</a>' + (kids[s] || []).map(function (k) { return '<a class="sub" href="#boutique/' + k + '">' + esc(catBy[k].name) + '</a>'; }).join('');
    }).join('') + '</div><div class="mcol"><h4>Régimes et bien-être</h4><a href="#boutique/sans-gluten">Sans gluten</a><a href="#boutique/supplements-sportifs">Suppléments</a><a href="#boutique/thes-tisanes">Thés et tisanes</a><h4 style="margin-top:14px">Marques</h4><a href="#boutique/fabira-by-amsa">Fabira by Amsa</a></div>' +
      '<div class="mcol mpromo"><b style="font-family:var(--display);font-size:17px">Livraison gratuite</b><span>Dès 30 000 FCFA à Dakar</span><a class="btn" href="#boutique">Voir la boutique</a></div>';
    cartUI(); route();
  }).catch(function () { $('#app').innerHTML = '<div class="page"><div class="empty">Le catalogue ne s\'est pas chargé. Rechargez la page.</div></div>'; });
})();
