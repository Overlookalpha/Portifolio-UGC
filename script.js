/*
  ============================================================================
  SCRIPT.JS — Motor do Portfólio UGC Creator
  ============================================================================
  Responsável por:
  - carregar a configuração local;
  - buscar o conteúdo salvo no Supabase;
  - aplicar a aparência;
  - renderizar todas as seções;
  - carregar vídeos e fotos;
  - navegação mobile;
  - filtros;
  - modal/lightbox;
  - animações;
  - PWA.
  ============================================================================
*/

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};

  document.addEventListener("DOMContentLoaded", init);

  // --------------------------------------------------------------------------
  // INICIALIZAÇÃO
  // --------------------------------------------------------------------------

  function init() {
    normalizarConfiguracao();

    aplicarAparencia();
    aplicarMetaBasica();

    renderHeaderFooter();
    renderHero();
    renderVideos();
    renderGaleria();
    renderServicos();
    renderProcesso();
    renderMarcas();
    renderSobre();
    renderResultados();
    renderCTA();

    setupNav();
    setupScrollHeader();
    setupReveal();
    setupFiltrosVideo();
    setupModal();
    setupInstallPrompt();
    registrarServiceWorker();

    atualizarMidiasComSupabase();
    atualizarConteudoComSupabase();
  }

  // --------------------------------------------------------------------------
  // NORMALIZAÇÃO
  // --------------------------------------------------------------------------
  // Durante a migração, mantém compatibilidade com estruturas antigas.

  function normalizarConfiguracao() {
    cfg.identidade = cfg.identidade || {};

    cfg.header = cfg.header || {};

    cfg.hero = cfg.hero || {};

    cfg.videosSecao = cfg.videosSecao || {};

    cfg.galeria = cfg.galeria || {};

    cfg.servicos =
      cfg.servicos && !Array.isArray(cfg.servicos)
        ? cfg.servicos
        : {
            mostrar: true,
            eyebrow: "Serviços",
            titulo: "O que posso criar para sua marca",
            descricao: "",
            itens: Array.isArray(cfg.servicos)
              ? cfg.servicos
              : []
          };

    cfg.processo =
      cfg.processo && !Array.isArray(cfg.processo)
        ? cfg.processo
        : {
            mostrar: false,
            eyebrow: "Processo",
            titulo: "Como funciona",
            descricao: "",
            itens: Array.isArray(cfg.processo)
              ? cfg.processo
              : []
          };

    cfg.marcas =
      cfg.marcas && !Array.isArray(cfg.marcas)
        ? cfg.marcas
        : {
            mostrar: true,
            eyebrow: "Parcerias",
            titulo: "Marcas com as quais já trabalhei",
            descricao: "",
            itens: Array.isArray(cfg.marcas)
              ? cfg.marcas
              : []
          };

    cfg.sobre = cfg.sobre || {};

    cfg.resultados =
      cfg.resultados && !Array.isArray(cfg.resultados)
        ? cfg.resultados
        : {
            mostrar:
              typeof cfg.mostrarMetricas === "boolean"
                ? cfg.mostrarMetricas
                : false,
            eyebrow: "Resultados",
            titulo: "",
            descricao: "",
            itens: Array.isArray(cfg.metricas)
              ? cfg.metricas
              : []
          };

    cfg.contato = cfg.contato || {};
    cfg.cta = cfg.cta || {};
    cfg.rodape = cfg.rodape || {};
    cfg.aparencia = cfg.aparencia || {};

    sincronizarCompatibilidade();
  }

  function sincronizarCompatibilidade() {
    cfg.nome =
      cfg.identidade.nome ||
      cfg.nome ||
      "Nome da Creator";

    cfg.nomeCurto =
      cfg.identidade.nomeCurto ||
      cfg.nomeCurto ||
      "Creator";

    cfg.titulo =
      cfg.identidade.titulo ||
      cfg.titulo ||
      "UGC Creator";

    cfg.descricaoCurta =
      cfg.identidade.descricaoCurta ||
      cfg.descricaoCurta ||
      "";

    cfg.idioma =
      cfg.identidade.idioma ||
      cfg.idioma ||
      "pt-BR";

    cfg.fraseDeImpacto =
      cfg.hero.frase ||
      cfg.fraseDeImpacto ||
      "";

    if (cfg.hero.titulo) {
      cfg.nome = cfg.hero.titulo;
    }

    if (!cfg.hero.foto && cfg.sobre.foto) {
      cfg.hero.foto = cfg.sobre.foto;
    }

    if (!cfg.sobre.foto && cfg.hero.foto) {
      cfg.sobre.foto = cfg.hero.foto;
    }

    if (!Array.isArray(cfg.videos)) {
      cfg.videos = [];
    }

    if (!Array.isArray(cfg.fotos)) {
      cfg.fotos = [];
    }
  }

  // --------------------------------------------------------------------------
  // SUPABASE — CLIENTE
  // --------------------------------------------------------------------------

  function criarClienteSupabase() {
    if (
      !cfg.supabase ||
      !cfg.supabase.url ||
      !cfg.supabase.anonKey ||
      typeof window.supabase === "undefined"
    ) {
      return null;
    }

    return window.supabase.createClient(
      cfg.supabase.url,
      cfg.supabase.anonKey
    );
  }

  // --------------------------------------------------------------------------
  // CONTEÚDO DO SUPABASE
  // --------------------------------------------------------------------------

  function atualizarConteudoComSupabase() {
    var cliente = criarClienteSupabase();

    if (!cliente) return;

    cliente
      .from("conteudo_site")
      .select("dados")
      .eq("id", "principal")
      .maybeSingle()
      .then(function (resposta) {
        if (
          resposta.error ||
          !resposta.data ||
          !resposta.data.dados
        ) {
          return;
        }

        mesclarConfiguracao(
          resposta.data.dados
        );

        normalizarConfiguracao();

        aplicarAparencia();
        aplicarMetaBasica();

        renderHeaderFooter();
        renderHero();
        renderVideos();
        renderGaleria();
        renderServicos();
        renderProcesso();
        renderMarcas();
        renderSobre();
        renderResultados();
        renderCTA();

        setupFiltrosVideo();
        setupModal();
        setupReveal();
      })
      .catch(function () {
        // Mantém o fallback local.
      });
  }

  function mesclarConfiguracao(dados) {
    if (!dados || typeof dados !== "object") {
      return;
    }

    // Suporta a nova estrutura.
    [
      "identidade",
      "header",
      "hero",
      "videosSecao",
      "galeria",
      "servicos",
      "processo",
      "marcas",
      "sobre",
      "resultados",
      "contato",
      "cta",
      "rodape",
      "aparencia"
    ].forEach(function (chave) {
      if (
        Object.prototype.hasOwnProperty.call(
          dados,
          chave
        )
      ) {
        cfg[chave] = dados[chave];
      }
    });

    // Compatibilidade com o formato antigo salvo pelo Admin.
    if (dados.nome) {
      cfg.identidade.nome = dados.nome;
    }

    if (dados.titulo) {
      cfg.identidade.titulo = dados.titulo;
    }

    if (dados.fraseDeImpacto) {
      cfg.hero.frase =
        dados.fraseDeImpacto;
    }

    if (dados.foto) {
      cfg.hero.foto = dados.foto;
      cfg.sobre.foto = dados.foto;
    }

    if (dados.sobre) {
      cfg.sobre.texto = String(
        dados.sobre
      )
        .split(/\n\s*\n/)
        .filter(Boolean);
    }

    if (dados.email) {
      cfg.contato.email = dados.email;
    }

    if (dados.whatsapp) {
      cfg.contato.whatsapp =
        dados.whatsapp;
    }

    if (dados.instagram) {
      cfg.contato.instagram =
        dados.instagram;
    }

    if (dados.ctaTitulo) {
      cfg.cta.titulo =
        dados.ctaTitulo;
    }

    if (dados.ctaTexto) {
      cfg.cta.texto =
        dados.ctaTexto;
    }
  }

  // --------------------------------------------------------------------------
  // MÍDIAS DO SUPABASE
  // --------------------------------------------------------------------------

  function buscarMidiasDoSupabase() {
    var cliente = criarClienteSupabase();

    if (!cliente) {
      return Promise.resolve(null);
    }

    return cliente
      .from("midias")
      .select("*")
      .order("ordem", {
        ascending: true
      })
      .then(function (resposta) {
        if (
          resposta.error ||
          !Array.isArray(resposta.data)
        ) {
          return null;
        }

        var linhas = resposta.data;

        var videos = linhas
          .filter(function (m) {
            return m.tipo === "video";
          })
          .map(function (m) {
            return {
              id: m.id,

              titulo: m.titulo || "",

              categoria:
                m.categoria || "",

              marca: m.marca || "",

              descricao:
                m.descricao || "",

              thumbnail:
                m.thumbnail_url ||
                m.arquivo_url ||
                "",

              video:
                m.arquivo_url || "",

              destaque: !!m.destaque
            };
          });

        var fotos = linhas
          .filter(function (m) {
            return m.tipo === "foto";
          })
          .map(function (m) {
            return {
              id: m.id,

              legenda:
                m.titulo || "",

              categoria:
                m.categoria || "",

              imagem:
                m.arquivo_url ||
                m.thumbnail_url ||
                "",

              destaque: !!m.destaque
            };
          });

        if (!videos.length && !fotos.length) {
          return null;
        }

        return {
          videos: videos,
          fotos: fotos
        };
      });
  }

  function atualizarMidiasComSupabase() {
    buscarMidiasDoSupabase()
      .then(function (dados) {
        if (!dados) return;

        if (Array.isArray(dados.videos)) {
          cfg.videos = dados.videos;
        }

        if (Array.isArray(dados.fotos)) {
          cfg.fotos = dados.fotos;
        }

        renderVideos();
        renderGaleria();

        setupFiltrosVideo();
        setupModal();
      })
      .catch(function () {
        // Mantém os dados locais.
      });
  }

  // --------------------------------------------------------------------------
  // APARÊNCIA
  // --------------------------------------------------------------------------

  function aplicarAparencia() {
    var aparencia = cfg.aparencia || {};

    var raiz = document.documentElement;

    definirVariavel(
      raiz,
      "--bg",
      aparencia.fundo
    );

    definirVariavel(
      raiz,
      "--bg-elevated",
      aparencia.fundoElevado
    );

    definirVariavel(
      raiz,
      "--bg-elevated-2",
      aparencia.fundoElevado2
    );

    definirVariavel(
      raiz,
      "--text",
      aparencia.texto
    );

    definirVariavel(
      raiz,
      "--text-muted",
      aparencia.textoSecundario
    );

    definirVariavel(
      raiz,
      "--text-faint",
      aparencia.textoSuave
    );

    definirVariavel(
      raiz,
      "--accent",
      aparencia.destaque
    );

    definirVariavel(
      raiz,
      "--on-accent",
      aparencia.textoDestaque
    );

    definirVariavel(
      raiz,
      "--border",
      aparencia.borda
    );

    definirVariavel(
      raiz,
      "--border-strong",
      aparencia.bordaForte
    );

    definirVariavel(
      raiz,
      "--overlay",
      aparencia.overlay
    );

    if (aparencia.fonteTitulos) {
      definirVariavel(
        raiz,
        "--font-display",
        '"' +
          aparencia.fonteTitulos +
          '", Georgia, "Times New Roman", serif'
      );
    }

    if (aparencia.fonteCorpo) {
      definirVariavel(
        raiz,
        "--font-body",
        '"' +
          aparencia.fonteCorpo +
          '", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      );
    }

    definirVariavelNumero(
      raiz,
      "--radius-sm",
      aparencia.raioPequeno,
      "px"
    );

    definirVariavelNumero(
      raiz,
      "--radius-md",
      aparencia.raioMedio,
      "px"
    );

    definirVariavelNumero(
      raiz,
      "--radius-lg",
      aparencia.raioGrande,
      "px"
    );

    definirVariavelNumero(
      raiz,
      "--radius-pill",
      aparencia.raioPill,
      "px"
    );
  }

  function definirVariavel(
    raiz,
    nome,
    valor
  ) {
    if (
      valor !== undefined &&
      valor !== null &&
      valor !== ""
    ) {
      raiz.style.setProperty(
        nome,
        valor
      );
    }
  }

  function definirVariavelNumero(
    raiz,
    nome,
    valor,
    unidade
  ) {
    if (
      typeof valor === "number" &&
      isFinite(valor)
    ) {
      raiz.style.setProperty(
        nome,
        valor + unidade
      );
    }
  }

  // --------------------------------------------------------------------------
  // META
  // --------------------------------------------------------------------------

  function aplicarMetaBasica() {
    if (cfg.idioma) {
      document.documentElement.setAttribute(
        "lang",
        cfg.idioma
      );
    }

    if (cfg.nome && cfg.titulo) {
      document.title =
        cfg.nome +
        " — " +
        cfg.titulo +
        " | Portfólio & Media Kit";
    }

    var metaTheme = $(
      'meta[name="theme-color"]'
    );

    if (
      metaTheme &&
      cfg.aparencia &&
      cfg.aparencia.fundo
    ) {
      metaTheme.setAttribute(
        "content",
        cfg.aparencia.fundo
      );
    } else if (
      metaTheme &&
      cfg.corTema
    ) {
      metaTheme.setAttribute(
        "content",
        cfg.corTema
      );
    }

    var metas = [
      [
        'meta[name="description"]',
        cfg.descricaoCurta
      ],
      [
        'meta[property="og:title"]',
        cfg.nome + " — " + cfg.titulo
      ],
      [
        'meta[property="og:description"]',
        cfg.descricaoCurta
      ],
      [
        'meta[name="twitter:title"]',
        cfg.nome + " — " + cfg.titulo
      ],
      [
        'meta[name="twitter:description"]',
        cfg.descricaoCurta
      ],
      [
        'meta[name="apple-mobile-web-app-title"]',
        cfg.nomeCurto
      ]
    ];

    metas.forEach(function (item) {
      var node = $(item[0]);

      if (
        node &&
        item[1] !== undefined &&
        item[1] !== null
      ) {
        node.setAttribute(
          "content",
          item[1]
        );
      }
    });
  }

  // --------------------------------------------------------------------------
  // HEADER + FOOTER
  // --------------------------------------------------------------------------

  function renderHeaderFooter() {
    var brand = $("#brand-nome");

    if (brand) {
      brand.textContent =
        cfg.nome || "";
    }

    var footerNome =
      $("#footer-nome");

    if (footerNome) {
      footerNome.textContent =
        cfg.nome || "";
    }

    var footerTitulo =
      $("#footer-titulo");

    if (
      footerTitulo &&
      cfg.rodape &&
      cfg.rodape.titulo
    ) {
      footerTitulo.textContent =
        cfg.rodape.titulo;
    }

    var footerLinks =
      $("#footer-links");

    if (
      footerLinks &&
      cfg.contato
    ) {
      var links = [];

      if (cfg.contato.instagram) {
        links.push([
          "Instagram",
          cfg.contato.instagram
        ]);
      }

      if (cfg.contato.tiktok) {
        links.push([
          "TikTok",
          cfg.contato.tiktok
        ]);
      }

      if (cfg.contato.youtube) {
        links.push([
          "YouTube",
          cfg.contato.youtube
        ]);
      }

      if (cfg.contato.email) {
        links.push([
          "E-mail",
          "mailto:" +
            cfg.contato.email
        ]);
      }

      limparEPreencher(
        footerLinks,
        links.map(function (par) {
          var li = el("li");

          var a = el(
            "a",
            null,
            par[0]
          );

          a.href = par[1];

          if (
            par[1].indexOf(
              "http"
            ) === 0
          ) {
            a.target = "_blank";
            a.rel = "noopener";
          }

          li.appendChild(a);

          return li;
        })
      );
    }

    var footerCopy =
      $("#footer-copy");

    if (
      footerCopy &&
      cfg.nome
    ) {
      footerCopy.textContent =
        "©️ " +
        new Date().getFullYear() +
        " " +
        cfg.nome +
        ". Todos os direitos reservados.";
    }

    var adminLink =
      $(".footer-admin-link");

    if (
      adminLink &&
      cfg.rodape &&
      cfg.rodape.mostrarAdmin === false
    ) {
      adminLink.hidden = true;
    }
  }

  // --------------------------------------------------------------------------
  // HERO
  // --------------------------------------------------------------------------

  function renderHero() {
    var hero = cfg.hero || {};

    var nomeEl =
      $("#hero-nome");

    if (nomeEl) {
      nomeEl.textContent =
        hero.titulo ||
        cfg.nome ||
        "";
    }

    var fraseEl =
      $("#hero-frase");

    if (fraseEl) {
      fraseEl.textContent =
        hero.frase ||
        "";
    }

    var fotoEl =
      $("#hero-foto");

    if (
      fotoEl &&
      hero.foto
    ) {
      fotoEl.src =
        hero.foto;

      fotoEl.alt =
        "Foto de " +
        (cfg.nome ||
          "creator");
    }

    // Botão do Hero, se existir no HTML.
    var heroBotao =
      $("#hero-botao");

    if (heroBotao) {
      if (
        hero.mostrarBotao === false
      ) {
        heroBotao.hidden = true;
      } else {
        heroBotao.hidden = false;

        if (hero.botaoTexto) {
          heroBotao.textContent =
            hero.botaoTexto;
        }

        if (hero.botaoDestino) {
          heroBotao.href =
            hero.botaoDestino;
        }
      }
    }

    var eyebrow =
      $("#hero-eyebrow");

    if (
      eyebrow &&
      hero.eyebrow
    ) {
      eyebrow.textContent =
        hero.eyebrow;
    }
  }

  // --------------------------------------------------------------------------
  // SOBRE
  // --------------------------------------------------------------------------

  function renderSobre() {
    var sobre = cfg.sobre || {};

    var secao =
      $("#sobre");

    if (
      secao &&
      sobre.mostrar === false
    ) {
      secao.hidden = true;
      return;
    }

    if (secao) {
      secao.hidden = false;
    }

    var eyebrow =
      $("#sobre-eyebrow");

    if (
      eyebrow &&
      sobre.eyebrow
    ) {
      eyebrow.textContent =
        sobre.eyebrow;
    }

    var titulo =
      $("#sobre-titulo");

    if (
      titulo &&
      sobre.titulo
    ) {
      titulo.textContent =
        sobre.titulo;
    }

    var fotoEl =
      $("#sobre-foto");

    if (
      fotoEl &&
      sobre.foto
    ) {
      fotoEl.src =
        sobre.foto;

      fotoEl.alt =
        "Foto de apresentação de " +
        (cfg.nome || "");
    }

    var textoEl =
      $("#sobre-texto");

    if (
      textoEl &&
      Array.isArray(
        sobre.texto
      )
    ) {
      limparEPreencher(
        textoEl,
        sobre.texto.map(
          function (
            paragrafo
          ) {
            return el(
              "p",
              null,
              paragrafo
            );
          }
        )
      );
    }

    var destaquesEl =
      $("#sobre-destaques");

    if (
      destaquesEl &&
      Array.isArray(
        sobre.destaques
      )
    ) {
      limparEPreencher(
        destaquesEl,
        sobre.destaques.map(
          function (item) {
            return el(
              "li",
              null,
              item
            );
          }
        )
      );
    }
  }

  // --------------------------------------------------------------------------
  // SEÇÕES DE PORTFÓLIO
  // --------------------------------------------------------------------------

  function aplicarCabecalhoSecao(
    secaoId,
    dados
  ) {
    if (!dados) return;

    var secao = $(
      secaoId
    );

    if (!secao) return;

    if (
      dados.mostrar === false
    ) {
      secao.hidden = true;
      return;
    }

    secao.hidden = false;

    var eyebrow =
      secao.querySelector(
        "[data-section-eyebrow]"
      );

    var titulo =
      secao.querySelector(
        "[data-section-title]"
      );

    var descricao =
      secao.querySelector(
        "[data-section-description]"
      );

    if (
      eyebrow &&
      dados.eyebrow
    ) {
      eyebrow.textContent =
        dados.eyebrow;
    }

    if (
      titulo &&
      dados.titulo
    ) {
      titulo.textContent =
        dados.titulo;
    }

    if (
      descricao
    ) {
      descricao.textContent =
        dados.descricao ||
        "";
    }
  }

  // --------------------------------------------------------------------------
  // VÍDEOS
  // --------------------------------------------------------------------------

  var ICONE_PLAY =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function renderVideos() {
    var dados =
      cfg.videosSecao ||
      {};

    aplicarCabecalhoSecao(
      "#portfolio-videos",
      dados
    );

    var filtrosEl =
      $("#video-filtros");

    var gridEl =
      $("#video-grid");

    if (!gridEl) return;

    if (
      filtrosEl &&
      Array.isArray(
        cfg.categoriasVideo
      )
    ) {
      limparEPreencher(
        filtrosEl,
        cfg.categoriasVideo.map(
          function (
            categoria,
            indice
          ) {
            var btn = el(
              "button",
              "filtro-btn",
              categoria.rotulo
            );

            btn.type =
              "button";

            btn.dataset.categoria =
              categoria.chave;

            btn.setAttribute(
              "aria-pressed",
              indice === 0
                ? "true"
                : "false"
            );

            return btn;
          }
        )
      );
    }

    if (
      !Array.isArray(
        cfg.videos
      )
    ) {
      return;
    }

    limparEPreencher(
      gridEl,
      cfg.videos.map(
        function (
          video,
          indice
        ) {
          var card = el(
            "button",
            "video-card"
          );

          card.type =
            "button";

          card.dataset.categoria =
            video.categoria ||
            "";

          card.dataset.indice =
            String(indice);

          card.setAttribute(
            "aria-label",
            "Abrir vídeo: " +
              (video.titulo ||
                "")
          );

          var img = el(
            "img"
          );

          img.src =
            video.thumbnail ||
            "";

          img.alt =
            video.titulo ||
            "";

          img.loading =
            "lazy";

          card.appendChild(
            img
          );

          var playIcon =
            el(
              "span",
              "video-play-icon"
            );

          playIcon.innerHTML =
            ICONE_PLAY;

          card.appendChild(
            playIcon
          );

          var overlay =
            el(
              "span",
              "video-card-overlay"
            );

          if (
            video.categoria
          ) {
            overlay.appendChild(
              el(
                "span",
                "video-card-cat",
                rotuloCategoria(
                  video.categoria
                )
              )
            );
          }

          overlay.appendChild(
            el(
              "span",
              "video-card-title",
              video.titulo ||
                ""
            )
          );

          card.appendChild(
            overlay
          );

          return card;
        }
      )
    );
  }

  function rotuloCategoria(
    chave
  ) {
    if (
      !Array.isArray(
        cfg.categoriasVideo
      )
    ) {
      return chave;
    }

    var encontrada =
      cfg.categoriasVideo.filter(
        function (c) {
          return (
            c.chave ===
            chave
          );
        }
      )[0];

    return encontrada
      ? encontrada.rotulo
      : chave;
  }

  function setupFiltrosVideo() {
    var filtrosEl =
      $("#video-filtros");

    var gridEl =
      $("#video-grid");

    if (
      !filtrosEl ||
      !gridEl
    ) {
      return;
    }

    // Evita adicionar vários listeners durante a atualização do Supabase.
    if (
      filtrosEl.dataset.bound ===
      "true"
    ) {
      return;
    }

    filtrosEl.dataset.bound =
      "true";

    filtrosEl.addEventListener(
      "click",
      function (evento) {
        var botao =
          evento.target.closest(
            ".filtro-btn"
          );

        if (!botao) return;

        filtrosEl
          .querySelectorAll(
            ".filtro-btn"
          )
          .forEach(
            function (b) {
              b.setAttribute(
                "aria-pressed",
                "false"
              );
            }
          );

        botao.setAttribute(
          "aria-pressed",
          "true"
        );

        var categoria =
          botao.dataset.categoria;

        gridEl
          .querySelectorAll(
            ".video-card"
          )
          .forEach(
            function (card) {
              var mostrar =
                categoria ===
                  "todos" ||
                card.dataset
                  .categoria ===
                  categoria;

              card.classList.toggle(
                "is-hidden",
                !mostrar
              );
            }
          );
      }
    );
  }

  // --------------------------------------------------------------------------
  // GALERIA
  // --------------------------------------------------------------------------

  function renderGaleria() {
    var dados =
      cfg.galeria ||
      {};

    aplicarCabecalhoSecao(
      "#galeria",
      dados
    );

    var gridEl =
      $("#galeria-grid");

    if (
      !gridEl ||
      !Array.isArray(
        cfg.fotos
      )
    ) {
      return;
    }

    limparEPreencher(
      gridEl,
      cfg.fotos.map(
        function (
          foto,
          indice
        ) {
          var item = el(
            "button",
            "galeria-item"
          );

          item.type =
            "button";

          item.dataset.indice =
            String(indice);

          item.setAttribute(
            "aria-label",
            "Ampliar foto: " +
              (foto.legenda ||
                "")
          );

          var img = el(
            "img"
          );

          img.src =
            foto.imagem ||
            "";

          img.alt =
            foto.legenda ||
            "";

          img.loading =
            "lazy";

          item.appendChild(
            img
          );

          if (
            foto.legenda
          ) {
            item.appendChild(
              el(
                "span",
                "galeria-item-legenda",
                foto.legenda
              )
            );
          }

          return item;
        }
      )
    );
  }

  // --------------------------------------------------------------------------
  // SERVIÇOS
  // --------------------------------------------------------------------------

  function renderServicos() {
    var dados =
      cfg.servicos ||
      {};

    aplicarCabecalhoSecao(
      "#servicos",
      dados
    );

    var gridEl =
      $("#servicos-grid");

    if (
      !gridEl ||
      !Array.isArray(
        dados.itens
      )
    ) {
      return;
    }

    limparEPreencher(
      gridEl,
      dados.itens.map(
        function (
          servico
        ) {
          var card = el(
            "div",
            "servico-card"
          );

          card.appendChild(
            el(
              "h3",
              null,
              servico.titulo ||
                ""
            )
          );

          card.appendChild(
            el(
              "p",
              null,
              servico.descricao ||
                ""
            )
          );

          return card;
        }
      )
    );
  }

  // --------------------------------------------------------------------------
  // PROCESSO
  // --------------------------------------------------------------------------

  function renderProcesso() {
    var dados =
      cfg.processo ||
      {};

    var secao =
      $("#processo");

    if (!secao) {
      return;
    }

    aplicarCabecalhoSecao(
      "#processo",
      dados
    );

    var gridEl =
      $("#processo-grid");

    if (
      !gridEl ||
      !Array.isArray(
        dados.itens
      )
    ) {
      return;
    }

    limparEPreencher(
      gridEl,
      dados.itens.map(
        function (
          passo
        ) {
          var item = el(
            "li",
            "processo-item"
          );

          item.appendChild(
            el(
              "span",
              "processo-numero",
              passo.numero ||
                ""
            )
          );

          item.appendChild(
            el(
              "h3",
              null,
              passo.titulo ||
                ""
            )
          );

          item.appendChild(
            el(
              "p",
              null,
              passo.descricao ||
                ""
            )
          );

          return item;
        }
      )
    );
  }

  // --------------------------------------------------------------------------
  // MARCAS
  // --------------------------------------------------------------------------

  function renderMarcas() {
    var dados =
      cfg.marcas ||
      {};

    aplicarCabecalhoSecao(
      "#marcas",
      dados
    );

    var gridEl =
      $("#marcas-grid");

    if (!gridEl) return;

    if (
      !Array.isArray(
        dados.itens
      ) ||
      dados.itens.length ===
        0
    ) {
      limparEPreencher(
        gridEl,
        [
          el(
            "p",
            "marcas-vazio",
            "Em breve: as marcas parceiras aparecem aqui assim que as primeiras campanhas forem fechadas."
          )
        ]
      );

      return;
    }

    limparEPreencher(
      gridEl,
      dados.itens.map(
        function (
          marca
        ) {
          var card = el(
            "div",
            "marca-card"
          );

          if (
            marca.logo
          ) {
            var img = el(
              "img"
            );

            img.src =
              marca.logo;

            img.alt =
              marca.nome ||
              "";

            card.appendChild(
              img
            );
          }

          card.appendChild(
            el(
              "p",
              "marca-card-nome",
              marca.nome ||
                ""
            )
          );

          if (
            marca.descricao
          ) {
            card.appendChild(
              el(
                "p",
                null,
                marca.descricao
              )
            );
          }

          return card;
        }
      )
    );
  }

  // --------------------------------------------------------------------------
  // RESULTADOS
  // --------------------------------------------------------------------------

  function renderResultados() {
    var dados =
      cfg.resultados ||
      {};

    var secao =
      $("#resultados");

    var gridEl =
      $("#resultados-grid");

    if (
      !secao ||
      !gridEl
    ) {
      return;
    }

    if (
      dados.mostrar !== true
    ) {
      secao.hidden = true;
      return;
    }

    secao.hidden = false;

    aplicarCabecalhoSecao(
      "#resultados",
      dados
    );

    if (
      !Array.isArray(
        dados.itens
      )
    ) {
      return;
    }

    limparEPreencher(
      gridEl,
      dados.itens.map(
        function (
          metrica
        ) {
          var item = el(
            "div",
            "resultado-item"
          );

          item.appendChild(
            el(
              "span",
              "resultado-numero",
              metrica.numero ||
                ""
            )
          );

          item.appendChild(
            el(
              "span",
              "resultado-rotulo",
              metrica.rotulo ||
                ""
            )
          );

          return item;
        }
      )
    );
  }

  // --------------------------------------------------------------------------
  // CTA / CONTATO
  // --------------------------------------------------------------------------

  function renderCTA() {
    var cta =
      cfg.cta ||
      {};

    var tituloEl =
      $("#cta-titulo");

    if (
      tituloEl &&
      cta.titulo
    ) {
      tituloEl.textContent =
        cta.titulo;
    }

    var textoEl =
      $("#cta-texto");

    if (
      textoEl &&
      cta.texto
    ) {
      textoEl.textContent =
        cta.texto;
    }

    var eyebrow =
      $("#cta-eyebrow");

    if (
      eyebrow &&
      cta.eyebrow
    ) {
      eyebrow.textContent =
        cta.eyebrow;
    }

    if (!cfg.contato) {
      return;
    }

    var whatsEl =
      $("#cta-whatsapp");

    if (
      whatsEl &&
      cfg.contato.whatsapp
    ) {
      var mensagem =
        encodeURIComponent(
          cfg.contato
            .whatsappMensagemPadrao ||
            ""
        );

      whatsEl.href =
        "https://wa.me/" +
        cfg.contato.whatsapp +
        "?text=" +
        mensagem;
    }

    var emailEl =
      $("#cta-email");

    if (
      emailEl &&
      cfg.contato.email
    ) {
      emailEl.href =
        "mailto:" +
        cfg.contato.email;
    }

    var instaEl =
      $("#cta-instagram");

    if (instaEl) {
      if (
        cfg.contato.instagram
      ) {
        instaEl.href =
          cfg.contato.instagram;
        instaEl.hidden =
          false;
      } else {
        instaEl.hidden =
          true;
      }
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  function $(
    sel,
    ctx
  ) {
    return (
      ctx ||
      document
    ).querySelector(sel);
  }

  function el(
    tag,
    className,
    texto
  ) {
    var node =
      document.createElement(
        tag
      );

    if (className) {
      node.className =
        className;
    }

    if (
      texto !==
        undefined &&
      texto !== null
    ) {
      node.textContent =
        texto;
    }

    return node;
  }

  function limparEPreencher(
    node,
    filhos
  ) {
    if (!node) return;

    node.innerHTML = "";

    filhos.forEach(
      function (filho) {
        node.appendChild(
          filho
        );
      }
    );
  }

  // --------------------------------------------------------------------------
  // NAVEGAÇÃO MOBILE
  // --------------------------------------------------------------------------

  function setupNav() {
    var toggle =
      $("#nav-toggle");

    var nav =
      $("#main-nav");

    if (
      !toggle ||
      !nav
    ) {
      return;
    }

    if (
      toggle.dataset.bound ===
      "true"
    ) {
      return;
    }

    toggle.dataset.bound =
      "true";

    function fechar() {
      toggle.setAttribute(
        "aria-expanded",
        "false"
      );

      nav.classList.remove(
        "open"
      );

      document.body.style.overflow =
        "";
    }

    function abrir() {
      toggle.setAttribute(
        "aria-expanded",
        "true"
      );

      nav.classList.add(
        "open"
      );

      document.body.style.overflow =
        "hidden";
    }

    toggle.addEventListener(
      "click",
      function () {
        var aberto =
          toggle.getAttribute(
            "aria-expanded"
          ) === "true";

        if (aberto) {
          fechar();
        } else {
          abrir();
        }
      }
    );

    nav.querySelectorAll(
      "a"
    ).forEach(
      function (link) {
        link.addEventListener(
          "click",
          fechar
        );
      }
    );

    document.addEventListener(
      "keydown",
      function (
        evento
      ) {
        if (
          evento.key ===
          "Escape"
        ) {
          fechar();
        }
      }
    );
  }

  // --------------------------------------------------------------------------
  // HEADER AO ROLAR
  // --------------------------------------------------------------------------

  function setupScrollHeader() {
    var header =
      $("#site-header");

    if (!header) return;

    function atualizar() {
      header.classList.toggle(
        "scrolled",
        window.scrollY > 12
      );
    }

    atualizar();

    window.addEventListener(
      "scroll",
      atualizar,
      {
        passive: true
      }
    );
  }

  // --------------------------------------------------------------------------
  // REVEAL
  // --------------------------------------------------------------------------

  function setupReveal() {
    var alvos =
      document.querySelectorAll(
        "[data-reveal]"
      );

    if (!alvos.length) {
      return;
    }

    if (
      !(
        "IntersectionObserver" in
        window
      )
    ) {
      alvos.forEach(
        function (alvo) {
          alvo.classList.add(
            "in-view"
          );
        }
      );

      return;
    }

    var observador =
      new IntersectionObserver(
        function (
          entradas
        ) {
          entradas.forEach(
            function (
              entrada
            ) {
              if (
                entrada.isIntersecting
              ) {
                entrada.target.classList.add(
                  "in-view"
                );

                observador.unobserve(
                  entrada.target
                );
              }
            }
          );
        },
        {
          threshold: 0.12,
          rootMargin:
            "0px 0px -60px 0px"
        }
      );

    alvos.forEach(
      function (alvo) {
        observador.observe(
          alvo
        );
      }
    );
  }

  // --------------------------------------------------------------------------
  // MODAL / LIGHTBOX
  // --------------------------------------------------------------------------

  function setupModal() {
    var overlay =
      $("#modal-overlay");

    var corpo =
      $("#modal-body");

    var botaoFechar =
      $("#modal-close");

    if (
      !overlay ||
      !corpo ||
      !botaoFechar
    ) {
      return;
    }

    if (
      overlay.dataset.bound ===
      "true"
    ) {
      return;
    }

    overlay.dataset.bound =
      "true";

    var elementoQueAbriu =
      null;

    function abrirModal(
      conteudoNode
    ) {
      elementoQueAbriu =
        document.activeElement;

      corpo.innerHTML =
        "";

      corpo.appendChild(
        conteudoNode
      );

      overlay.hidden =
        false;

      void overlay.offsetWidth;

      overlay.classList.add(
        "is-open"
      );

      botaoFechar.focus();

      document.body.style.overflow =
        "hidden";
    }

    function fecharModal() {
      overlay.classList.remove(
        "is-open"
      );

      document.body.style.overflow =
        "";

      window.setTimeout(
        function () {
          overlay.hidden =
            true;

          corpo.innerHTML =
            "";
        },
        420
      );

      if (
        elementoQueAbriu
      ) {
        elementoQueAbriu.focus();
      }
    }

    botaoFechar.addEventListener(
      "click",
      fecharModal
    );

    overlay.addEventListener(
      "click",
      function (
        evento
      ) {
        if (
          evento.target ===
          overlay
        ) {
          fecharModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      function (
        evento
      ) {
        if (
          evento.key ===
            "Escape" &&
          overlay.classList.contains(
            "is-open"
          )
        ) {
          fecharModal();
        }
      }
    );

    var gridVideos =
      $("#video-grid");

    if (
      gridVideos
    ) {
      gridVideos.addEventListener(
        "click",
        function (
          evento
        ) {
          var card =
            evento.target.closest(
              ".video-card"
            );

          if (!card) return;

          var indice =
            Number(
              card.dataset
                .indice
            );

          var video =
            cfg.videos[
              indice
            ];

          if (!video) {
            return;
          }

          var container =
            el("div");

          container.style.position =
            "relative";

          if (video.video) {
            var videoEl =
              document.createElement(
                "video"
              );

            videoEl.src =
              video.video;

            videoEl.controls =
              true;

            videoEl.autoplay =
              true;

            videoEl.playsInline =
              true;

            videoEl.poster =
              video.thumbnail ||
              "";

            container.appendChild(
              videoEl
            );
          } else {
            var imgEl =
              document.createElement(
                "img"
              );

            imgEl.src =
              video.thumbnail ||
              "";

            imgEl.alt =
              video.titulo ||
              "";

            container.appendChild(
              imgEl
            );
          }

          container.appendChild(
            el(
              "p",
              "modal-body-info",
              (video.titulo ||
                "") +
                (video.marca
                  ? " · " +
                    video.marca
                  : "")
            )
          );

          abrirModal(
            container
          );
        }
      );
    }

    var gridGaleria =
      $("#galeria-grid");

    if (
      gridGaleria
    ) {
      gridGaleria.addEventListener(
        "click",
        function (
          evento
        ) {
          var item =
            evento.target.closest(
              ".galeria-item"
            );

          if (!item) return;

          var indice =
            Number(
              item.dataset
                .indice
            );

          var foto =
            cfg.fotos[
              indice
            ];

          if (!foto) {
            return;
          }

          var imgEl =
            document.createElement(
              "img"
            );

          imgEl.src =
            foto.imagem ||
            "";

          imgEl.alt =
            foto.legenda ||
            "";

          var container =
            el("div");

          container.style.position =
            "relative";

          container.appendChild(
            imgEl
          );

          if (
            foto.legenda
          ) {
            container.appendChild(
              el(
                "p",
                "modal-body-info",
                foto.legenda
              )
            );
          }

          abrirModal(
            container
          );
        }
      );
    }
  }

  // --------------------------------------------------------------------------
  // SERVICE WORKER
  // --------------------------------------------------------------------------

  function registrarServiceWorker() {
    if (
      !(
        "serviceWorker" in
        navigator
      )
    ) {
      return;
    }

    window.addEventListener(
      "load",
      function () {
        navigator.serviceWorker
          .register("sw.js")
          .catch(
            function () {
              // Continua normalmente.
            }
          );
      }
    );
  }

  // --------------------------------------------------------------------------
  // PWA INSTALL PROMPT
  // --------------------------------------------------------------------------

  function setupInstallPrompt() {
    var toast =
      $("#install-toast");

    var botaoInstalar =
      $("#install-toast-btn");

    var botaoDispensar =
      $("#install-toast-dismiss");

    if (
      !toast ||
      !botaoInstalar ||
      !botaoDispensar
    ) {
      return;
    }

    if (
      toast.dataset.bound ===
      "true"
    ) {
      return;
    }

    toast.dataset.bound =
      "true";

    var eventoDiferido =
      null;

    var CHAVE_DISPENSADO =
      "ugcPortfolioInstallDismissed";

    window.addEventListener(
      "beforeinstallprompt",
      function (
        evento
      ) {
        evento.preventDefault();

        eventoDiferido =
          evento;

        var jaDispensado =
          false;

        try {
          jaDispensado =
            window.localStorage.getItem(
              CHAVE_DISPENSADO
            ) === "1";
        } catch (
          erro
        ) {
          jaDispensado =
            false;
        }

        if (
          !jaDispensado
        ) {
          toast.hidden =
            false;

          window.setTimeout(
            function () {
              toast.classList.add(
                "is-visible"
              );
            },
            50
          );
        }
      }
    );

    botaoInstalar.addEventListener(
      "click",
      function () {
        if (
          !eventoDiferido
        ) {
          return;
        }

        eventoDiferido.prompt();

        eventoDiferido.userChoice.finally(
          function () {
            eventoDiferido =
              null;

            esconderToast();
          }
        );
      }
    );

    botaoDispensar.addEventListener(
      "click",
      function () {
        try {
          window.localStorage.setItem(
            CHAVE_DISPENSADO,
            "1"
          );
        } catch (
          erro
        ) {
          // Continua normalmente.
        }

        esconderToast();
      }
    );

    function esconderToast() {
      toast.classList.remove(
        "is-visible"
      );

      window.setTimeout(
        function () {
          toast.hidden =
            true;
        },
        300
      );
    }
  }
})();
