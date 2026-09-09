/*
  ============================================================================
  SW.JS — Service Worker do Portfólio UGC Creator
  ============================================================================
  Guarda em cache o "esqueleto" essencial do site (HTML, CSS, JS, config,
  manifest e ícones) pra abrir instantaneamente e funcionar offline depois
  da primeira visita. Fotos/vídeos adicionados depois entram em cache
  automaticamente conforme vão sendo vistos (estratégia "stale-while-
  revalidate"), sem precisar listar cada arquivo aqui.

  IMPORTANTE: sempre que publicar uma atualização visual grande no site,
  troque o valor de CACHE_VERSAO abaixo (ex: "v2", "v3"...) — isso força
  os visitantes que já instalaram o app a baixar a versão nova.
  ============================================================================
*/

var CACHE_VERSAO = "v3";
var CACHE_ESSENCIAL = "ugc-portfolio-essencial-" + CACHE_VERSAO;
var CACHE_RUNTIME = "ugc-portfolio-runtime-" + CACHE_VERSAO;

// Caminhos relativos (sem "/" no início) pra funcionar tanto num domínio
// próprio quanto num subdiretório do GitHub Pages (ex: usuario.github.io/repo/).
var ARQUIVOS_ESSENCIAIS = [
  "./",
  "index.html",
  "styles.css",
  "script.js",
  "config.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/favicon.svg"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE_ESSENCIAL).then(function (cache) {
      return cache.addAll(ARQUIVOS_ESSENCIAIS).catch(function () {
        // se algum arquivo opcional falhar (ex: ainda não existe), não
        // impede o resto do cache essencial de funcionar
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (chaves) {
      return Promise.all(
        chaves
          .filter(function (chave) {
            return chave.indexOf("ugc-portfolio-") === 0 && chave !== CACHE_ESSENCIAL && chave !== CACHE_RUNTIME;
          })
          .map(function (chave) {
            return caches.delete(chave);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (evento) {
  var requisicao = evento.request;

  // só cuida de requisições GET do mesmo site; deixa o resto (ex: chamadas
  // de API externas, fontes do Google) seguir direto pela rede
  if (requisicao.method !== "GET") return;

  var url = new URL(requisicao.url);
  var mesmaOrigem = url.origin === self.location.origin;

  if (!mesmaOrigem) return;

  // Navegação (abrir o site/URL direta): tenta rede primeiro, cai pro
  // cache/index.html se estiver offline.
  if (requisicao.mode === "navigate") {
    evento.respondWith(
      fetch(requisicao).catch(function () {
        return caches.match("index.html");
      })
    );
    return;
  }

  // Demais arquivos do próprio site: cache primeiro (rápido), atualiza em
  // segundo plano (stale-while-revalidate).
  evento.respondWith(
    caches.match(requisicao).then(function (respostaCache) {
      var buscaRede = fetch(requisicao)
        .then(function (respostaRede) {
          if (respostaRede && respostaRede.status === 200) {
            var copia = respostaRede.clone();
            caches.open(CACHE_RUNTIME).then(function (cache) {
              cache.put(requisicao, copia);
            });
          }
          return respostaRede;
        })
        .catch(function () {
          return respostaCache;
        });

      return respostaCache || buscaRede;
    })
  );
});
