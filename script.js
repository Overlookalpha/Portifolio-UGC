/*
  ============================================================================
  SCRIPT.JS — Portfólio UGC Creator
  ============================================================================
  Lê os dados de SITE_CONFIG (config.js) e monta a página, além de cuidar
  das interações: menu mobile, filtros de vídeo, modal/lightbox, animações
  de entrada, registro do service worker e prompt de instalação do PWA.
  ============================================================================
*/

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    aplicarMetaBasica();
    renderHeaderFooter();
    renderHero();
    renderSobre();
    renderVideos();
    renderGaleria();
    renderServicos();
    renderProcesso();
    renderMarcas();
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
  }

  // ------------------------------------------------------------------
  // Mídias reais cadastradas no painel admin (Supabase)
  // ------------------------------------------------------------------
  // Busca fotos/vídeos reais do banco (tabela "midias", alimentada pelo
  // admin.html) e, se encontrar algo, substitui os placeholders de
  // config.js e re-renderiza as seções de vídeo e galeria. Se o Supabase
  // não estiver configurado, a biblioteca não carregar (ex: offline) ou
  // ainda não houver nenhuma mídia cadastrada, o site continua mostrando
  // o conteúdo padrão de config.js normalmente — nada quebra.
  function buscarMidiasDoSupabase() {
    if (!cfg.supabase || !cfg.supabase.url || !cfg.supabase.anonKey) {
      return Promise.resolve(null);
    }
    if (typeof window.supabase === "undefined") {
      return Promise.resolve(null);
    }

    var cliente = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);

    return cliente
      .from("midias")
      .select("*")
      .order("ordem", { ascending: true })
      .then(function (resposta) {
        if (resposta.error || !Array.isArray(resposta.data)) return null;

        var linhas = resposta.data;

        var videos = linhas
          .filter(function (m) {
            return m.tipo === "video";
          })
          .map(function (m) {
            return {
              titulo: m.titulo || "",
              categoria: m.categoria || "",
              marca: m.marca || "",
              descricao: m.descricao || "",
              thumbnail: m.thumbnail_url || m.arquivo_url || "",
              video: m.arquivo_url || "",
              destaque: !!m.destaque
            };
          });

        var fotos = linhas
          .filter(function (m) {
            return m.tipo === "foto";
          })
          .map(function (m) {
            return {
              legenda: m.titulo || "",
              categoria: m.categoria || "",
              imagem: m.arquivo_url || m.thumbnail_url || "",
              destaque: !!m.destaque
            };
          });

        if (!videos.length && !fotos.length) return null;

        return { videos: videos, fotos: fotos };
      });
  }

  function atualizarMidiasComSupabase() {
    buscarMidiasDoSupabase()
      .then(function (dados) {
        if (!dados) return;
        if (Array.isArray(dados.videos)) cfg.videos = dados.videos;
        if (Array.isArray(dados.fotos)) cfg.fotos = dados.fotos;
        renderVideos();
        renderGaleria();
      })
      .catch(function () {
        // mantem o conteudo padrao de config.js caso a busca falhe
      });
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function el(tag, className, texto) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (texto !== undefined && texto !== null) node.textContent = texto;
    return node;
  }

  function limparEPreencher(node, filhos) {
    if (!node) return;
    node.innerHTML = "";
    filhos.forEach(function (filho) {
      node.appendChild(filho);
    });
  }

  // ------------------------------------------------------------------
  // Meta / título / theme-color dinâmicos a partir do config
  // ------------------------------------------------------------------
  function aplicarMetaBasica() {
    if (cfg.idioma) document.documentElement.setAttribute("lang", cfg.idioma);

    if (cfg.nome && cfg.titulo) {
      document.title = cfg.nome + " — " + cfg.titulo + " | Portfólio & Media Kit";
    }

    var metaTheme = $('meta[name="theme-color"]');
    if (metaTheme && cfg.corTema) metaTheme.setAttribute("content", cfg.corTema);

    [
      ["meta[name=\"description\"]", "content", cfg.descricaoCurta],
      ["meta[property=\"og:title\"]", "content", cfg.nome + " — " + cfg.titulo],
      ["meta[property=\"og:description\"]", "content", cfg.descricaoCurta],
      ["meta[name=\"twitter:title\"]", "content", cfg.nome + " — " + cfg.titulo],
      ["meta[name=\"twitter:description\"]", "content", cfg.descricaoCurta],
      ["meta[name=\"apple-mobile-web-app-title\"]", "content", cfg.nomeCurto]
    ].forEach(function (item) {
      var node = document.querySelector(item[0]);
      if (node && item[2]) node.setAttribute(item[1], item[2]);
    });
  }

  // ------------------------------------------------------------------
  // Header / Footer
  // ------------------------------------------------------------------
  function renderHeaderFooter() {
    var brand = $("#brand-nome");
    if (brand && cfg.nome) brand.textContent = cfg.nome;

    var footerNome = $("#footer-nome");
    if (footerNome && cfg.nome) footerNome.textContent = cfg.nome;

    var footerLinks = $("#footer-links");
    if (footerLinks && cfg.contato) {
      var links = [];
      if (cfg.contato.instagram) links.push(["Instagram", cfg.contato.instagram]);
      if (cfg.contato.tiktok) links.push(["TikTok", cfg.contato.tiktok]);
      if (cfg.contato.youtube) links.push(["YouTube", cfg.contato.youtube]);
      if (cfg.contato.email) links.push(["E-mail", "mailto:" + cfg.contato.email]);

      limparEPreencher(
        footerLinks,
        links.map(function (par) {
          var li = el("li");
          var a = el("a", null, par[0]);
          a.href = par[1];
          if (par[1].indexOf("http") === 0) {
            a.target = "_blank";
            a.rel = "noopener";
          }
          li.appendChild(a);
          return li;
        })
      );
    }

    var footerCopy = $("#footer-copy");
    if (footerCopy && cfg.nome) {
      var ano = new Date().getFullYear();
      footerCopy.textContent = "© " + ano + " " + cfg.nome + ". Todos os direitos reservados.";
    }
  }

  // ------------------------------------------------------------------
  // Hero
  // ------------------------------------------------------------------
  function renderHero() {
    var nomeEl = $("#hero-nome");
    if (nomeEl && cfg.nome) nomeEl.textContent = cfg.nome;

    var fraseEl = $("#hero-frase");
    if (fraseEl && cfg.fraseDeImpacto) fraseEl.textContent = cfg.fraseDeImpacto;

    var fotoEl = $("#hero-foto");
    if (fotoEl && cfg.sobre && cfg.sobre.foto) {
      // usa a mesma imagem de destaque se não houver uma específica de hero
      fotoEl.alt = "Foto de " + (cfg.nome || "capa do portfólio");
    }
  }

  // ------------------------------------------------------------------
  // Sobre
  // ------------------------------------------------------------------
  function renderSobre() {
    if (!cfg.sobre) return;

    var fotoEl = $("#sobre-foto");
    if (fotoEl && cfg.sobre.foto) {
      fotoEl.src = cfg.sobre.foto;
      fotoEl.alt = "Foto de apresentação de " + (cfg.nome || "");
    }

    var textoEl = $("#sobre-texto");
    if (textoEl && Array.isArray(cfg.sobre.texto)) {
      limparEPreencher(
        textoEl,
        cfg.sobre.texto.map(function (paragrafo) {
          return el("p", null, paragrafo);
        })
      );
    }

    var destaquesEl = $("#sobre-destaques");
    if (destaquesEl && Array.isArray(cfg.sobre.destaques)) {
      limparEPreencher(
        destaquesEl,
        cfg.sobre.destaques.map(function (item) {
          return el("li", null, item);
        })
      );
    }
  }

  // ------------------------------------------------------------------
  // Vídeos
  // ------------------------------------------------------------------
  var ICONE_PLAY =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function renderVideos() {
    var filtrosEl = $("#video-filtros");
    var gridEl = $("#video-grid");
    if (!gridEl) return;

    if (filtrosEl && Array.isArray(cfg.categoriasVideo)) {
      limparEPreencher(
        filtrosEl,
        cfg.categoriasVideo.map(function (categoria, indice) {
          var btn = el("button", "filtro-btn", categoria.rotulo);
          btn.type = "button";
          btn.dataset.categoria = categoria.chave;
          btn.setAttribute("aria-pressed", indice === 0 ? "true" : "false");
          return btn;
        })
      );
    }

    if (Array.isArray(cfg.videos)) {
      limparEPreencher(
        gridEl,
        cfg.videos.map(function (video, indice) {
          var card = el("button", "video-card");
          card.type = "button";
          card.dataset.categoria = video.categoria;
          card.dataset.indice = String(indice);
          card.setAttribute(
            "aria-label",
            "Abrir vídeo: " + video.titulo + (video.marca ? " — " + video.marca : "")
          );

          var img = el("img");
          img.src = video.thumbnail;
          img.alt = video.titulo || "";
          img.loading = "lazy";
          card.appendChild(img);

          var playIcon = el("span", "video-play-icon");
          playIcon.innerHTML = ICONE_PLAY;
          card.appendChild(playIcon);

          var overlay = el("span", "video-card-overlay");
          if (video.categoria) {
            var catRotulo = rotuloCategoria(video.categoria);
            overlay.appendChild(el("span", "video-card-cat", catRotulo));
          }
          overlay.appendChild(el("span", "video-card-title", video.titulo || ""));
          card.appendChild(overlay);

          return card;
        })
      );
    }
  }

  function rotuloCategoria(chave) {
    if (!Array.isArray(cfg.categoriasVideo)) return chave;
    var encontrada = cfg.categoriasVideo.filter(function (c) {
      return c.chave === chave;
    })[0];
    return encontrada ? encontrada.rotulo : chave;
  }

  function setupFiltrosVideo() {
    var filtrosEl = $("#video-filtros");
    var gridEl = $("#video-grid");
    if (!filtrosEl || !gridEl) return;

    filtrosEl.addEventListener("click", function (evento) {
      var botao = evento.target.closest(".filtro-btn");
      if (!botao) return;

      var botoes = filtrosEl.querySelectorAll(".filtro-btn");
      botoes.forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
      });
      botao.setAttribute("aria-pressed", "true");

      var categoria = botao.dataset.categoria;
      var cards = gridEl.querySelectorAll(".video-card");
      cards.forEach(function (card) {
        var mostrar = categoria === "todos" || card.dataset.categoria === categoria;
        card.classList.toggle("is-hidden", !mostrar);
      });
    });
  }

  // ------------------------------------------------------------------
  // Galeria
  // ------------------------------------------------------------------
  function renderGaleria() {
    var gridEl = $("#galeria-grid");
    if (!gridEl || !Array.isArray(cfg.fotos)) return;

    limparEPreencher(
      gridEl,
      cfg.fotos.map(function (foto, indice) {
        var item = el("button", "galeria-item");
        item.type = "button";
        item.dataset.indice = String(indice);
        item.setAttribute("aria-label", "Ampliar foto: " + (foto.legenda || ""));

        var img = el("img");
        img.src = foto.imagem;
        img.alt = foto.legenda || "";
        img.loading = "lazy";
        item.appendChild(img);

        if (foto.legenda) {
          var legenda = el("span", "galeria-item-legenda", foto.legenda);
          item.appendChild(legenda);
        }

        return item;
      })
    );
  }

  // ------------------------------------------------------------------
  // Serviços
  // ------------------------------------------------------------------
  function renderServicos() {
    var gridEl = $("#servicos-grid");
    if (!gridEl || !Array.isArray(cfg.servicos)) return;

    limparEPreencher(
      gridEl,
      cfg.servicos.map(function (servico) {
        var card = el("div", "servico-card");
        card.appendChild(el("h3", null, servico.titulo));
        card.appendChild(el("p", null, servico.descricao));
        return card;
      })
    );
  }

  // ------------------------------------------------------------------
  // Como funciona
  // ------------------------------------------------------------------
  function renderProcesso() {
    var gridEl = $("#processo-grid");
    if (!gridEl || !Array.isArray(cfg.processo)) return;

    limparEPreencher(
      gridEl,
      cfg.processo.map(function (passo) {
        var item = el("li", "processo-item");
        item.appendChild(el("span", "processo-numero", passo.numero));
        item.appendChild(el("h3", null, passo.titulo));
        item.appendChild(el("p", null, passo.descricao));
        return item;
      })
    );
  }

  // ------------------------------------------------------------------
  // Marcas
  // ------------------------------------------------------------------
  function renderMarcas() {
    var gridEl = $("#marcas-grid");
    var secao = $("#marcas");
    if (!gridEl) return;

    if (!Array.isArray(cfg.marcas) || cfg.marcas.length === 0) {
      var vazio = el(
        "p",
        "marcas-vazio",
        "Em breve: as marcas parceiras aparecem aqui assim que as primeiras campanhas forem fechadas."
      );
      limparEPreencher(gridEl, [vazio]);
      return;
    }

    limparEPreencher(
      gridEl,
      cfg.marcas.map(function (marca) {
        var card = el("div", "marca-card");
        card.appendChild(el("p", "marca-card-nome", marca.nome));
        if (marca.descricao) card.appendChild(el("p", null, marca.descricao));
        return card;
      })
    );
  }

  // ------------------------------------------------------------------
  // Resultados
  // ------------------------------------------------------------------
  function renderResultados() {
    var secao = $("#resultados");
    var gridEl = $("#resultados-grid");
    if (!secao || !gridEl) return;

    if (!cfg.mostrarMetricas) {
      secao.hidden = true;
      return;
    }

    if (Array.isArray(cfg.metricas)) {
      limparEPreencher(
        gridEl,
        cfg.metricas.map(function (metrica) {
          var item = el("div", "resultado-item");
          item.appendChild(el("span", "resultado-numero", metrica.numero));
          item.appendChild(el("span", "resultado-rotulo", metrica.rotulo));
          return item;
        })
      );
    }
  }

  // ------------------------------------------------------------------
  // CTA final
  // ------------------------------------------------------------------
  function renderCTA() {
    if (!cfg.cta) return;

    var tituloEl = $("#cta-titulo");
    if (tituloEl && cfg.cta.titulo) tituloEl.textContent = cfg.cta.titulo;

    var textoEl = $("#cta-texto");
    if (textoEl && cfg.cta.texto) textoEl.textContent = cfg.cta.texto;

    if (cfg.contato) {
      var whatsEl = $("#cta-whatsapp");
      if (whatsEl && cfg.contato.whatsapp) {
        var mensagem = encodeURIComponent(cfg.contato.whatsappMensagemPadrao || "");
        whatsEl.href = "https://wa.me/" + cfg.contato.whatsapp + "?text=" + mensagem;
      }

      var emailEl = $("#cta-email");
      if (emailEl && cfg.contato.email) {
        emailEl.href = "mailto:" + cfg.contato.email;
      }

      var instaEl = $("#cta-instagram");
      if (instaEl) {
        if (cfg.contato.instagram) {
          instaEl.href = cfg.contato.instagram;
        } else {
          instaEl.hidden = true;
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // Navegação mobile
  // ------------------------------------------------------------------
  function setupNav() {
    var toggle = $("#nav-toggle");
    var nav = $("#main-nav");
    if (!toggle || !nav) return;

    function fechar() {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
      document.body.style.overflow = "";
    }

    function abrir() {
      toggle.setAttribute("aria-expanded", "true");
      nav.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    toggle.addEventListener("click", function () {
      var aberto = toggle.getAttribute("aria-expanded") === "true";
      if (aberto) {
        fechar();
      } else {
        abrir();
      }
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", fechar);
    });

    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape") fechar();
    });
  }

  // ------------------------------------------------------------------
  // Header com fundo ao rolar
  // ------------------------------------------------------------------
  function setupScrollHeader() {
    var header = $("#site-header");
    if (!header) return;

    function atualizar() {
      header.classList.toggle("scrolled", window.scrollY > 12);
    }

    atualizar();
    window.addEventListener("scroll", atualizar, { passive: true });
  }

  // ------------------------------------------------------------------
  // Reveal on scroll
  // ------------------------------------------------------------------
  function setupReveal() {
    var alvos = document.querySelectorAll("[data-reveal]");
    if (!alvos.length) return;

    if (!("IntersectionObserver" in window)) {
      alvos.forEach(function (alvo) {
        alvo.classList.add("in-view");
      });
      return;
    }

    var observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("in-view");
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    alvos.forEach(function (alvo) {
      observador.observe(alvo);
    });
  }

  // ------------------------------------------------------------------
  // Modal / Lightbox
  // ------------------------------------------------------------------
  function setupModal() {
    var overlay = $("#modal-overlay");
    var corpo = $("#modal-body");
    var botaoFechar = $("#modal-close");
    if (!overlay || !corpo || !botaoFechar) return;

    var elementoQueAbriu = null;

    function abrirModal(conteudoNode) {
      elementoQueAbriu = document.activeElement;
      corpo.innerHTML = "";
      corpo.appendChild(conteudoNode);
      overlay.hidden = false;
      // força reflow antes de animar
      void overlay.offsetWidth;
      overlay.classList.add("is-open");
      botaoFechar.focus();
      document.body.style.overflow = "hidden";
    }

    function fecharModal() {
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        overlay.hidden = true;
        corpo.innerHTML = "";
      }, 420);
      if (elementoQueAbriu) elementoQueAbriu.focus();
    }

    botaoFechar.addEventListener("click", fecharModal);
    overlay.addEventListener("click", function (evento) {
      if (evento.target === overlay) fecharModal();
    });
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && overlay.classList.contains("is-open")) fecharModal();
    });

    // Vídeos
    var gridVideos = $("#video-grid");
    if (gridVideos && Array.isArray(cfg.videos)) {
      gridVideos.addEventListener("click", function (evento) {
        var card = evento.target.closest(".video-card");
        if (!card) return;
        var indice = Number(card.dataset.indice);
        var video = cfg.videos[indice];
        if (!video) return;

        var wrapper = document.createDocumentFragment();

        if (video.video) {
          var videoEl = document.createElement("video");
          videoEl.src = video.video;
          videoEl.controls = true;
          videoEl.autoplay = true;
          videoEl.playsInline = true;
          videoEl.poster = video.thumbnail;
          wrapper.appendChild(videoEl);
        } else {
          var imgEl = document.createElement("img");
          imgEl.src = video.thumbnail;
          imgEl.alt = video.titulo || "";
          wrapper.appendChild(imgEl);
        }

        var info = el(
          "p",
          "modal-body-info",
          (video.titulo || "") + (video.marca ? " · " + video.marca : "")
        );

        var container = el("div");
        container.style.position = "relative";
        container.appendChild(wrapper);
        container.appendChild(info);

        abrirModal(container);
      });
    }

    // Fotos
    var gridGaleria = $("#galeria-grid");
    if (gridGaleria && Array.isArray(cfg.fotos)) {
      gridGaleria.addEventListener("click", function (evento) {
        var item = evento.target.closest(".galeria-item");
        if (!item) return;
        var indice = Number(item.dataset.indice);
        var foto = cfg.fotos[indice];
        if (!foto) return;

        var imgEl = document.createElement("img");
        imgEl.src = foto.imagem;
        imgEl.alt = foto.legenda || "";

        var container = el("div");
        container.style.position = "relative";
        container.appendChild(imgEl);

        if (foto.legenda) {
          container.appendChild(el("p", "modal-body-info", foto.legenda));
        }

        abrirModal(container);
      });
    }
  }

  // ------------------------------------------------------------------
  // Service worker
  // ------------------------------------------------------------------
  function registrarServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {
        // instalação do site continua funcionando normalmente mesmo
        // se o service worker não registrar (ex: em file:// local)
      });
    });
  }

  // ------------------------------------------------------------------
  // Prompt de instalação do PWA
  // ------------------------------------------------------------------
  function setupInstallPrompt() {
    var toast = $("#install-toast");
    var botaoInstalar = $("#install-toast-btn");
    var botaoDispensar = $("#install-toast-dismiss");
    if (!toast || !botaoInstalar || !botaoDispensar) return;

    var eventoDiferido = null;
    var CHAVE_DISPENSADO = "ugcPortfolioInstallDismissed";

    window.addEventListener("beforeinstallprompt", function (evento) {
      evento.preventDefault();
      eventoDiferido = evento;

      var jaDispensado = false;
      try {
        jaDispensado = window.localStorage.getItem(CHAVE_DISPENSADO) === "1";
      } catch (erro) {
        jaDispensado = false;
      }

      if (!jaDispensado) {
        toast.hidden = false;
        window.setTimeout(function () {
          toast.classList.add("is-visible");
        }, 50);
      }
    });

    botaoInstalar.addEventListener("click", function () {
      if (!eventoDiferido) return;
      eventoDiferido.prompt();
      eventoDiferido.userChoice.finally(function () {
        eventoDiferido = null;
        esconderToast();
      });
    });

    botaoDispensar.addEventListener("click", function () {
      try {
        window.localStorage.setItem(CHAVE_DISPENSADO, "1");
      } catch (erro) {
        // se o navegador bloquear localStorage (modo privado, etc.),
        // apenas segue sem lembrar a escolha
      }
      esconderToast();
    });

    function esconderToast() {
      toast.classList.remove("is-visible");
      window.setTimeout(function () {
        toast.hidden = true;
      }, 300);
    }
  }
})();
