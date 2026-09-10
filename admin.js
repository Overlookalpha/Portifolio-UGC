/*
  ============================================================================
  ADMIN.JS — Painel administrativo do portfólio
  ============================================================================  
  Login (Supabase Auth) + CRUD real de fotos/vídeos: upload de arquivo pro
  Supabase Storage, dados na tabela "midias" do Postgres. Tudo que acontece
  aqui é salvo de verdade e aparece no site público na hora.
  ============================================================================
*/

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var sb = null;
  var BUCKET = "midias";

  var cache = { videos: [], fotos: [] };
  var abaAtiva = "pagina";
  var conteudoAtual = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!cfg.supabase || !cfg.supabase.url || !cfg.supabase.anonKey) {
      mostrarToast("Configuracao do Supabase ausente em config.js", true);
      return;
    }

    sb = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);

    wireLogin();
    wireSair();
    wireAbas();
    wireAdicionar();
    wireEditorPagina();

    sb.auth.getSession().then(function (resposta) {
      var sessao = resposta && resposta.data ? resposta.data.session : null;
      if (sessao) {
        entrarNoPainel();
      } else {
        mostrarLogin();
      }
    });

    sb.auth.onAuthStateChange(function (_evento, sessao) {
      if (sessao) {
        entrarNoPainel();
      } else {
        mostrarLogin();
      }
    });
  }

  // ------------------------------------------------------------------
  // Helpers gerais
  // ------------------------------------------------------------------
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $all(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  var toastTimer = null;
  function mostrarToast(mensagem, erro) {
    var toast = $("#admin-toast");
    if (!toast) return;
    toast.textContent = mensagem;
    toast.classList.toggle("is-erro", !!erro);
    toast.hidden = false;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.hidden = true;
    }, 3200);
  }

  function extensaoDoArquivo(file) {
    var partes = (file.name || "").split(".");
    if (partes.length > 1) {
      return partes.pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    }
    if (file.type && file.type.indexOf("/") > -1) {
      return file.type.split("/")[1];
    }
    return "bin";
  }

  function gerarNomeArquivo(prefixoPasta, file) {
    var id =
      window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
    return prefixoPasta + "/" + id + "." + extensaoDoArquivo(file);
  }

  function extrairCaminhoStorage(url) {
    if (!url) return null;
    var marcador = "/storage/v1/object/public/" + BUCKET + "/";
    var indice = url.indexOf(marcador);
    if (indice === -1) return null;
    return url.substring(indice + marcador.length);
  }

  function obterUrlPublica(caminho) {
    var resposta = sb.storage.from(BUCKET).getPublicUrl(caminho);
    return resposta && resposta.data ? resposta.data.publicUrl : "";
  }

  // ------------------------------------------------------------------
  // Login / sessão
  // ------------------------------------------------------------------
  function wireLogin() {
    var form = $("#form-login");
    if (!form) return;
    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var email = $("#login-email").value.trim();
      var senha = $("#login-senha").value;
      var botao = $("#btn-entrar");
      var erroEl = $("#login-erro");
      erroEl.hidden = true;
      botao.disabled = true;
      botao.textContent = "Entrando...";

      sb.auth
        .signInWithPassword({ email: email, password: senha })
        .then(function (resposta) {
          if (resposta.error) {
            erroEl.textContent = "E-mail ou senha incorretos.";
            erroEl.hidden = false;
          }
        })
        .catch(function () {
          erroEl.textContent = "Nao foi possivel entrar. Verifique sua internet.";
          erroEl.hidden = false;
        })
        .finally(function () {
          botao.disabled = false;
          botao.textContent = "Entrar";
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
    $("#tela-login").hidden = false;
    $("#tela-painel").hidden = true;
  }

  function entrarNoPainel() {
    $("#tela-login").hidden = true;
    $("#tela-painel").hidden = false;
    carregarMidias();
    carregarConteudoPagina();
  }

  // ------------------------------------------------------------------
  // Abas Vídeos / Fotos
  // ------------------------------------------------------------------
  function wireAbas() {
    $all(".admin-aba").forEach(function (botao) {
      botao.addEventListener("click", function () {
        abaAtiva = botao.dataset.aba;
        $all(".admin-aba").forEach(function (b) {
          var ativa = b === botao;
          b.classList.toggle("is-ativa", ativa);
          b.setAttribute("aria-selected", ativa ? "true" : "false");
        });
        $all(".admin-secao").forEach(function (secao) {
          secao.hidden = secao.dataset.secao !== abaAtiva;
        });
      });
    });
  }

  // ------------------------------------------------------------------
  // Editor espelho: conteúdo textual persistido no Supabase
  // ------------------------------------------------------------------
  function dadosPadraoPagina() {
    return {
      nome: cfg.nome || "",
      titulo: cfg.titulo || "",
      fraseDeImpacto: cfg.fraseDeImpacto || "",
      foto: (cfg.sobre && cfg.sobre.foto) || "",
      sobre: (cfg.sobre && cfg.sobre.texto || []).join("\n\n"),
      email: (cfg.contato && cfg.contato.email) || "",
      whatsapp: (cfg.contato && cfg.contato.whatsapp) || "",
      instagram: (cfg.contato && cfg.contato.instagram) || "",
      ctaTitulo: (cfg.cta && cfg.cta.titulo) || "",
      ctaTexto: (cfg.cta && cfg.cta.texto) || ""
    };
  }

  function preencherEditorPagina(dados) {
    var mapa = { nome: "pagina-nome", titulo: "pagina-titulo", fraseDeImpacto: "pagina-frase", foto: "pagina-foto", sobre: "pagina-sobre", email: "pagina-email", whatsapp: "pagina-whatsapp", instagram: "pagina-instagram", ctaTitulo: "pagina-cta-titulo", ctaTexto: "pagina-cta-texto" };
    Object.keys(mapa).forEach(function (chave) {
      var campo = $("#" + mapa[chave]);
      if (campo) campo.value = dados[chave] || "";
    });
  }

  function carregarConteudoPagina() {
    sb.from("conteudo_site").select("dados").eq("id", "principal").maybeSingle()
      .then(function (resposta) {
        conteudoAtual = dadosPadraoPagina();
        if (!resposta.error && resposta.data && resposta.data.dados) {
          Object.keys(resposta.data.dados).forEach(function (chave) { conteudoAtual[chave] = resposta.data.dados[chave]; });
        }
        preencherEditorPagina(conteudoAtual);
      });
  }

  function wireEditorPagina() {
    var form = $("#form-pagina");
    if (!form) return;
    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var dados = {
        nome: $("#pagina-nome").value.trim(), titulo: $("#pagina-titulo").value.trim(), fraseDeImpacto: $("#pagina-frase").value.trim(), foto: $("#pagina-foto").value.trim(), sobre: $("#pagina-sobre").value.trim(), email: $("#pagina-email").value.trim(), whatsapp: $("#pagina-whatsapp").value.replace(/\D/g, ""), instagram: $("#pagina-instagram").value.trim(), ctaTitulo: $("#pagina-cta-titulo").value.trim(), ctaTexto: $("#pagina-cta-texto").value.trim()
      };
      var botao = form.querySelector('button[type="submit"]');
      botao.disabled = true;
      sb.from("conteudo_site").upsert({ id: "principal", dados: dados, atualizado_em: new Date().toISOString() })
        .then(function (resposta) {
          botao.disabled = false;
          if (resposta.error) { mostrarToast("Erro ao salvar página: " + resposta.error.message, true); return; }
          conteudoAtual = dados;
          var preview = $("#preview-site");
          if (preview) preview.src = "index.html?atualizado=" + Date.now();
          mostrarToast("Página salva e prévia atualizada!");
        })
        .catch(function () { botao.disabled = false; mostrarToast("Não foi possível salvar a página.", true); });
    });
  }

  // ------------------------------------------------------------------
  // Carregar e renderizar mídias
  // ------------------------------------------------------------------
  function carregarMidias() {
    sb.from("midias")
      .select("*")
      .order("ordem", { ascending: true })
      .then(function (resposta) {
        if (resposta.error) {
          mostrarToast("Erro ao carregar midias: " + resposta.error.message, true);
          return;
        }
        var linhas = resposta.data || [];
        cache.videos = linhas.filter(function (m) {
          return m.tipo === "video";
        });
        cache.fotos = linhas.filter(function (m) {
          return m.tipo === "foto";
        });
        renderLista("videos", cache.videos);
        renderLista("fotos", cache.fotos);
      });
  }

  function renderLista(tipo, itens) {
    var container = $("#lista-" + tipo);
    var vazio = $("#vazio-" + tipo);
    if (!container) return;
    container.innerHTML = "";

    if (!itens.length) {
      vazio.hidden = false;
      return;
    }
    vazio.hidden = true;

    itens.forEach(function (item, indice) {
      container.appendChild(criarCard(item, indice, itens.length));
    });
  }

  function criarCard(item, indice, total) {
    var modelo = $("#template-card-midia");
    var no = modelo.content.cloneNode(true);
    var card = no.querySelector(".admin-card");
    card.dataset.id = item.id;

    var thumb = no.querySelector(".admin-card-thumb");
    var iconePlay = no.querySelector(".admin-card-play");
    thumb.src = item.thumbnail_url || item.arquivo_url || "";
    thumb.alt = item.titulo || "";
    iconePlay.hidden = item.tipo !== "video";

    var inputTitulo = no.querySelector(".admin-input-titulo");
    inputTitulo.value = item.titulo || "";
    inputTitulo.addEventListener("change", function () {
      atualizarCampo(item, "titulo", inputTitulo.value.trim());
    });

    var selectCategoria = no.querySelector(".admin-select-categoria");
    var listaCategorias =
      item.tipo === "video" ? cfg.categoriasVideo : cfg.categoriasFoto;
    (listaCategorias || [])
      .filter(function (c) {
        return c.chave !== "todos";
      })
      .forEach(function (c) {
        var opcao = document.createElement("option");
        opcao.value = c.chave;
        opcao.textContent = c.rotulo;
        if (c.chave === item.categoria) opcao.selected = true;
        selectCategoria.appendChild(opcao);
      });
    selectCategoria.addEventListener("change", function () {
      atualizarCampo(item, "categoria", selectCategoria.value);
    });

    var checkDestaque = no.querySelector(".admin-checkbox-destaque");
    checkDestaque.checked = !!item.destaque;
    checkDestaque.addEventListener("change", function () {
      atualizarCampo(item, "destaque", checkDestaque.checked);
    });

    var btnSubir = no.querySelector(".admin-btn-subir");
    var btnDescer = no.querySelector(".admin-btn-descer");
    btnSubir.disabled = indice === 0;
    btnDescer.disabled = indice === total - 1;
    btnSubir.addEventListener("click", function () {
      moverItem(item.tipo, indice, -1);
    });
    btnDescer.addEventListener("click", function () {
      moverItem(item.tipo, indice, 1);
    });

    var btnSubstituir = no.querySelector(".admin-btn-substituir");
    btnSubstituir.addEventListener("click", function () {
      abrirSeletorSubstituicao(item);
    });

    var btnExcluir = no.querySelector(".admin-btn-excluir");
    btnExcluir.addEventListener("click", function () {
      excluirMidia(item);
    });

    return no;
  }

  // ------------------------------------------------------------------
  // Atualizar campo simples
  // ------------------------------------------------------------------
  function atualizarCampo(item, campo, valor) {
    var mudanca = {};
    mudanca[campo] = valor;
    sb.from("midias")
      .update(mudanca)
      .eq("id", item.id)
      .then(function (resposta) {
        if (resposta.error) {
          mostrarToast("Erro ao salvar: " + resposta.error.message, true);
          return;
        }
        item[campo] = valor;
        mostrarToast("Salvo!");
      });
  }

  // ------------------------------------------------------------------
  // Reordenar (troca "ordem" com o vizinho)
  // ------------------------------------------------------------------
  function moverItem(tipo, indice, direcao) {
    var lista = tipo === "video" ? cache.videos : cache.fotos;
    var alvo = indice + direcao;
    if (alvo < 0 || alvo >= lista.length) return;

    var itemA = lista[indice];
    var itemB = lista[alvo];
    var ordemA = itemA.ordem;
    var ordemB = itemB.ordem;

    Promise.all([
      sb.from("midias").update({ ordem: ordemB }).eq("id", itemA.id),
      sb.from("midias").update({ ordem: ordemA }).eq("id", itemB.id)
    ]).then(function (resultados) {
      var erro = resultados.filter(function (r) {
        return r.error;
      })[0];
      if (erro) {
        mostrarToast("Erro ao reordenar: " + erro.error.message, true);
        return;
      }
      itemA.ordem = ordemB;
      itemB.ordem = ordemA;
      lista.sort(function (a, b) {
        return a.ordem - b.ordem;
      });
      renderLista(tipo === "video" ? "videos" : "fotos", lista);
      mostrarToast("Ordem atualizada!");
    });
  }

  // ------------------------------------------------------------------
  // Excluir
  // ------------------------------------------------------------------
  function excluirMidia(item) {
    var confirmado = window.confirm(
      "Excluir " + (item.tipo === "video" ? "este video" : "esta foto") + "? Essa acao nao pode ser desfeita."
    );
    if (!confirmado) return;

    var caminhos = [];
    var caminhoArquivo = extrairCaminhoStorage(item.arquivo_url);
    var caminhoThumb = extrairCaminhoStorage(item.thumbnail_url);
    if (caminhoArquivo) caminhos.push(caminhoArquivo);
    if (caminhoThumb && caminhoThumb !== caminhoArquivo) caminhos.push(caminhoThumb);

    var removerArquivos = caminhos.length
      ? sb.storage.from(BUCKET).remove(caminhos)
      : Promise.resolve({ error: null });

    removerArquivos
      .then(function () {
        return sb.from("midias").delete().eq("id", item.id);
      })
      .then(function (resposta) {
        if (resposta.error) {
          mostrarToast("Erro ao excluir: " + resposta.error.message, true);
          return;
        }
        mostrarToast("Excluido!");
        carregarMidias();
      });
  }

  // ------------------------------------------------------------------
  // Adicionar (novo) e Substituir (arquivo existente)
  // ------------------------------------------------------------------
  function wireAdicionar() {
    var btnAddVideo = $("#btn-add-video");
    var inputVideo = $("#input-video");
    var btnAddFoto = $("#btn-add-foto");
    var inputFoto = $("#input-foto");

    btnAddVideo.addEventListener("click", function () {
      inputVideo.value = "";
      inputVideo.click();
    });
    btnAddFoto.addEventListener("click", function () {
      inputFoto.value = "";
      inputFoto.click();
    });

    inputVideo.addEventListener("change", function () {
      var file = inputVideo.files && inputVideo.files[0];
      if (file) adicionarMidia("video", file);
    });
    inputFoto.addEventListener("change", function () {
      var file = inputFoto.files && inputFoto.files[0];
      if (file) adicionarMidia("foto", file);
    });
  }

  function proximaOrdem(tipo) {
    var lista = tipo === "video" ? cache.videos : cache.fotos;
    if (!lista.length) return 0;
    return (
      Math.max.apply(
        null,
        lista.map(function (i) {
          return i.ordem || 0;
        })
      ) + 1
    );
  }

  function categoriaPadrao(tipo) {
    var listaCategorias = tipo === "video" ? cfg.categoriasVideo : cfg.categoriasFoto;
    var primeira = (listaCategorias || []).filter(function (c) {
      return c.chave !== "todos";
    })[0];
    return primeira ? primeira.chave : "";
  }

  function adicionarMidia(tipo, file) {
    var statusEl = $("#status-upload-" + (tipo === "video" ? "video" : "foto"));
    statusEl.hidden = false;
    statusEl.textContent = "Enviando " + (tipo === "video" ? "video" : "foto") + "...";

    var pastaArquivo = tipo === "video" ? "videos" : "fotos";
    var caminhoArquivo = gerarNomeArquivo(pastaArquivo, file);

    var promessaThumb =
      tipo === "video"
        ? gerarThumbnailDeVideo(file).catch(function () {
            return null;
          })
        : Promise.resolve(null);

    sb.storage
      .from(BUCKET)
      .upload(caminhoArquivo, file, { contentType: file.type, upsert: false })
      .then(function (respostaUpload) {
        if (respostaUpload.error) throw respostaUpload.error;
        var urlArquivo = obterUrlPublica(caminhoArquivo);

        return promessaThumb.then(function (blobThumb) {
          if (!blobThumb) {
            return { urlArquivo: urlArquivo, urlThumb: tipo === "foto" ? urlArquivo : "" };
          }
          var caminhoThumb = "videos/thumbs/" + caminhoArquivo.split("/").pop().replace(/\.[a-z0-9]+$/i, "") + ".jpg";
          return sb.storage
            .from(BUCKET)
            .upload(caminhoThumb, blobThumb, { contentType: "image/jpeg", upsert: false })
            .then(function (respostaThumb) {
              if (respostaThumb.error) {
                return { urlArquivo: urlArquivo, urlThumb: "" };
              }
              return { urlArquivo: urlArquivo, urlThumb: obterUrlPublica(caminhoThumb) };
            });
        });
      })
      .then(function (urls) {
        var novoItem = {
          tipo: tipo,
          titulo: file.name ? file.name.replace(/\.[^.]+$/, "") : "",
          categoria: categoriaPadrao(tipo),
          arquivo_url: urls.urlArquivo,
          thumbnail_url: urls.urlThumb || urls.urlArquivo,
          destaque: false,
          ordem: proximaOrdem(tipo)
        };
        return sb.from("midias").insert(novoItem);
      })
      .then(function (respostaInsert) {
        if (respostaInsert.error) throw respostaInsert.error;
        statusEl.hidden = true;
        mostrarToast(tipo === "video" ? "Video adicionado!" : "Foto adicionada!");
        carregarMidias();
      })
      .catch(function (erro) {
        statusEl.hidden = true;
        mostrarToast("Erro no upload: " + (erro && erro.message ? erro.message : erro), true);
      });
  }

  function abrirSeletorSubstituicao(item) {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = item.tipo === "video" ? "video/*" : "image/*";
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (file) substituirMidia(item, file);
    });
    input.click();
  }

  function substituirMidia(item, file) {
    mostrarToast("Enviando substituicao...");

    var pastaArquivo = item.tipo === "video" ? "videos" : "fotos";
    var caminhoArquivo = gerarNomeArquivo(pastaArquivo, file);
    var caminhoAntigoArquivo = extrairCaminhoStorage(item.arquivo_url);
    var caminhoAntigoThumb = extrairCaminhoStorage(item.thumbnail_url);

    var promessaThumb =
      item.tipo === "video"
        ? gerarThumbnailDeVideo(file).catch(function () {
            return null;
          })
        : Promise.resolve(null);

    sb.storage
      .from(BUCKET)
      .upload(caminhoArquivo, file, { contentType: file.type, upsert: false })
      .then(function (respostaUpload) {
        if (respostaUpload.error) throw respostaUpload.error;
        var urlArquivo = obterUrlPublica(caminhoArquivo);

        return promessaThumb.then(function (blobThumb) {
          if (!blobThumb) {
            return { urlArquivo: urlArquivo, urlThumb: item.tipo === "foto" ? urlArquivo : item.thumbnail_url };
          }
          var caminhoThumb = "videos/thumbs/" + caminhoArquivo.split("/").pop().replace(/\.[a-z0-9]+$/i, "") + ".jpg";
          return sb.storage
            .from(BUCKET)
            .upload(caminhoThumb, blobThumb, { contentType: "image/jpeg", upsert: false })
            .then(function (respostaThumb) {
              if (respostaThumb.error) {
                return { urlArquivo: urlArquivo, urlThumb: item.thumbnail_url };
              }
              return { urlArquivo: urlArquivo, urlThumb: obterUrlPublica(caminhoThumb) };
            });
        });
      })
      .then(function (urls) {
        return sb
          .from("midias")
          .update({ arquivo_url: urls.urlArquivo, thumbnail_url: urls.urlThumb })
          .eq("id", item.id);
      })
      .then(function (respostaUpdate) {
        if (respostaUpdate.error) throw respostaUpdate.error;

        var caminhosParaRemover = [];
        if (caminhoAntigoArquivo) caminhosParaRemover.push(caminhoAntigoArquivo);
        if (caminhoAntigoThumb && caminhoAntigoThumb !== caminhoAntigoArquivo) {
          caminhosParaRemover.push(caminhoAntigoThumb);
        }
        if (caminhosParaRemover.length) {
          sb.storage.from(BUCKET).remove(caminhosParaRemover);
        }

        mostrarToast("Substituido com sucesso!");
        carregarMidias();
      })
      .catch(function (erro) {
        mostrarToast("Erro ao substituir: " + (erro && erro.message ? erro.message : erro), true);
      });
  }

  // ------------------------------------------------------------------
  // Gerar thumbnail de vídeo (captura um frame em canvas)
  // ------------------------------------------------------------------
  function gerarThumbnailDeVideo(file) {
    return new Promise(function (resolve, reject) {
      var videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      videoEl.muted = true;
      videoEl.playsInline = true;
      var url = URL.createObjectURL(file);
      videoEl.src = url;

      var finalizado = false;
      function limpar() {
        finalizado = true;
        URL.revokeObjectURL(url);
      }

      videoEl.addEventListener("loadeddata", function () {
        var alvo = 0;
        try {
          alvo = Math.min(1, (videoEl.duration || 1) / 2);
        } catch (erro) {
          alvo = 0;
        }
        try {
          videoEl.currentTime = alvo;
        } catch (erro) {
          capturarFrame();
        }
      });

      videoEl.addEventListener("seeked", capturarFrame);

      videoEl.addEventListener("error", function () {
        if (finalizado) return;
        limpar();
        reject(new Error("Nao foi possivel ler o video"));
      });

      window.setTimeout(function () {
        if (!finalizado) {
          limpar();
          reject(new Error("Tempo esgotado ao gerar miniatura"));
        }
      }, 8000);

      function capturarFrame() {
        if (finalizado) return;
        try {
          var canvas = document.createElement("canvas");
          canvas.width = videoEl.videoWidth || 720;
          canvas.height = videoEl.videoHeight || 1280;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function (blob) {
            limpar();
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas vazio"));
            }
          }, "image/jpeg", 0.8);
        } catch (erro) {
          limpar();
          reject(erro);
        }
      }
    });
  }
})();
