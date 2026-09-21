/*
  ============================================================================
  ADMIN.JS — Painel administrativo do portfólio
  ============================================================================
  Login Supabase + editor visual + CRUD de fotos/vídeos.
  O conteúdo textual é salvo em public.conteudo_site.
  As mídias continuam em public.midias + Storage.
  ============================================================================
*/

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var sb = null;
  var BUCKET = "midias";
  var usuarioAtual = null;
  var conteudoRowId = null;

  var cache = {
    videos: [],
    fotos: []
  };

  var abaAtiva = "pagina";
  var conteudoAtual = null;
  var toastTimer = null;

  document.addEventListener("DOMContentLoaded", init);

  /* ========================================================================
     INICIALIZAÇÃO
  ======================================================================== */

  function init() {
    if (!cfg.supabase || !cfg.supabase.url || !cfg.supabase.anonKey) {
      mostrarToast("Configuração do Supabase ausente em config.js", true);
      return;
    }

    sb = window.supabase.createClient(
      cfg.supabase.url,
      cfg.supabase.anonKey
    );

    wireLogin();
    wireSair();
    wireAbas();
    wireAdicionar();
    wireEditorPagina();
    wireFotoCabecalho();
    wireUploadsFotosPagina();
    wireAparencia();

    sb.auth.getSession().then(function (resposta) {
      var sessao =
        resposta && resposta.data
          ? resposta.data.session
          : null;

      if (sessao) {
        usuarioAtual = sessao.user;
        entrarNoPainel();
      } else {
        mostrarLogin();
      }
    });

    sb.auth.onAuthStateChange(function (_evento, sessao) {
      if (sessao) {
        usuarioAtual = sessao.user;
        entrarNoPainel();
      } else {
        usuarioAtual = null;
        mostrarLogin();
      }
    });
  }

  /* ========================================================================
     HELPERS
  ======================================================================== */

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $all(sel, ctx) {
    return Array.prototype.slice.call(
      (ctx || document).querySelectorAll(sel)
    );
  }

  function valor(id, fallback) {
    var campo = $("#" + id);

    if (!campo) {
      return fallback || "";
    }

    return campo.value;
  }

  function marcado(id) {
    var campo = $("#" + id);
    return campo ? !!campo.checked : false;
  }

  function definirValor(id, valorCampo) {
    var campo = $("#" + id);

    if (!campo) return;

    if (campo.type === "checkbox") {
      campo.checked = !!valorCampo;
    } else {
      campo.value =
        valorCampo === null || valorCampo === undefined
          ? ""
          : valorCampo;
    }
  }

  function definirMarcado(id, valorCampo) {
    var campo = $("#" + id);
    if (campo) campo.checked = !!valorCampo;
  }

  function mostrarToast(mensagem, erro) {
    var toast = $("#admin-toast");

    if (!toast) return;

    toast.textContent = mensagem;
    toast.classList.toggle("is-erro", !!erro);
    toast.hidden = false;

    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }

    toastTimer = window.setTimeout(function () {
      toast.hidden = true;
    }, 3200);
  }

  function clonar(objeto) {
    try {
      return JSON.parse(JSON.stringify(objeto || {}));
    } catch (_erro) {
      return {};
    }
  }

  function mesclarProfundo(destino, origem) {
    if (!origem || typeof origem !== "object") {
      return destino;
    }

    Object.keys(origem).forEach(function (chave) {
      var valorOrigem = origem[chave];

      if (
        valorOrigem &&
        typeof valorOrigem === "object" &&
        !Array.isArray(valorOrigem)
      ) {
        if (
          !destino[chave] ||
          typeof destino[chave] !== "object" ||
          Array.isArray(destino[chave])
        ) {
          destino[chave] = {};
        }

        mesclarProfundo(destino[chave], valorOrigem);
      } else {
        destino[chave] = valorOrigem;
      }
    });

    return destino;
  }

  function textoParaArray(texto) {
    return String(texto || "")
      .split(/\n\s*\n/)
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
  }

  function arrayParaTexto(lista) {
    if (!Array.isArray(lista)) return "";
    return lista.join("\n\n");
  }

  /*
    Cria uma cópia segura da configuração sem guardar a chave
    do Supabase dentro da tabela conteudo_site.
  */
  function criarBaseEditavel() {
    var base = clonar(cfg);

    delete base.supabase;
    delete base.videos;
    delete base.fotos;

    return base;
  }

  /* ========================================================================
     LOGIN
  ======================================================================== */

  function wireLogin() {
    var form = $("#form-login");

    if (!form) return;

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();

      var email = valor("login-email").trim();
      var senha = valor("login-senha");

      var botao = $("#btn-entrar");
      var erroEl = $("#login-erro");

      if (erroEl) {
        erroEl.hidden = true;
      }

      if (botao) {
        botao.disabled = true;
        botao.textContent = "Entrando...";
      }

      sb.auth
        .signInWithPassword({
          email: email,
          password: senha
        })
        .then(function (resposta) {
          if (resposta.error) {
            if (erroEl) {
              erroEl.textContent = "E-mail ou senha incorretos.";
              erroEl.hidden = false;
            }
          }
        })
        .catch(function () {
          if (erroEl) {
            erroEl.textContent =
              "Não foi possível entrar. Verifique sua internet.";
            erroEl.hidden = false;
          }
        })
        .finally(function () {
          if (botao) {
            botao.disabled = false;
            botao.textContent = "Entrar";
          }
        });
    });
  }

  function wireSair() {
    var botao = $("#btn-sair");

    if (!botao) return;

    botao.addEventListener("click", function () {
      sb.auth.signOut();
    });
  }

  function mostrarLogin() {
    var login = $("#tela-login");
    var painel = $("#tela-painel");

    if (login) login.hidden = false;
    if (painel) painel.hidden = true;
  }

  function entrarNoPainel() {
    var login = $("#tela-login");
    var painel = $("#tela-painel");

    if (login) login.hidden = true;
    if (painel) painel.hidden = false;

    atualizarLinksPortfolio();

    carregarMidias();
    carregarConteudoPagina();
  }

  function portfolioId() {
    return usuarioAtual && usuarioAtual.id ? usuarioAtual.id : "";
  }

  function urlPortfolioPublico() {
    return "index.html?cliente=" + encodeURIComponent(portfolioId());
  }

  function atualizarLinksPortfolio() {
    var url = urlPortfolioPublico();
    var preview = $("#preview-site");
    var abrir = $(".admin-preview-top a[target='_blank']");

    if (preview && portfolioId()) preview.src = url;
    if (abrir && portfolioId()) abrir.href = url;
  }

  /* ========================================================================
     ABAS
  ======================================================================== */

  function wireAbas() {
    $all(".admin-aba").forEach(function (botao) {
      botao.addEventListener("click", function () {
        abaAtiva = botao.dataset.aba;

        $all(".admin-aba").forEach(function (b) {
          var ativa = b === botao;

          b.classList.toggle("is-ativa", ativa);
          b.setAttribute(
            "aria-selected",
            ativa ? "true" : "false"
          );
        });

        $all(".admin-secao").forEach(function (secao) {
          secao.hidden =
            secao.dataset.secao !== abaAtiva;
        });
      });
    });
  }

  /* ========================================================================
     EDITOR VISUAL
  ======================================================================== */

  function dadosPadraoPagina() {
    var base = criarBaseEditavel();

    return base;
  }

  function carregarConteudoPagina() {
    sb.from("conteudo_site")
      .select("id,dados")
      .eq("owner_id", portfolioId())
      .maybeSingle()
      .then(function (resposta) {
        var base = dadosPadraoPagina();

        if (
          !resposta.error &&
          resposta.data &&
          resposta.data.dados
        ) {
          conteudoRowId = resposta.data.id;
          base = mesclarProfundo(
            base,
            resposta.data.dados
          );
        }

        conteudoRowId = conteudoRowId || portfolioId();
        conteudoAtual = base;

        preencherEditorPagina(conteudoAtual);
      })
      .catch(function (erro) {
        conteudoAtual = dadosPadraoPagina();

        preencherEditorPagina(conteudoAtual);

        mostrarToast(
          "Não foi possível carregar o conteúdo salvo.",
          true
        );

        console.error(erro);
      });
  }

  function preencherEditorPagina(dados) {
    dados = dados || {};

    var identidade = dados.identidade || {};
    var hero = dados.hero || {};
    var videosSecao = dados.videosSecao || {};
    var galeria = dados.galeria || {};
    var servicos = dados.servicos || {};
    var processo = dados.processo || {};
    var marcas = dados.marcas || {};
    var sobre = dados.sobre || {};
    var resultados = dados.resultados || {};
    var contato = dados.contato || {};
    var cta = dados.cta || {};
    var rodape = dados.rodape || {};
    var aparencia = dados.aparencia || {};
    var header = dados.header || {};

    /* IDENTIDADE */

    definirValor(
      "pagina-nome",
      identidade.nome || dados.nome || ""
    );

    definirValor(
      "pagina-nome-curto",
      identidade.nomeCurto ||
        dados.nomeCurto ||
        ""
    );

    definirValor(
      "pagina-titulo",
      identidade.titulo ||
        dados.titulo ||
        ""
    );

    definirValor(
      "pagina-frase",
      identidade.fraseDeImpacto ||
        dados.fraseDeImpacto ||
        hero.frase ||
        ""
    );

    definirValor(
      "pagina-descricao",
      identidade.descricaoCurta ||
        dados.descricaoCurta ||
        ""
    );

    /* HERO */

    definirValor(
      "pagina-hero-eyebrow",
      hero.eyebrow || "UGC Creator"
    );

    definirValor(
      "pagina-hero-botao",
      hero.botaoTexto || "Ver portfólio"
    );

    definirValor(
      "pagina-hero-destino",
      hero.botaoDestino || "#portfolio-videos"
    );

    definirValor(
      "pagina-foto",
      hero.foto ||
        sobre.foto ||
        dados.foto ||
        ""
    );

    /* VÍDEOS */

    definirMarcado(
      "pagina-videos-mostrar",
      videosSecao.mostrar !== false
    );

    definirValor(
      "pagina-videos-eyebrow",
      videosSecao.eyebrow || "Portfólio"
    );

    definirValor(
      "pagina-videos-titulo",
      videosSecao.titulo || "Vídeos UGC"
    );

    definirValor(
      "pagina-videos-descricao",
      videosSecao.descricao || ""
    );

    /* GALERIA */

    definirMarcado(
      "pagina-galeria-mostrar",
      galeria.mostrar !== false
    );

    definirValor(
      "pagina-galeria-eyebrow",
      galeria.eyebrow || "Galeria"
    );

    definirValor(
      "pagina-galeria-titulo",
      galeria.titulo || "Fotografia"
    );

    definirValor(
      "pagina-galeria-descricao",
      galeria.descricao || ""
    );

    /* SERVIÇOS */

    definirMarcado(
      "pagina-servicos-mostrar",
      servicos.mostrar !== false
    );

    definirValor(
      "pagina-servicos-eyebrow",
      servicos.eyebrow || "Serviços"
    );

    definirValor(
      "pagina-servicos-titulo",
      servicos.titulo || ""
    );

    definirValor(
      "pagina-servicos-descricao",
      servicos.descricao || ""
    );

    /* PROCESSO */

    definirMarcado(
      "pagina-processo-mostrar",
      processo.mostrar === true
    );

    definirValor(
      "pagina-processo-eyebrow",
      processo.eyebrow || "Processo"
    );

    definirValor(
      "pagina-processo-titulo",
      processo.titulo || "Como funciona"
    );

    definirValor(
      "pagina-processo-descricao",
      processo.descricao || ""
    );

    /* MARCAS */

    definirMarcado(
      "pagina-marcas-mostrar",
      marcas.mostrar !== false
    );

    definirValor(
      "pagina-marcas-eyebrow",
      marcas.eyebrow || "Parcerias"
    );

    definirValor(
      "pagina-marcas-titulo",
      marcas.titulo || ""
    );

    definirValor(
      "pagina-marcas-descricao",
      marcas.descricao || ""
    );

    /* SOBRE */

    definirMarcado(
      "pagina-sobre-mostrar",
      sobre.mostrar !== false
    );

    definirValor(
      "pagina-sobre-eyebrow",
      sobre.eyebrow || "Sobre mim"
    );

    definirValor(
      "pagina-sobre-titulo",
      sobre.titulo || "Quem cria esse conteúdo"
    );

    definirValor(
      "pagina-sobre-foto",
      sobre.foto || ""
    );

    definirValor(
      "pagina-sobre-texto",
      arrayParaTexto(sobre.texto)
    );

    /* RESULTADOS */

    definirMarcado(
      "pagina-resultados-mostrar",
      resultados.mostrar === true
    );

    definirValor(
      "pagina-resultados-eyebrow",
      resultados.eyebrow || "Resultados"
    );

    definirValor(
      "pagina-resultados-titulo",
      resultados.titulo || ""
    );

    definirValor(
      "pagina-resultados-descricao",
      resultados.descricao || ""
    );

    /* CONTACTO */

    definirValor(
      "pagina-contato-eyebrow",
      contato.eyebrow || "Contato"
    );

    definirValor(
      "pagina-contato-titulo",
      contato.titulo || ""
    );

    definirValor(
      "pagina-email",
      contato.email || ""
    );

    definirValor(
      "pagina-whatsapp",
      contato.whatsapp || ""
    );

    definirValor(
      "pagina-whatsapp-mensagem",
      contato.whatsappMensagemPadrao || ""
    );

    definirValor(
      "pagina-instagram",
      contato.instagram || ""
    );

    definirValor(
      "pagina-tiktok",
      contato.tiktok || ""
    );

    definirValor(
      "pagina-youtube",
      contato.youtube || ""
    );

    /* CTA */

    definirValor(
      "pagina-cta-eyebrow",
      cta.eyebrow || "Vamos conversar"
    );

    definirValor(
      "pagina-cta-titulo",
      cta.titulo || ""
    );

    definirValor(
      "pagina-cta-texto",
      cta.texto || ""
    );

    definirValor(
      "pagina-cta-botao",
      cta.botaoPrincipal || "Falar no WhatsApp"
    );

    /* RODAPÉ */

    definirValor(
      "pagina-footer-titulo",
      rodape.titulo || "UGC Creator"
    );

    definirMarcado(
      "pagina-footer-admin",
      rodape.mostrarAdmin !== false
    );

    /* APARÊNCIA */

    definirValor(
      "pagina-cor-fundo",
      aparencia.fundo || "#f7f5f0"
    );

    definirValor(
      "pagina-cor-fundo-elevado",
      aparencia.fundoElevado || "#ffffff"
    );

    definirValor(
      "pagina-cor-texto",
      aparencia.texto || "#1c1b18"
    );

    definirValor(
      "pagina-cor-texto-secundario",
      aparencia.textoSecundario || "#625f58"
    );

    definirValor(
      "pagina-cor-destaque",
      aparencia.destaque || "#1c1b18"
    );

    definirValor(
      "pagina-cor-texto-destaque",
      aparencia.textoDestaque || "#ffffff"
    );

    definirValor(
      "pagina-fonte-titulos",
      aparencia.fonteTitulos || "Fraunces"
    );

    definirValor(
      "pagina-fonte-corpo",
      aparencia.fonteCorpo || "Inter"
    );

    definirValor(
      "pagina-header-foto-url",
      header.foto || ""
    );

    atualizarPreviewFotoCabecalho(
      header.foto || ""
    );

    definirValor(
      "pagina-textura-fundo",
      aparencia.texturaFundo || "nenhuma"
    );

    definirValor(
      "pagina-raio",
      aparencia.raioMedio || 18
    );

    atualizarPreviewAparencia();
  }

  /* ========================================================================
     CONSTRUIR DADOS A PARTIR DO FORMULÁRIO
  ======================================================================== */

  function montarDadosDoEditor() {
    var dados = clonar(
      conteudoAtual || dadosPadraoPagina()
    );

    if (!dados.identidade) dados.identidade = {};
    if (!dados.hero) dados.hero = {};
    if (!dados.videosSecao) dados.videosSecao = {};
    if (!dados.galeria) dados.galeria = {};
    if (!dados.servicos) dados.servicos = {};
    if (!dados.processo) dados.processo = {};
    if (!dados.marcas) dados.marcas = {};
    if (!dados.sobre) dados.sobre = {};
    if (!dados.resultados) dados.resultados = {};
    if (!dados.contato) dados.contato = {};
    if (!dados.cta) dados.cta = {};
    if (!dados.rodape) dados.rodape = {};
    if (!dados.aparencia) dados.aparencia = {};
    if (!dados.header) dados.header = {};

    /* IDENTIDADE */

    dados.identidade.nome =
      valor("pagina-nome").trim();

    dados.identidade.nomeCurto =
      valor("pagina-nome-curto").trim();

    dados.identidade.titulo =
      valor("pagina-titulo").trim();

    dados.identidade.fraseDeImpacto =
      valor("pagina-frase").trim();

    dados.identidade.descricaoCurta =
      valor("pagina-descricao").trim();

    /*
      Mantemos os campos antigos também.
      Isso ajuda na compatibilidade com versões anteriores.
    */

    dados.nome =
      dados.identidade.nome;

    dados.nomeCurto =
      dados.identidade.nomeCurto;

    dados.titulo =
      dados.identidade.titulo;

    dados.fraseDeImpacto =
      dados.identidade.fraseDeImpacto;

    dados.descricaoCurta =
      dados.identidade.descricaoCurta;

    dados.header.foto =
      valor("pagina-header-foto-url").trim();

    /* HERO */

    dados.hero.eyebrow =
      valor("pagina-hero-eyebrow").trim();

    dados.hero.titulo =
      dados.identidade.nome;

    dados.hero.frase =
      dados.identidade.fraseDeImpacto;

    dados.hero.botaoTexto =
      valor("pagina-hero-botao").trim();

    dados.hero.botaoDestino =
      valor("pagina-hero-destino").trim();

    dados.hero.foto =
      valor("pagina-foto").trim();

    dados.hero.mostrarBotao = true;

    /* VÍDEOS */

    dados.videosSecao.mostrar =
      marcado("pagina-videos-mostrar");

    dados.videosSecao.eyebrow =
      valor("pagina-videos-eyebrow").trim();

    dados.videosSecao.titulo =
      valor("pagina-videos-titulo").trim();

    dados.videosSecao.descricao =
      valor("pagina-videos-descricao").trim();

    /* GALERIA */

    dados.galeria.mostrar =
      marcado("pagina-galeria-mostrar");

    dados.galeria.eyebrow =
      valor("pagina-galeria-eyebrow").trim();

    dados.galeria.titulo =
      valor("pagina-galeria-titulo").trim();

    dados.galeria.descricao =
      valor("pagina-galeria-descricao").trim();

    /* SERVIÇOS */

    dados.servicos.mostrar =
      marcado("pagina-servicos-mostrar");

    dados.servicos.eyebrow =
      valor("pagina-servicos-eyebrow").trim();

    dados.servicos.titulo =
      valor("pagina-servicos-titulo").trim();

    dados.servicos.descricao =
      valor("pagina-servicos-descricao").trim();

    /* PROCESSO */

    dados.processo.mostrar =
      marcado("pagina-processo-mostrar");

    dados.processo.eyebrow =
      valor("pagina-processo-eyebrow").trim();

    dados.processo.titulo =
      valor("pagina-processo-titulo").trim();

    dados.processo.descricao =
      valor("pagina-processo-descricao").trim();

    /* MARCAS */

    dados.marcas.mostrar =
      marcado("pagina-marcas-mostrar");

    dados.marcas.eyebrow =
      valor("pagina-marcas-eyebrow").trim();

    dados.marcas.titulo =
      valor("pagina-marcas-titulo").trim();

    dados.marcas.descricao =
      valor("pagina-marcas-descricao").trim();

    /* SOBRE */

    dados.sobre.mostrar =
      marcado("pagina-sobre-mostrar");

    dados.sobre.eyebrow =
      valor("pagina-sobre-eyebrow").trim();

    dados.sobre.titulo =
      valor("pagina-sobre-titulo").trim();

    dados.sobre.foto =
      valor("pagina-sobre-foto").trim() ||
      valor("pagina-foto").trim();

    dados.sobre.texto =
      textoParaArray(
        valor("pagina-sobre-texto")
      );

    /* RESULTADOS */

    dados.resultados.mostrar =
      marcado("pagina-resultados-mostrar");

    dados.resultados.eyebrow =
      valor("pagina-resultados-eyebrow").trim();

    dados.resultados.titulo =
      valor("pagina-resultados-titulo").trim();

    dados.resultados.descricao =
      valor("pagina-resultados-descricao").trim();

    /* CONTACTO */

    dados.contato.eyebrow =
      valor("pagina-contato-eyebrow").trim();

    dados.contato.titulo =
      valor("pagina-contato-titulo").trim();

    dados.contato.email =
      valor("pagina-email").trim();

    dados.contato.whatsapp =
      valor("pagina-whatsapp")
        .replace(/\D/g, "");

    dados.contato.whatsappMensagemPadrao =
      valor("pagina-whatsapp-mensagem").trim();

    dados.contato.instagram =
      valor("pagina-instagram").trim();

    dados.contato.tiktok =
      valor("pagina-tiktok").trim();

    dados.contato.youtube =
      valor("pagina-youtube").trim();

    /* CTA */

    dados.cta.eyebrow =
      valor("pagina-cta-eyebrow").trim();

    dados.cta.titulo =
      valor("pagina-cta-titulo").trim();

    dados.cta.texto =
      valor("pagina-cta-texto").trim();

    dados.cta.botaoPrincipal =
      valor("pagina-cta-botao").trim();

    /* RODAPÉ */

    dados.rodape.titulo =
      valor("pagina-footer-titulo").trim();

    dados.rodape.mostrarAdmin =
      marcado("pagina-footer-admin");

    /* APARÊNCIA */

    dados.aparencia.fundo =
      valor("pagina-cor-fundo");

    dados.aparencia.fundoElevado =
      valor("pagina-cor-fundo-elevado");

    dados.aparencia.texto =
      valor("pagina-cor-texto");

    dados.aparencia.textoSecundario =
      valor("pagina-cor-texto-secundario");

    dados.aparencia.destaque =
      valor("pagina-cor-destaque");

    dados.aparencia.textoDestaque =
      valor("pagina-cor-texto-destaque");

    dados.aparencia.fonteTitulos =
      valor("pagina-fonte-titulos");

    dados.aparencia.fonteCorpo =
      valor("pagina-fonte-corpo");

    dados.aparencia.texturaFundo =
      valor("pagina-textura-fundo") || "nenhuma";

    var raio = parseInt(
      valor("pagina-raio"),
      10
    );

    if (!isNaN(raio)) {
      dados.aparencia.raioPequeno =
        Math.max(0, Math.round(raio * 0.45));

      dados.aparencia.raioMedio =
        raio;

      dados.aparencia.raioGrande =
        Math.min(60, Math.round(raio * 1.55));

      dados.aparencia.raioPill =
        999;
    }

    return dados;
  }

  /* ========================================================================
     SALVAR PÁGINA
  ======================================================================== */

  function atualizarPreviewFotoCabecalho(url) {
    var imagem = $("#pagina-header-foto-preview");
    var placeholder = $("#pagina-header-foto-placeholder");
    var botaoRemover = $("#btn-remover-header-foto");
    var botaoEscolher = $("#btn-header-foto");

    if (imagem) {
      imagem.hidden = !url;

      if (url) {
        imagem.src = url;
      } else {
        imagem.removeAttribute("src");
      }
    }

    if (placeholder) placeholder.hidden = !!url;
    if (botaoRemover) botaoRemover.disabled = !url;
    if (botaoEscolher && !botaoEscolher.disabled) {
      botaoEscolher.textContent = url ? "Trocar foto" : "Escolher foto";
    }
  }

  function wireFotoCabecalho() {
    var botao = $("#btn-header-foto");
    var remover = $("#btn-remover-header-foto");
    var arquivo = $("#pagina-header-foto-arquivo");
    var campoUrl = $("#pagina-header-foto-url");
    var status = $("#pagina-header-foto-status");

    if (!botao || !arquivo || !campoUrl) return;

    botao.addEventListener("click", function () {
      arquivo.click();
    });

    arquivo.addEventListener("change", function () {
      var file = arquivo.files && arquivo.files[0];

      if (!file) return;

      if (!file.type || file.type.indexOf("image/") !== 0) {
        mostrarToast("Escolha um arquivo de imagem.", true);
        arquivo.value = "";
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        mostrarToast("A imagem deve ter no máximo 8 MB.", true);
        arquivo.value = "";
        return;
      }

      var caminho = gerarNomeArquivo(portfolioId() + "/perfil", file);

      botao.disabled = true;
      botao.textContent = "Enviando...";
      if (status) status.textContent = "Enviando a foto...";

      sb.storage
        .from(BUCKET)
        .upload(caminho, file, {
          cacheControl: "3600",
          upsert: false
        })
        .then(function (resposta) {
          if (resposta.error) throw resposta.error;

          var url = obterUrlPublica(caminho);

          if (!url) throw new Error("Não foi possível obter a URL da foto.");

          campoUrl.value = url;
          atualizarPreviewFotoCabecalho(url);
          botao.textContent = "Trocar foto";
          if (status) status.textContent = "Foto pronta. Clique em Salvar alterações para publicar.";
          mostrarToast("Foto enviada. Salve as alterações para publicar.");
        })
        .catch(function (erro) {
          botao.textContent = campoUrl.value ? "Trocar foto" : "Escolher foto";
          if (status) status.textContent = "Não foi possível enviar a foto.";
          mostrarToast(
            "Erro ao enviar a foto: " +
              (erro && erro.message ? erro.message : erro),
            true
          );
          console.error(erro);
        })
        .finally(function () {
          botao.disabled = false;
          arquivo.value = "";
        });
    });

    if (remover) {
      remover.addEventListener("click", function () {
        campoUrl.value = "";
        atualizarPreviewFotoCabecalho("");
        botao.textContent = "Escolher foto";
        if (status) status.textContent = "Foto removida. Clique em Salvar alterações para publicar.";
      });
    }
  }

  function wireUploadsFotosPagina() {
    $all("[data-upload-foto]").forEach(function (botao) {
      var campo = $("#" + botao.dataset.uploadFoto);
      var arquivo = $("#" + botao.dataset.inputArquivo);

      if (!campo || !arquivo) return;

      botao.addEventListener("click", function () {
        arquivo.click();
      });

      arquivo.addEventListener("change", function () {
        var file = arquivo.files && arquivo.files[0];
        if (!file) return;

        if (!file.type || file.type.indexOf("image/") !== 0) {
          mostrarToast("Escolha um arquivo de imagem.", true);
          arquivo.value = "";
          return;
        }

        if (file.size > 8 * 1024 * 1024) {
          mostrarToast("A imagem deve ter no máximo 8 MB.", true);
          arquivo.value = "";
          return;
        }

        var textoOriginal = botao.textContent;
        var caminho = gerarNomeArquivo(portfolioId() + "/perfil", file);
        botao.disabled = true;
        botao.textContent = "Enviando...";

        sb.storage.from(BUCKET).upload(caminho, file, {
          cacheControl: "3600",
          upsert: false
        }).then(function (resposta) {
          if (resposta.error) throw resposta.error;
          var url = obterUrlPublica(caminho);
          if (!url) throw new Error("Não foi possível obter a URL da foto.");
          campo.value = url;
          mostrarToast("Foto enviada. Clique em Salvar alterações.");
        }).catch(function (erro) {
          mostrarToast("Erro ao enviar a foto: " + (erro.message || erro), true);
        }).finally(function () {
          botao.disabled = false;
          botao.textContent = textoOriginal;
          arquivo.value = "";
        });
      });
    });
  }

  function wireEditorPagina() {
    var form = $("#form-pagina");

    if (!form) return;

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();

      var dados = montarDadosDoEditor();

      var botao =
        form.querySelector(
          'button[type="submit"]'
        );

      if (botao) {
        botao.disabled = true;
        botao.textContent = "Salvando...";
      }

      sb.from("conteudo_site")
        .upsert(
          {
            id: conteudoRowId || portfolioId(),
            owner_id: portfolioId(),
            dados: dados,
            atualizado_em:
              new Date().toISOString()
          },
          {
            onConflict: "id"
          }
        )
        .then(function (resposta) {
          if (resposta.error) {
            throw resposta.error;
          }

          conteudoAtual = dados;

          /*
            Recarrega o iframe com cache-busting.
            Assim o site público busca imediatamente
            os dados novos do Supabase.
          */

          var preview = $("#preview-site");

          if (preview) {
            preview.src =
              urlPortfolioPublico() + "&atualizado=" +
              Date.now();
          }

          mostrarToast(
            "Alterações salvas com sucesso!"
          );
        })
        .catch(function (erro) {
          var mensagemErro =
            erro && erro.code === "PGRST205"
              ? "Falta criar a tabela conteudo_site no Supabase. As cores ainda não podem ser guardadas."
              : "Erro ao salvar: " +
                (erro && erro.message
                  ? erro.message
                  : erro);

          mostrarToast(mensagemErro, true);

          console.error(erro);
        })
        .finally(function () {
          if (botao) {
            botao.disabled = false;
            botao.textContent =
              "Salvar alterações";
          }
        });
    });
  }

  /* ========================================================================
     PALETAS DE APARÊNCIA
  ======================================================================== */

  function wireAparencia() {
    var temas = {
      bege: {
        fundo: "#f8f1e7",
        fundoElevado: "#eee1d1",
        texto: "#2f211c",
        textoSecundario: "#78685f",
        destaque: "#bd8b64",
        textoDestaque: "#ffffff",
        raio: 28
      },
      rose: {
        fundo: "#fff5f5",
        fundoElevado: "#f5e3e5",
        texto: "#3a2529",
        textoSecundario: "#80666b",
        destaque: "#c9828d",
        textoDestaque: "#ffffff",
        raio: 26
      },
      oliva: {
        fundo: "#f3f1e8",
        fundoElevado: "#e5e4d5",
        texto: "#273126",
        textoSecundario: "#687065",
        destaque: "#87906b",
        textoDestaque: "#ffffff",
        raio: 22
      },
      minimal: {
        fundo: "#f7f5f0",
        fundoElevado: "#ffffff",
        texto: "#1c1b18",
        textoSecundario: "#625f58",
        destaque: "#1c1b18",
        textoDestaque: "#ffffff",
        raio: 18
      },
      lavanda: {
        fundo: "#f5f0ff", fundoElevado: "#e9ddfa", texto: "#2f2145",
        textoSecundario: "#756687", destaque: "#8d6cc7", textoDestaque: "#ffffff", raio: 28
      },
      ceu: {
        fundo: "#eef7ff", fundoElevado: "#dceeff", texto: "#17324d",
        textoSecundario: "#5f7488", destaque: "#4d91c6", textoDestaque: "#ffffff", raio: 22
      },
      solar: {
        fundo: "#fff8dc", fundoElevado: "#ffedab", texto: "#392b18",
        textoSecundario: "#77694d", destaque: "#e5a921", textoDestaque: "#241a0c", raio: 18
      },
      menta: {
        fundo: "#edfff8", fundoElevado: "#d7f5e9", texto: "#173b31",
        textoSecundario: "#5c766e", destaque: "#3aa982", textoDestaque: "#ffffff", raio: 26
      },
      terracota: {
        fundo: "#fff1e9", fundoElevado: "#f4d8c9", texto: "#48271f",
        textoSecundario: "#86665d", destaque: "#c86645", textoDestaque: "#ffffff", raio: 20
      },
      oceano: {
        fundo: "#0e2635", fundoElevado: "#18394a", texto: "#f2fbff",
        textoSecundario: "#a8c0ca", destaque: "#3dd4d0", textoDestaque: "#082129", raio: 24
      },
      noite: {
        fundo: "#15131d", fundoElevado: "#24202f", texto: "#f8f4ff",
        textoSecundario: "#bbb2c9", destaque: "#b892ff", textoDestaque: "#1a1029", raio: 28
      },
      cafe: {
        fundo: "#241914", fundoElevado: "#38271f", texto: "#fff7ef",
        textoSecundario: "#cfb9a8", destaque: "#d89964", textoDestaque: "#2b180f", raio: 18
      }
    };

    var camposTema = {
      fundo: "pagina-cor-fundo",
      fundoElevado: "pagina-cor-fundo-elevado",
      texto: "pagina-cor-texto",
      textoSecundario: "pagina-cor-texto-secundario",
      destaque: "pagina-cor-destaque",
      textoDestaque: "pagina-cor-texto-destaque",
      raio: "pagina-raio"
    };

    var temasEl = $("#admin-temas");

    if (temasEl) {
      temasEl.addEventListener("click", function (evento) {
        var botao = evento.target.closest("[data-tema]");

        if (!botao || !temas[botao.dataset.tema]) return;

        var tema = temas[botao.dataset.tema];

        Object.keys(camposTema).forEach(function (chave) {
          definirValor(camposTema[chave], tema[chave]);
        });

        marcarEscolha(temasEl, botao);
        atualizarEscolhaCor();
        atualizarEscolhaRaio();
        atualizarPreviewAparencia();
        mostrarToast("Tema aplicado. Toque em Salvar alterações.");
      });
    }

    var coresEl = $("#admin-cores-letra");

    if (coresEl) {
      coresEl.addEventListener("click", function (evento) {
        var botao = evento.target.closest("[data-cor]");

        if (!botao) return;

        definirValor("pagina-cor-texto", botao.dataset.cor);
        marcarEscolha(coresEl, botao);
        atualizarPreviewAparencia();
      });
    }

    var raiosEl = $("#admin-raios");
    var texturasEl = $("#admin-texturas");

    if (texturasEl) {
      texturasEl.addEventListener("click", function (evento) {
        var botao = evento.target.closest("[data-textura]");
        if (!botao) return;
        definirValor("pagina-textura-fundo", botao.dataset.textura);
        marcarEscolha(texturasEl, botao);
        atualizarPreviewAparencia();
      });
    }

    if (raiosEl) {
      raiosEl.addEventListener("click", function (evento) {
        var botao = evento.target.closest("[data-raio]");

        if (!botao) return;

        definirValor("pagina-raio", botao.dataset.raio);
        marcarEscolha(raiosEl, botao);
        atualizarPreviewAparencia();
      });
    }

    var campoCor = $("#pagina-cor-texto");
    var campoRaio = $("#pagina-raio");

    if (campoCor) campoCor.addEventListener("input", function () {
      atualizarEscolhaCor();
      atualizarPreviewAparencia();
    });

    if (campoRaio) campoRaio.addEventListener("input", function () {
      atualizarEscolhaRaio();
      atualizarPreviewAparencia();
    });

    $all(
      '#pagina-cor-fundo, #pagina-cor-fundo-elevado, #pagina-cor-texto-secundario, #pagina-cor-destaque, #pagina-cor-texto-destaque, #pagina-fonte-titulos, #pagina-fonte-corpo'
    ).forEach(function (campo) {
      campo.addEventListener("input", atualizarPreviewAparencia);
      campo.addEventListener("change", atualizarPreviewAparencia);
    });

    var preview = $("#preview-site");
    if (preview) preview.addEventListener("load", atualizarPreviewAparencia);

    function atualizarEscolhaCor() {
      var atual = valor("pagina-cor-texto").toLowerCase();
      $all("[data-cor]", coresEl).forEach(function (botao) {
        botao.classList.toggle("is-selected", botao.dataset.cor === atual);
      });
    }

    function atualizarEscolhaRaio() {
      var atual = valor("pagina-raio");
      $all("[data-raio]", raiosEl).forEach(function (botao) {
        botao.classList.toggle("is-selected", botao.dataset.raio === atual);
      });
    }

    atualizarEscolhaCor();
    atualizarEscolhaRaio();
    if (texturasEl) {
      var texturaAtual = valor("pagina-textura-fundo") || "nenhuma";
      $all("[data-textura]", texturasEl).forEach(function (botao) {
        botao.classList.toggle("is-selected", botao.dataset.textura === texturaAtual);
      });
    }
  }

  function marcarEscolha(container, escolhido) {
    $all("button", container).forEach(function (botao) {
      botao.classList.toggle("is-selected", botao === escolhido);
    });
  }

  function atualizarPreviewAparencia() {
    var preview = $("#preview-site");

    if (!preview || !preview.contentDocument) return;

    var raiz = preview.contentDocument.documentElement;
    if (!raiz) return;

    if (preview.contentDocument.body) {
      preview.contentDocument.body.dataset.textura =
        valor("pagina-textura-fundo") || "nenhuma";
    }

    var raio = parseInt(valor("pagina-raio"), 10);

    raiz.style.setProperty("--bg", valor("pagina-cor-fundo"));
    raiz.style.setProperty("--bg-elevated", valor("pagina-cor-fundo-elevado"));
    raiz.style.setProperty("--text", valor("pagina-cor-texto"));
    raiz.style.setProperty("--text-muted", valor("pagina-cor-texto-secundario"));
    raiz.style.setProperty("--accent", valor("pagina-cor-destaque"));
    raiz.style.setProperty("--on-accent", valor("pagina-cor-texto-destaque"));

    raiz.style.setProperty(
      "--font-display",
      '"' + valor("pagina-fonte-titulos") + '", Georgia, serif'
    );

    raiz.style.setProperty(
      "--font-body",
      '"' + valor("pagina-fonte-corpo") + '", Arial, sans-serif'
    );

    if (!isNaN(raio)) {
      raiz.style.setProperty("--radius-sm", Math.round(raio * 0.45) + "px");
      raiz.style.setProperty("--radius-md", raio + "px");
      raiz.style.setProperty("--radius-lg", Math.min(60, Math.round(raio * 1.55)) + "px");
    }
  }

  /* ========================================================================
     MÍDIAS
  ======================================================================== */

  function carregarMidias() {
    sb.from("midias")
      .select("*")
      .eq("owner_id", portfolioId())
      .order("ordem", {
        ascending: true
      })
      .then(function (resposta) {
        if (resposta.error) {
          mostrarToast(
            "Erro ao carregar mídias: " +
              resposta.error.message,
            true
          );
          return;
        }

        var linhas =
          resposta.data || [];

        cache.videos =
          linhas.filter(function (m) {
            return m.tipo === "video";
          });

        cache.fotos =
          linhas.filter(function (m) {
            return m.tipo === "foto";
          });

        renderLista(
          "videos",
          cache.videos
        );

        renderLista(
          "fotos",
          cache.fotos
        );
      })
      .catch(function (erro) {
        mostrarToast(
          "Erro ao carregar mídias.",
          true
        );

        console.error(erro);
      });
  }

  function renderLista(tipo, itens) {
    var container =
      $("#lista-" + tipo);

    var vazio =
      $("#vazio-" + tipo);

    if (!container) return;

    container.innerHTML = "";

    if (!itens.length) {
      if (vazio) {
        vazio.hidden = false;
      }
      return;
    }

    if (vazio) {
      vazio.hidden = true;
    }

    itens.forEach(function (
      item,
      indice
    ) {
      container.appendChild(
        criarCard(
          item,
          indice,
          itens.length
        )
      );
    });
  }

  function criarCard(
    item,
    indice,
    total
  ) {
    var modelo =
      $("#template-card-midia");

    var no =
      modelo.content.cloneNode(true);

    var card =
      no.querySelector(
        ".admin-card"
      );

    card.dataset.id =
      item.id;

    var thumb =
      no.querySelector(
        ".admin-card-thumb"
      );

    var iconePlay =
      no.querySelector(
        ".admin-card-play"
      );

    thumb.src =
      item.thumbnail_url ||
      item.arquivo_url ||
      "";

    thumb.alt =
      item.titulo || "";

    iconePlay.hidden =
      item.tipo !== "video";

    /* TÍTULO */

    var inputTitulo =
      no.querySelector(
        ".admin-input-titulo"
      );

    inputTitulo.value =
      item.titulo || "";

    inputTitulo.addEventListener(
      "change",
      function () {
        atualizarCampo(
          item,
          "titulo",
          inputTitulo.value.trim()
        );
      }
    );

    /* CATEGORIA */

    var selectCategoria =
      no.querySelector(
        ".admin-select-categoria"
      );

    var listaCategorias =
      item.tipo === "video"
        ? cfg.categoriasVideo
        : cfg.categoriasFoto;

    (listaCategorias || [])
      .filter(function (c) {
        return c.chave !== "todos";
      })
      .forEach(function (c) {
        var opcao =
          document.createElement(
            "option"
          );

        opcao.value =
          c.chave;

        opcao.textContent =
          c.rotulo;

        if (
          c.chave ===
          item.categoria
        ) {
          opcao.selected =
            true;
        }

        selectCategoria.appendChild(
          opcao
        );
      });

    selectCategoria.addEventListener(
      "change",
      function () {
        atualizarCampo(
          item,
          "categoria",
          selectCategoria.value
        );
      }
    );

    /* DESTAQUE */

    var checkDestaque =
      no.querySelector(
        ".admin-checkbox-destaque"
      );

    checkDestaque.checked =
      !!item.destaque;

    checkDestaque.addEventListener(
      "change",
      function () {
        atualizarCampo(
          item,
          "destaque",
          checkDestaque.checked
        );
      }
    );

    /* ORDEM */

    var btnSubir =
      no.querySelector(
        ".admin-btn-subir"
      );

    var btnDescer =
      no.querySelector(
        ".admin-btn-descer"
      );

    btnSubir.disabled =
      indice === 0;

    btnDescer.disabled =
      indice === total - 1;

    btnSubir.addEventListener(
      "click",
      function () {
        moverItem(
          item.tipo,
          indice,
          -1
        );
      }
    );

    btnDescer.addEventListener(
      "click",
      function () {
        moverItem(
          item.tipo,
          indice,
          1
        );
      }
    );

    /* SUBSTITUIR */

    var btnSubstituir =
      no.querySelector(
        ".admin-btn-substituir"
      );

    btnSubstituir.addEventListener(
      "click",
      function () {
        abrirSeletorSubstituicao(
          item
        );
      }
    );

    /* EXCLUIR */

    var btnExcluir =
      no.querySelector(
        ".admin-btn-excluir"
      );

    btnExcluir.addEventListener(
      "click",
      function () {
        excluirMidia(item);
      }
    );

    return no;
  }

  /* ========================================================================
     ATUALIZAR CAMPO DE MÍDIA
  ======================================================================== */

  function atualizarCampo(
    item,
    campo,
    valorCampo
  ) {
    var mudanca = {};

    mudanca[campo] =
      valorCampo;

    sb.from("midias")
      .update(mudanca)
      .eq("id", item.id)
      .then(function (resposta) {
        if (resposta.error) {
          mostrarToast(
            "Erro ao salvar: " +
              resposta.error.message,
            true
          );
          return;
        }

        item[campo] =
          valorCampo;

        mostrarToast(
          "Salvo!"
        );
      })
      .catch(function (erro) {
        mostrarToast(
          "Não foi possível salvar.",
          true
        );

        console.error(erro);
      });
  }

  /* ========================================================================
     REORDENAR
  ======================================================================== */

  function moverItem(
    tipo,
    indice,
    direcao
  ) {
    var lista =
      tipo === "video"
        ? cache.videos
        : cache.fotos;

    var alvo =
      indice + direcao;

    if (
      alvo < 0 ||
      alvo >= lista.length
    ) {
      return;
    }

    var itemA =
      lista[indice];

    var itemB =
      lista[alvo];

    var ordemA =
      itemA.ordem;

    var ordemB =
      itemB.ordem;

    Promise.all([
      sb.from("midias")
        .update({
          ordem: ordemB
        })
        .eq("id", itemA.id),

      sb.from("midias")
        .update({
          ordem: ordemA
        })
        .eq("id", itemB.id)
    ])
      .then(function (resultados) {
        var erro =
          resultados.filter(
            function (r) {
              return r.error;
            }
          )[0];

        if (erro) {
          mostrarToast(
            "Erro ao reordenar: " +
              erro.error.message,
            true
          );
          return;
        }

        itemA.ordem =
          ordemB;

        itemB.ordem =
          ordemA;

        lista.sort(
          function (a, b) {
            return (
              a.ordem -
              b.ordem
            );
          }
        );

        renderLista(
          tipo === "video"
            ? "videos"
            : "fotos",
          lista
        );

        mostrarToast(
          "Ordem atualizada!"
        );
      })
      .catch(function (erro) {
        mostrarToast(
          "Erro ao reordenar.",
          true
        );

        console.error(erro);
      });
  }

  /* ========================================================================
     STORAGE
  ======================================================================== */

  function extensaoDoArquivo(
    file
  ) {
    var partes =
      (file.name || "")
        .split(".");

    if (partes.length > 1) {
      return (
        partes
          .pop()
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            ""
          ) || "bin"
      );
    }

    if (
      file.type &&
      file.type.indexOf("/") > -1
    ) {
      return file.type.split(
        "/"
      )[1];
    }

    return "bin";
  }

  function gerarNomeArquivo(
    pasta,
    file
  ) {
    var id =
      window.crypto &&
      window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : String(Date.now()) +
          "-" +
          Math.random()
            .toString(16)
            .slice(2);

    return (
      pasta +
      "/" +
      id +
      "." +
      extensaoDoArquivo(file)
    );
  }

  function extrairCaminhoStorage(
    url
  ) {
    if (!url) return null;

    var marcador =
      "/storage/v1/object/public/" +
      BUCKET +
      "/";

    var indice =
      url.indexOf(
        marcador
      );

    if (indice === -1) {
      return null;
    }

    return url.substring(
      indice +
        marcador.length
    );
  }

  function obterUrlPublica(
    caminho
  ) {
    var resposta =
      sb.storage
        .from(BUCKET)
        .getPublicUrl(caminho);

    return resposta &&
      resposta.data
      ? resposta.data.publicUrl
      : "";
  }

  /* ========================================================================
     ADICIONAR MÍDIA
  ======================================================================== */

  function wireAdicionar() {
    var btnAddVideo =
      $("#btn-add-video");

    var inputVideo =
      $("#input-video");

    var btnAddFoto =
      $("#btn-add-foto");

    var inputFoto =
      $("#input-foto");

    if (
      btnAddVideo &&
      inputVideo
    ) {
      btnAddVideo.addEventListener(
        "click",
        function () {
          inputVideo.value = "";
          inputVideo.click();
        }
      );

      inputVideo.addEventListener(
        "change",
        function () {
          var file =
            inputVideo.files &&
            inputVideo.files[0];

          if (file) {
            adicionarMidia(
              "video",
              file
            );
          }
        }
      );
    }

    if (
      btnAddFoto &&
      inputFoto
    ) {
      btnAddFoto.addEventListener(
        "click",
        function () {
          inputFoto.value = "";
          inputFoto.click();
        }
      );

      inputFoto.addEventListener(
        "change",
        function () {
          var file =
            inputFoto.files &&
            inputFoto.files[0];

          if (file) {
            adicionarMidia(
              "foto",
              file
            );
          }
        }
      );
    }
  }

  function proximaOrdem(
    tipo
  ) {
    var lista =
      tipo === "video"
        ? cache.videos
        : cache.fotos;

    if (!lista.length) {
      return 0;
    }

    return (
      Math.max.apply(
        null,
        lista.map(
          function (i) {
            return (
              i.ordem || 0
            );
          }
        )
      ) + 1
    );
  }

  function categoriaPadrao(
    tipo
  ) {
    var listaCategorias =
      tipo === "video"
        ? cfg.categoriasVideo
        : cfg.categoriasFoto;

    var primeira =
      (listaCategorias || [])
        .filter(function (c) {
          return (
            c.chave !==
            "todos"
          );
        })[0];

    return primeira
      ? primeira.chave
      : "";
  }

  function adicionarMidia(
    tipo,
    file
  ) {
    var statusEl =
      $(
        "#status-upload-" +
          (tipo === "video"
            ? "video"
            : "foto")
      );

    if (statusEl) {
      statusEl.hidden = false;

      statusEl.textContent =
        "Enviando " +
        (tipo === "video"
          ? "vídeo"
          : "foto") +
        "...";
    }

    var pastaArquivo =
      tipo === "video"
        ? "videos"
        : "fotos";

    var caminhoArquivo =
      gerarNomeArquivo(
        portfolioId() + "/" + pastaArquivo,
        file
      );

    var promessaThumb =
      tipo === "video"
        ? gerarThumbnailDeVideo(
            file
          ).catch(
            function () {
              return null;
            }
          )
        : Promise.resolve(
            null
          );

    sb.storage
      .from(BUCKET)
      .upload(
        caminhoArquivo,
        file,
        {
          contentType:
            file.type,
          upsert: false
        }
      )
      .then(
        function (
          respostaUpload
        ) {
          if (
            respostaUpload.error
          ) {
            throw respostaUpload.error;
          }

          var urlArquivo =
            obterUrlPublica(
              caminhoArquivo
            );

          return promessaThumb.then(
            function (
              blobThumb
            ) {
              if (!blobThumb) {
                return {
                  urlArquivo:
                    urlArquivo,
                  urlThumb:
                    tipo === "foto"
                      ? urlArquivo
                      : ""
                };
              }

              var nomeThumb =
                caminhoArquivo
                  .split("/")
                  .pop()
                  .replace(
                    /\.[a-z0-9]+$/i,
                    ""
                  ) +
                ".jpg";

              var caminhoThumb =
                portfolioId() + "/videos/thumbs/" +
                nomeThumb;

              return sb.storage
                .from(BUCKET)
                .upload(
                  caminhoThumb,
                  blobThumb,
                  {
                    contentType:
                      "image/jpeg",
                    upsert: false
                  }
                )
                .then(
                  function (
                    respostaThumb
                  ) {
                    if (
                      respostaThumb.error
                    ) {
                      return {
                        urlArquivo:
                          urlArquivo,
                        urlThumb:
                          ""
                      };
                    }

                    return {
                      urlArquivo:
                        urlArquivo,
                      urlThumb:
                        obterUrlPublica(
                          caminhoThumb
                        )
                    };
                  }
                );
            }
          );
        }
      )
      .then(function (urls) {
        var novoItem = {
          owner_id: portfolioId(),
          tipo: tipo,

          titulo: file.name
            ? file.name.replace(
                /\.[^.]+$/,
                ""
              )
            : "",

          categoria:
            categoriaPadrao(
              tipo
            ),

          arquivo_url:
            urls.urlArquivo,

          thumbnail_url:
            urls.urlThumb ||
            urls.urlArquivo,

          destaque: false,

          ordem:
            proximaOrdem(
              tipo
            )
        };

        return sb
          .from("midias")
          .insert(
            novoItem
          );
      })
      .then(function (
        respostaInsert
      ) {
        if (
          respostaInsert.error
        ) {
          throw respostaInsert.error;
        }

        if (statusEl) {
          statusEl.hidden =
            true;
        }

        mostrarToast(
          tipo === "video"
            ? "Vídeo adicionado!"
            : "Foto adicionada!"
        );

        carregarMidias();
      })
      .catch(function (erro) {
        if (statusEl) {
          statusEl.hidden =
            true;
        }

        mostrarToast(
          "Erro no upload: " +
            (erro &&
            erro.message
              ? erro.message
              : erro),
          true
        );

        console.error(erro);
      });
  }

  /* ========================================================================
     SUBSTITUIR MÍDIA
  ======================================================================== */

  function abrirSeletorSubstituicao(
    item
  ) {
    var input =
      document.createElement(
        "input"
      );

    input.type = "file";

    input.accept =
      item.tipo === "video"
        ? "video/*"
        : "image/*";

    input.addEventListener(
      "change",
      function () {
        var file =
          input.files &&
          input.files[0];

        if (file) {
          substituirMidia(
            item,
            file
          );
        }
      }
    );

    input.click();
  }

  function substituirMidia(
    item,
    file
  ) {
    mostrarToast(
      "Enviando substituição..."
    );

    var pastaArquivo =
      item.tipo === "video"
        ? "videos"
        : "fotos";

    var caminhoArquivo =
      gerarNomeArquivo(
        portfolioId() + "/" + pastaArquivo,
        file
      );

    var caminhoAntigoArquivo =
      extrairCaminhoStorage(
        item.arquivo_url
      );

    var caminhoAntigoThumb =
      extrairCaminhoStorage(
        item.thumbnail_url
      );

    var promessaThumb =
      item.tipo === "video"
        ? gerarThumbnailDeVideo(
            file
          ).catch(
            function () {
              return null;
            }
          )
        : Promise.resolve(
            null
          );

    sb.storage
      .from(BUCKET)
      .upload(
        caminhoArquivo,
        file,
        {
          contentType:
            file.type,
          upsert: false
        }
      )
      .then(
        function (
          respostaUpload
        ) {
          if (
            respostaUpload.error
          ) {
            throw respostaUpload.error;
          }

          var urlArquivo =
            obterUrlPublica(
              caminhoArquivo
            );

          return promessaThumb.then(
            function (
              blobThumb
            ) {
              if (!blobThumb) {
                return {
                  urlArquivo:
                    urlArquivo,

                  urlThumb:
                    item.tipo ===
                    "foto"
                      ? urlArquivo
                      : item.thumbnail_url
                };
              }

              var nomeThumb =
                caminhoArquivo
                  .split("/")
                  .pop()
                  .replace(
                    /\.[a-z0-9]+$/i,
                    ""
                  ) +
                ".jpg";

              var caminhoThumb =
                portfolioId() + "/videos/thumbs/" +
                nomeThumb;

              return sb.storage
                .from(BUCKET)
                .upload(
                  caminhoThumb,
                  blobThumb,
                  {
                    contentType:
                      "image/jpeg",
                    upsert: false
                  }
                )
                .then(
                  function (
                    respostaThumb
                  ) {
                    if (
                      respostaThumb.error
                    ) {
                      return {
                        urlArquivo:
                          urlArquivo,
                        urlThumb:
                          item.thumbnail_url
                      };
                    }

                    return {
                      urlArquivo:
                        urlArquivo,
                      urlThumb:
                        obterUrlPublica(
                          caminhoThumb
                        )
                    };
                  }
                );
            }
          );
        }
      )
      .then(function (urls) {
        return sb
          .from("midias")
          .update({
            arquivo_url:
              urls.urlArquivo,

            thumbnail_url:
              urls.urlThumb
          })
          .eq(
            "id",
            item.id
          );
      })
      .then(function (
        respostaUpdate
      ) {
        if (
          respostaUpdate.error
        ) {
          throw respostaUpdate.error;
        }

        var caminhosParaRemover =
          [];

        if (
          caminhoAntigoArquivo
        ) {
          caminhosParaRemover.push(
            caminhoAntigoArquivo
          );
        }

        if (
          caminhoAntigoThumb &&
          caminhoAntigoThumb !==
            caminhoAntigoArquivo
        ) {
          caminhosParaRemover.push(
            caminhoAntigoThumb
          );
        }

        if (
          caminhosParaRemover.length
        ) {
          sb.storage
            .from(BUCKET)
            .remove(
              caminhosParaRemover
            );
        }

        mostrarToast(
          "Substituído com sucesso!"
        );

        carregarMidias();
      })
      .catch(function (erro) {
        mostrarToast(
          "Erro ao substituir: " +
            (erro &&
            erro.message
              ? erro.message
              : erro),
          true
        );

        console.error(erro);
      });
  }

  /* ========================================================================
     EXCLUIR MÍDIA
  ======================================================================== */

  function excluirMidia(
    item
  ) {
    var confirmado =
      window.confirm(
        "Excluir " +
          (item.tipo === "video"
            ? "este vídeo"
            : "esta foto") +
          "? Essa ação não pode ser desfeita."
      );

    if (!confirmado) {
      return;
    }

    var caminhos = [];

    var caminhoArquivo =
      extrairCaminhoStorage(
        item.arquivo_url
      );

    var caminhoThumb =
      extrairCaminhoStorage(
        item.thumbnail_url
      );

    if (caminhoArquivo) {
      caminhos.push(
        caminhoArquivo
      );
    }

    if (
      caminhoThumb &&
      caminhoThumb !==
        caminhoArquivo
    ) {
      caminhos.push(
        caminhoThumb
      );
    }

    var removerArquivos =
      caminhos.length
        ? sb.storage
            .from(BUCKET)
            .remove(caminhos)
        : Promise.resolve({
            error: null
          });

    removerArquivos
      .then(function () {
        return sb
          .from("midias")
          .delete()
          .eq(
            "id",
            item.id
          );
      })
      .then(function (
        resposta
      ) {
        if (
          resposta.error
        ) {
          throw resposta.error;
        }

        mostrarToast(
          "Excluído!"
        );

        carregarMidias();
      })
      .catch(function (erro) {
        mostrarToast(
          "Erro ao excluir: " +
            (erro &&
            erro.message
              ? erro.message
              : erro),
          true
        );

        console.error(erro);
      });
  }

  /* ========================================================================
     THUMBNAIL DE VÍDEO
  ======================================================================== */

  function gerarThumbnailDeVideo(
    file
  ) {
    return new Promise(
      function (
        resolve,
        reject
      ) {
        var videoEl =
          document.createElement(
            "video"
          );

        videoEl.preload =
          "metadata";

        videoEl.muted = true;
        videoEl.playsInline = true;

        var url =
          URL.createObjectURL(
            file
          );

        videoEl.src = url;

        var finalizado =
          false;

        function limpar() {
          finalizado = true;

          URL.revokeObjectURL(
            url
          );
        }

        videoEl.addEventListener(
          "loadeddata",
          function () {
            var alvo = 0;

            try {
              alvo = Math.min(
                1,
                (videoEl.duration ||
                  1) /
                  2
              );
            } catch (
              _erro
            ) {
              alvo = 0;
            }

            try {
              videoEl.currentTime =
                alvo;
            } catch (
              _erro
            ) {
              capturarFrame();
            }
          }
        );

        videoEl.addEventListener(
          "seeked",
          capturarFrame
        );

        videoEl.addEventListener(
          "error",
          function () {
            if (finalizado) {
              return;
            }

            limpar();

            reject(
              new Error(
                "Não foi possível ler o vídeo"
              )
            );
          }
        );

        window.setTimeout(
          function () {
            if (!finalizado) {
              limpar();

              reject(
                new Error(
                  "Tempo esgotado ao gerar miniatura"
                )
              );
            }
          },
          8000
        );

        function capturarFrame() {
          if (finalizado) {
            return;
          }

          try {
            var canvas =
              document.createElement(
                "canvas"
              );

            canvas.width =
              videoEl.videoWidth ||
              720;

            canvas.height =
              videoEl.videoHeight ||
              1280;

            var ctx =
              canvas.getContext(
                "2d"
              );

            ctx.drawImage(
              videoEl,
              0,
              0,
              canvas.width,
              canvas.height
            );

            canvas.toBlob(
              function (blob) {
                limpar();

                if (blob) {
                  resolve(blob);
                } else {
                  reject(
                    new Error(
                      "Canvas vazio"
                    )
                  );
                }
              },
              "image/jpeg",
              0.8
            );
          } catch (erro) {
            limpar();
            reject(erro);
          }
        }
      }
    );
  }

})();
