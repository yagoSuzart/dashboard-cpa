// Deixa o OralLab funcionando sem internet depois do primeiro acesso.
// Arquivos do site: busca na rede primeiro (para pegar atualizações) e usa a cópia salva se estiver offline.
// Ao publicar uma versão nova, troque o número abaixo.
var VERSAO = 'orallab-v5';
var ARQUIVOS = [
  './',
  'index.html',
  'css/estilo.css',
  'js/dados.js',
  'js/casos.js',
  'js/perguntas.js',
  'js/app.js',
  'manifest.webmanifest',
  'icones/icone-180.png',
  'icones/icone-192.png',
  'icones/icone-512.png'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.filter(function (n) { return n !== VERSAO; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (ev) {
  var req = ev.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // Fontes do Google: usa a cópia salva se tiver.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    ev.respondWith(caches.open(VERSAO).then(function (c) {
      return c.match(req).then(function (salvo) {
        return salvo || fetch(req).then(function (resp) { c.put(req, resp.clone()); return resp; });
      });
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  ev.respondWith(fetch(req).then(function (resp) {
    if (resp.ok) { var copia = resp.clone(); caches.open(VERSAO).then(function (c) { c.put(req, copia); }); }
    return resp;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (salvo) { return salvo || caches.match('index.html'); });
  }));
});
