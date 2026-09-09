/*
  ============================================================================
  CONFIG.JS — Painel de controle do portfólio
  ============================================================================
  Este é o ÚNICO arquivo que você precisa editar no dia a dia.
  Todo o conteúdo do site (textos, links, vídeos, fotos, serviços, marcas,
  métricas) vem daqui. Não precisa mexer no HTML, CSS ou no script.js pra
  atualizar informações.

  Onde tudo está marcado como "PLACEHOLDER", troque pelo seu conteúdo real
  antes de publicar. O site funciona com os placeholders, mas eles existem
  só pra você ver a estrutura funcionando — não são dados reais.
  ============================================================================
*/

var SITE_CONFIG = {

  // --------------------------------------------------------------------
  // IDENTIDADE
  // --------------------------------------------------------------------
  nome: "Nome da Creator",              // PLACEHOLDER — troque pelo seu nome
  nomeCurto: "Creator",                 // usado no manifest (nome curto do app)
  titulo: "UGC Creator",                // sua "profissão"/posicionamento
  fraseDeImpacto: "Conteúdo autêntico que transforma produtos em experiências.",

  // Usado em SEO, Open Graph, description do manifest, etc.
  descricaoCurta: "Portfólio e media kit de uma UGC Creator — conteúdo autêntico para marcas que querem conectar com pessoas de verdade.",

  // Idioma principal do site (usado na tag <html lang="">)
  idioma: "pt-BR",

  // --------------------------------------------------------------------
  // SUPABASE — conexao com o banco de dados e o armazenamento de midia
  // usada pelo painel admin (admin.html) e pelo site publico pra buscar
  // as fotos/videos cadastrados por la. A chave abaixo e publica por
  // design (protegida por Row Level Security no Supabase), pode ficar
  // exposta no codigo do site sem problema.
  // --------------------------------------------------------------------
  supabase: {
    url: "https://ssupfptuimjgrlurcotu.supabase.co",
    anonKey: "sb_publishable_792PihP-YFAe8e06zis3XA_tdXgobVm"
  },

  // --------------------------------------------------------------------
  // CONTATO
  // --------------------------------------------------------------------
  contato: {
    email: "seuemail@exemplo.com",           // PLACEHOLDER
    whatsapp: "5511999999999",               // PLACEHOLDER — só números, com DDI+DDD
    whatsappMensagemPadrao: "Olá! Vi seu portfólio e quero conversar sobre uma parceria.",
    instagram: "https://instagram.com/seuusuario",   // PLACEHOLDER
    tiktok: "https://tiktok.com/@seuusuario",         // PLACEHOLDER
    youtube: ""                                        // deixe vazio "" se não usar
  },

  // --------------------------------------------------------------------
  // SEÇÃO "SOBRE MIM"
  // --------------------------------------------------------------------
  sobre: {
    foto: "images/sobre-placeholder.svg",   // troque pela sua foto (jpg/png/webp)
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

  // --------------------------------------------------------------------
  // PORTFÓLIO DE VÍDEOS
  // --------------------------------------------------------------------
  // categoria deve ser uma das chaves de CATEGORIAS_VIDEO abaixo.
  // video: caminho de um arquivo .mp4 local OU uma URL de embed (ex: YouTube).
  // Para adicionar um vídeo novo, copie um bloco inteiro { ... } e edite.
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
      descricao: "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-1.svg",
      video: ""   // PLACEHOLDER — coloque o caminho do .mp4 ou link de embed
    },
    {
      titulo: "Vídeo placeholder 2",
      categoria: "skincare",
      marca: "Marca exemplo",
      descricao: "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-2.svg",
      video: ""
    },
    {
      titulo: "Vídeo placeholder 3",
      categoria: "lifestyle",
      marca: "Marca exemplo",
      descricao: "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-3.svg",
      video: ""
    },
    {
      titulo: "Vídeo placeholder 4",
      categoria: "unboxing",
      marca: "Marca exemplo",
      descricao: "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-4.svg",
      video: ""
    },
    {
      titulo: "Vídeo placeholder 5",
      categoria: "review",
      marca: "Marca exemplo",
      descricao: "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-5.svg",
      video: ""
    },
    {
      titulo: "Vídeo placeholder 6",
      categoria: "talking-head",
      marca: "Marca exemplo",
      descricao: "Substitua por uma descrição curta do conteúdo produzido para essa marca.",
      thumbnail: "images/videos/placeholder-6.svg",
      video: ""
    }
  ],

  // --------------------------------------------------------------------
  // GALERIA DE FOTOS
  // --------------------------------------------------------------------
  // categoria deve ser uma das chaves de CATEGORIAS_FOTO abaixo.
  categoriasFoto: [
    { chave: "lifestyle", rotulo: "Lifestyle" },
    { chave: "produto", rotulo: "Produto" },
    { chave: "beleza", rotulo: "Beleza" },
    { chave: "viagem", rotulo: "Viagem" },
    { chave: "gastronomia", rotulo: "Gastronomia" }
  ],

  // Para adicionar uma foto nova, copie um bloco { ... } e edite.
  fotos: [
    { legenda: "Foto placeholder 1", categoria: "lifestyle", imagem: "images/gallery/placeholder-1.svg" },
    { legenda: "Foto placeholder 2", categoria: "produto",   imagem: "images/gallery/placeholder-2.svg" },
    { legenda: "Foto placeholder 3", categoria: "beleza",    imagem: "images/gallery/placeholder-3.svg" },
    { legenda: "Foto placeholder 4", categoria: "viagem",    imagem: "images/gallery/placeholder-4.svg" },
    { legenda: "Foto placeholder 5", categoria: "gastronomia", imagem: "images/gallery/placeholder-5.svg" },
    { legenda: "Foto placeholder 6", categoria: "lifestyle", imagem: "images/gallery/placeholder-6.svg" },
    { legenda: "Foto placeholder 7", categoria: "produto",   imagem: "images/gallery/placeholder-7.svg" },
    { legenda: "Foto placeholder 8", categoria: "beleza",    imagem: "images/gallery/placeholder-8.svg" }
  ],

  // --------------------------------------------------------------------
  // SERVIÇOS — "O que posso criar para sua marca"
  // --------------------------------------------------------------------
  servicos: [
    { titulo: "UGC Videos", descricao: "Vídeos autênticos, no estilo conteúdo de rede social, prontos pra usar como anúncio ou publicação orgânica." },
    { titulo: "Reels & Stories", descricao: "Conteúdo dinâmico pensado pro formato vertical, com edição ágil e ritmo de feed." },
    { titulo: "Product Photography", descricao: "Fotos de produto com direção de arte, luz e composição cuidadas." },
    { titulo: "Unboxing", descricao: "Experiência de abertura de produto, capturando a primeira impressão de forma genuína." },
    { titulo: "Reviews", descricao: "Avaliação honesta do produto, destacando benefícios reais pro público." },
    { titulo: "Tutorials", descricao: "Conteúdo educativo mostrando como usar o produto na prática." },
    { titulo: "Product Demonstrations", descricao: "Demonstração clara do funcionamento e dos diferenciais do produto." },
    { titulo: "Voice Over", descricao: "Narração para vídeos institucionais, anúncios ou conteúdo de marca." },
    { titulo: "Lifestyle Content", descricao: "Produto inserido de forma natural no dia a dia, sem parecer publicidade forçada." },
    { titulo: "Testimonial", descricao: "Depoimento autêntico sobre a experiência com o produto ou serviço." },
    { titulo: "Creative Concepts", descricao: "Desenvolvimento de conceito criativo sob medida para a campanha da marca." }
  ],

  // --------------------------------------------------------------------
  // COMO FUNCIONA — processo de parceria
  // --------------------------------------------------------------------
  processo: [
    { numero: "01", titulo: "Você entra em contato", descricao: "Me manda uma mensagem contando sobre a marca e a campanha." },
    { numero: "02", titulo: "Conversamos sobre a campanha", descricao: "Alinhamos objetivo, formato, prazo e briefing." },
    { numero: "03", titulo: "Criamos o conceito", descricao: "Desenvolvo uma proposta criativa alinhada com a identidade da marca." },
    { numero: "04", titulo: "Produzo o conteúdo", descricao: "Gravo, fotografo e edito o material combinado." },
    { numero: "05", titulo: "Entrego o material", descricao: "Você recebe os arquivos finais dentro do prazo combinado." },
    { numero: "06", titulo: "Sua marca publica e conecta com o público", descricao: "O conteúdo vai ao ar e gera conexão real com a audiência." }
  ],

  // --------------------------------------------------------------------
  // MARCAS / TRABALHOS — deixe a lista vazia [] se ainda não tiver marcas
  // --------------------------------------------------------------------
  marcas: [
    { nome: "Marca Exemplo 1", logo: "", descricao: "Descrição breve da campanha ou parceria (placeholder)." },
    { nome: "Marca Exemplo 2", logo: "", descricao: "Descrição breve da campanha ou parceria (placeholder)." },
    { nome: "Marca Exemplo 3", logo: "", descricao: "Descrição breve da campanha ou parceria (placeholder)." }
  ],

  // --------------------------------------------------------------------
  // RESULTADOS / MÉTRICAS — seção opcional; deixe mostrarMetricas: false
  // pra ocultar completamente até ter números reais pra mostrar.
  // Por padrão fica desligada pra manter a página mais enxuta (menos é
  // mais) — mude pra true quando quiser mostrar essa seção de novo.
  // --------------------------------------------------------------------
  mostrarMetricas: false,
  metricas: [
    { numero: "00+", rotulo: "Vídeos produzidos" },
    { numero: "00+", rotulo: "Marcas atendidas" },
    { numero: "00%", rotulo: "Taxa de engajamento" },
    { numero: "00+", rotulo: "Visualizações" }
  ],

  // --------------------------------------------------------------------
  // TEXTOS DA SEÇÃO DE CTA COMERCIAL (final da página)
  // --------------------------------------------------------------------
  cta: {
    titulo: "Vamos criar algo incrível para sua marca?",
    texto: "Estou disponível para parcerias e sempre aberta a novos projetos. Me conta sobre a sua marca e vamos construir um conteúdo que conecta de verdade."
  },

  // --------------------------------------------------------------------
  // COR-TEMA (usada no manifest.webmanifest e no <meta theme-color>)
  // --------------------------------------------------------------------
  corTema: "#f7f5f0",
  corFundo: "#f7f5f0"
};
