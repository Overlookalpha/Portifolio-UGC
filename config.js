/*
  ============================================================================
  CONFIG.JS — Configuração base do portfólio
  ============================================================================
  Este arquivo agora funciona como FALLBACK.

  O conteúdo principal poderá ser carregado do Supabase pelo editor visual.
  Se o Supabase estiver indisponível, o site continua funcionando usando
  estes dados locais.

  Não é necessário editar este arquivo no dia a dia.
  ============================================================================
*/

var SITE_CONFIG = {

  // --------------------------------------------------------------------------
  // IDENTIDADE
  // --------------------------------------------------------------------------

  identidade: {
    nome: "Nome da Creator",
    nomeCurto: "Creator",
    titulo: "UGC Creator",
    descricaoCurta:
      "Portfólio e media kit de uma UGC Creator — conteúdo autêntico para marcas que querem conectar com pessoas de verdade.",
    idioma: "pt-BR"
  },

  // Mantemos estas propriedades no nível principal por compatibilidade
  // com o código atual durante a transição.
  nome: "Nome da Creator",
  nomeCurto: "Creator",
  titulo: "UGC Creator",
  fraseDeImpacto:
    "Conteúdo autêntico que transforma produtos em experiências.",
  descricaoCurta:
    "Portfólio e media kit de uma UGC Creator — conteúdo autêntico para marcas que querem conectar com pessoas de verdade.",
  idioma: "pt-BR",

  // --------------------------------------------------------------------------
  // SUPABASE
  // --------------------------------------------------------------------------

  supabase: {
    url: "https://ssupfptuimjgrlurcotu.supabase.co",
    anonKey: "sb_publishable_792PihP-YFAe8e06zis3XA_tdXgobVm"
  },

  // --------------------------------------------------------------------------
  // CABEÇALHO
  // --------------------------------------------------------------------------

  header: {
    mostrar: true,
    botaoTexto: "Contato"
  },

  // --------------------------------------------------------------------------
  // HERO
  // --------------------------------------------------------------------------

  hero: {
    eyebrow: "UGC Creator",

    titulo: "Nome da Creator",

    frase:
      "Conteúdo autêntico que transforma produtos em experiências.",

    foto: "images/sobre-placeholder.svg",

    mostrarBotao: true,

    botaoTexto: "Vamos trabalhar juntas",

    botaoDestino: "#contato"
  },

  // --------------------------------------------------------------------------
  // VÍDEOS
  // --------------------------------------------------------------------------

  videosSecao: {
    mostrar: true,
    eyebrow: "Portfólio",
    titulo: "Vídeos UGC",
    descricao:
      "Conteúdo pensado para conectar marcas e pessoas."
  },

  categoriasVideo: [
    { chave: "todos", rotulo: "Todos" },
    { chave: "beauty", rotulo: "Beauty" },
    { chave: "skincare", rotulo: "Skincare" },
    { chave: "lifestyle", rotulo: "Lifestyle" },
    { chave: "fashion", rotulo: "Fashion" },
    { chave: "food", rotulo: "Food" },
    { chave: "travel", rotulo: "Travel" },
    { chave: "unboxing", rotulo: "Unboxing" },
    { chave: "review", rotulo: "Review" },
    { chave: "product-demo", rotulo: "Product Demo" },
    { chave: "testimonial", rotulo: "Testimonial" },
    { chave: "voice-over", rotulo: "Voice Over" },
    { chave: "talking-head", rotulo: "Talking Head" },
    { chave: "aesthetic", rotulo: "Aesthetic Content" }
  ],

  videos: [
    {
      titulo: "Vídeo placeholder 1",
      categoria: "beauty",
      marca: "Marca exemplo",
      descricao:
        "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-1.svg",
      video: ""
    },
    {
      titulo: "Vídeo placeholder 2",
      categoria: "skincare",
      marca: "Marca exemplo",
      descricao:
        "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-2.svg",
      video: ""
    },
    {
      titulo: "Vídeo placeholder 3",
      categoria: "lifestyle",
      marca: "Marca exemplo",
      descricao:
        "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-3.svg",
      video: ""
    },
    {
      titulo: "Vídeo placeholder 4",
      categoria: "unboxing",
      marca: "Marca exemplo",
      descricao:
        "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-4.svg",
      video: ""
    },
    {
      titulo: "Vídeo placeholder 5",
      categoria: "review",
      marca: "Marca exemplo",
      descricao:
        "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-5.svg",
      video: ""
    },
    {
      titulo: "Vídeo placeholder 6",
      categoria: "talking-head",
      marca: "Marca exemplo",
      descricao:
        "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-6.svg",
      video: ""
    }
  ],

  // --------------------------------------------------------------------------
  // GALERIA
  // --------------------------------------------------------------------------

  galeria: {
    mostrar: true,
    eyebrow: "Galeria",
    titulo: "Fotografia",
    descricao:
      "Imagens com estética natural e foco no produto."
  },

  categoriasFoto: [
    { chave: "lifestyle", rotulo: "Lifestyle" },
    { chave: "produto", rotulo: "Produto" },
    { chave: "beleza", rotulo: "Beleza" },
    { chave: "viagem", rotulo: "Viagem" },
    { chave: "gastronomia", rotulo: "Gastronomia" }
  ],

  fotos: [
    {
      legenda: "Foto placeholder 1",
      categoria: "lifestyle",
      imagem: "images/gallery/placeholder-1.svg"
    },
    {
      legenda: "Foto placeholder 2",
      categoria: "produto",
      imagem: "images/gallery/placeholder-2.svg"
    },
    {
      legenda: "Foto placeholder 3",
      categoria: "beleza",
      imagem: "images/gallery/placeholder-3.svg"
    },
    {
      legenda: "Foto placeholder 4",
      categoria: "viagem",
      imagem: "images/gallery/placeholder-4.svg"
    },
    {
      legenda: "Foto placeholder 5",
      categoria: "gastronomia",
      imagem: "images/gallery/placeholder-5.svg"
    },
    {
      legenda: "Foto placeholder 6",
      categoria: "lifestyle",
      imagem: "images/gallery/placeholder-6.svg"
    },
    {
      legenda: "Foto placeholder 7",
      categoria: "produto",
      imagem: "images/gallery/placeholder-7.svg"
    },
    {
      legenda: "Foto placeholder 8",
      categoria: "beleza",
      imagem: "images/gallery/placeholder-8.svg"
    }
  ],

  // --------------------------------------------------------------------------
  // SERVIÇOS
  // --------------------------------------------------------------------------

  servicos: {
    mostrar: true,
    eyebrow: "Serviços",
    titulo: "O que posso criar para sua marca",
    descricao: "",
    itens: [
      {
        titulo: "UGC Videos",
        descricao:
          "Vídeos autênticos, no estilo conteúdo de rede social, prontos pra usar como anúncio ou publicação orgânica."
      },
      {
        titulo: "Reels & Stories",
        descricao:
          "Conteúdo dinâmico pensado pro formato vertical, com edição ágil e ritmo de feed."
      },
      {
        titulo: "Product Photography",
        descricao:
          "Fotos de produto com direção de arte, luz e composição cuidadas."
      },
      {
        titulo: "Unboxing",
        descricao:
          "Experiência de abertura de produto, capturando a primeira impressão de forma genuína."
      },
      {
        titulo: "Reviews",
        descricao:
          "Avaliação honesta do produto, destacando benefícios reais pro público."
      },
      {
        titulo: "Tutorials",
        descricao:
          "Conteúdo educativo mostrando como usar o produto na prática."
      },
      {
        titulo: "Product Demonstrations",
        descricao:
          "Demonstração clara do funcionamento e dos diferenciais do produto."
      },
      {
        titulo: "Voice Over",
        descricao:
          "Narração para vídeos institucionais, anúncios ou conteúdo de marca."
      },
      {
        titulo: "Lifestyle Content",
        descricao:
          "Produto inserido de forma natural no dia a dia, sem parecer publicidade forçada."
      },
      {
        titulo: "Testimonial",
        descricao:
          "Depoimento autêntico sobre a experiência com o produto ou serviço."
      },
      {
        titulo: "Creative Concepts",
        descricao:
          "Desenvolvimento de conceito criativo sob medida para a campanha da marca."
      }
    ]
  },

  // --------------------------------------------------------------------------
  // PROCESSO
  // --------------------------------------------------------------------------

  processo: {
    mostrar: false,
    eyebrow: "Processo",
    titulo: "Como funciona",
    descricao: "",
    itens: [
      {
        numero: "01",
        titulo: "Você entra em contato",
        descricao:
          "Me manda uma mensagem contando sobre a marca e a campanha."
      },
      {
        numero: "02",
        titulo: "Conversamos sobre a campanha",
        descricao:
          "Alinhamos objetivo, formato, prazo e briefing."
      },
      {
        numero: "03",
        titulo: "Criamos o conceito",
        descricao:
          "Desenvolvo uma proposta criativa alinhada com a identidade da marca."
      },
      {
        numero: "04",
        titulo: "Produzo o conteúdo",
        descricao:
          "Gravo, fotografo e edito o material combinado."
      },
      {
        numero: "05",
        titulo: "Entrego o material",
        descricao:
          "Você recebe os arquivos finais dentro do prazo combinado."
      },
      {
        numero: "06",
        titulo: "Sua marca publica e conecta com o público",
        descricao:
          "O conteúdo vai ao ar e gera conexão real com a audiência."
      }
    ]
  },

  // --------------------------------------------------------------------------
  // MARCAS
  // --------------------------------------------------------------------------

  marcas: {
    mostrar: true,
    eyebrow: "Parcerias",
    titulo: "Marcas com as quais já trabalhei",
    descricao: "",
    itens: [
      {
        nome: "Marca Exemplo 1",
        logo: "",
        descricao:
          "Descrição breve da campanha ou parceria (placeholder)."
      },
      {
        nome: "Marca Exemplo 2",
        logo: "",
        descricao:
          "Descrição breve da campanha ou parceria (placeholder)."
      },
      {
        nome: "Marca Exemplo 3",
        logo: "",
        descricao:
          "Descrição breve da campanha ou parceria (placeholder)."
      }
    ]
  },

  // --------------------------------------------------------------------------
  // SOBRE
  // --------------------------------------------------------------------------

  sobre: {
    mostrar: true,
    eyebrow: "Sobre mim",
    titulo: "Quem cria esse conteúdo",

    foto: "images/sobre-placeholder.svg",

    texto: [
      "Sou criadora de conteúdo UGC — transformo produtos em histórias que as pessoas realmente param pra assistir.",

      "Gosto de contar histórias simples, com cara de gente de verdade: sem cenário de estúdio, sem roteiro engessado, só conteúdo que conecta.",

      "Já criei conteúdo nos formatos de beleza, lifestyle, moda e review de produto — sempre buscando o ângulo mais autêntico possível pra cada marca."
    ],

    destaques: [
      "Resposta rápida e comunicação profissional",
      "Conteúdo entregue dentro do prazo combinado",
      "Direção de arte própria, sem depender de roteiro pronto"
    ]
  },

  // --------------------------------------------------------------------------
  // RESULTADOS
  // --------------------------------------------------------------------------

  resultados: {
    mostrar: false,
    eyebrow: "Resultados",
    titulo: "",
    descricao: "",
    itens: [
      {
        numero: "00+",
        rotulo: "Vídeos produzidos"
      },
      {
        numero: "00+",
        rotulo: "Marcas atendidas"
      },
      {
        numero: "00%",
        rotulo: "Taxa de engajamento"
      },
      {
        numero: "00+",
        rotulo: "Visualizações"
      }
    ]
  },

  // Compatibilidade temporária com o código antigo.
  mostrarMetricas: false,

  metricas: [
    {
      numero: "00+",
      rotulo: "Vídeos produzidos"
    },
    {
      numero: "00+",
      rotulo: "Marcas atendidas"
    },
    {
      numero: "00%",
      rotulo: "Taxa de engajamento"
    },
    {
      numero: "00+",
      rotulo: "Visualizações"
    }
  ],

  // --------------------------------------------------------------------------
  // CONTATO
  // --------------------------------------------------------------------------

  contato: {
    eyebrow: "Contato",

    titulo: "Vamos conversar?",

    email: "seuemail@exemplo.com",

    whatsapp: "5511999999999",

    whatsappMensagemPadrao:
      "Olá! Vi seu portfólio e quero conversar sobre uma parceria.",

    instagram:
      "https://instagram.com/seuusuario",

    tiktok:
      "https://tiktok.com/@seuusuario",

    youtube: ""
  },

  // --------------------------------------------------------------------------
  // CTA FINAL
  // --------------------------------------------------------------------------

  cta: {
    eyebrow: "Vamos conversar",

    titulo:
      "Vamos criar algo incrível para sua marca?",

    texto:
      "Estou disponível para parcerias e sempre aberta a novos projetos. Me conta sobre a sua marca e vamos construir um conteúdo que conecta de verdade.",

    botaoPrincipal:
      "Falar pelo WhatsApp"
  },

  // --------------------------------------------------------------------------
  // RODAPÉ
  // --------------------------------------------------------------------------

  rodape: {
    titulo: "UGC Creator",
    mostrarAdmin: true
  },

  // --------------------------------------------------------------------------
  // APARÊNCIA
  // --------------------------------------------------------------------------

  aparencia: {
    fundo: "#f7f5f0",

    fundoElevado: "#ffffff",

    fundoElevado2: "#efece4",

    texto: "#1c1b18",

    textoSecundario: "#625f58",

    textoSuave: "#9a968c",

    destaque: "#1c1b18",

    textoDestaque: "#f7f5f0",

    borda:
      "rgba(28, 27, 24, 0.10)",

    bordaForte:
      "rgba(28, 27, 24, 0.20)",

    overlay:
      "rgba(20, 19, 17, 0.55)",

    fonteTitulos: "Fraunces",

    fonteCorpo: "Inter",

    raioPequeno: 8,

    raioMedio: 18,

    raioGrande: 28,

    raioPill: 999
  },

  // --------------------------------------------------------------------------
  // COMPATIBILIDADE COM A ESTRUTURA ANTIGA
  // --------------------------------------------------------------------------

  corTema: "#f7f5f0",

  corFundo: "#f7f5f0"
};
