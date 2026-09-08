# Portfólio UGC Creator

Site estático (HTML + CSS + JS puro, sem build, sem backend) que funciona como
currículo digital, portfólio e media kit interativo para apresentar trabalho
de UGC Creator a marcas. Pronto pra publicar no GitHub Pages e instalável
como app (PWA) no celular.

## 1. O que é o projeto

- **index.html** — a página inteira (uma única página, com seções: Hero,
  Sobre, Vídeos, Fotos, Serviços, Como funciona, Marcas, Resultados, Contato).
- **config.js** — todo o conteúdo editável do site (nome, bio, contato,
  vídeos, fotos, serviços, marcas, métricas). É o único arquivo que você
  precisa mexer no dia a dia.
- **styles.css** — todo o visual do site.
- **script.js** — lê o `config.js` e monta a página, cuida do menu mobile,
  filtros de vídeo, modal de foto/vídeo, animações e da parte de PWA.
- **manifest.webmanifest** + **sw.js** — deixam o site instalável como app
  e funcionando offline.

Não tem banco de dados, não tem servidor, não tem etapa de build — é só
abrir o `index.html` num navegador (ou publicar os arquivos como estão).

## 2. Estrutura de arquivos

```
/
├── index.html
├── styles.css
├── script.js
├── config.js
├── manifest.webmanifest
├── sw.js
├── robots.txt
├── sitemap.xml
├── README.md
├── icons/              (ícones do app: 192, 512, maskable, apple-touch, favicon)
└── images/
    ├── hero-placeholder.svg
    ├── sobre-placeholder.svg
    ├── og-cover.svg
    ├── videos/         (thumbnails dos vídeos do portfólio)
    └── gallery/         (fotos da galeria)
```

## 3. Como personalizar (o essencial)

Abra o arquivo **`config.js`** — cada bloco é comentado. Os pontos mais
importantes:

- `nome`, `nomeCurto`, `titulo`, `fraseDeImpacto`, `descricaoCurta`
- `contato` (e-mail, WhatsApp, Instagram, TikTok, YouTube)
- `sobre` (foto + texto de apresentação)
- `corTema` / `corFundo` (cor usada no PWA e na barra do navegador)

Depois de editar o `config.js`, o site inteiro se atualiza sozinho — não
precisa mexer no `index.html`.

## 4. Como adicionar vídeos

No `config.js`, dentro do array `videos`, copie um bloco e edite:

```js
{
  titulo: "Nome do vídeo",
  categoria: "beauty",              // uma das chaves em categoriasVideo
  marca: "Nome da marca",
  descricao: "Descrição curta do conteúdo.",
  thumbnail: "images/videos/meu-video-1.jpg",
  video: "images/videos/meu-video-1.mp4"   // ou um link de embed
}
```

- Coloque o arquivo de vídeo (`.mp4`) e a thumbnail (`.jpg`/`.png`) dentro de
  `images/videos/`.
- Prefira vídeos verticais (proporção 9:16) — é o formato que o portfólio
  foi desenhado pra exibir.
- Se quiser usar um vídeo hospedado (YouTube, Vimeo, etc.) em vez de um
  arquivo local, veja a observação no fim desta seção.
- Se quiser criar uma categoria nova, adicione-a também no array
  `categoriasVideo`.

**Sobre embeds externos:** o player do modal usa a tag `<video>` do HTML,
que funciona com arquivos `.mp4` diretos. Pra usar um link do YouTube/Vimeo
como embed (iframe), é preciso um pequeno ajuste na função que abre o modal
de vídeo, dentro de `script.js` (procure por `gridVideos.addEventListener`).

## 5. Como adicionar fotos

No `config.js`, dentro do array `fotos`, copie um bloco e edite:

```js
{ legenda: "Descrição da foto", categoria: "lifestyle", imagem: "images/gallery/minha-foto.jpg" }
```

Coloque o arquivo de imagem dentro de `images/gallery/`. Não precisa ter
todas o mesmo tamanho — a galeria é do tipo "masonry" e se ajusta sozinha.

## 6. Como alterar links de contato/redes sociais

Tudo fica em `config.js`, dentro do bloco `contato`:

```js
contato: {
  email: "seuemail@exemplo.com",
  whatsapp: "5511999999999",   // DDI + DDD + número, só números
  whatsappMensagemPadrao: "...",
  instagram: "https://instagram.com/seuusuario",
  tiktok: "https://tiktok.com/@seuusuario",
  youtube: ""                   // deixe "" (vazio) se não usar
}
```

## 7. Trocar ícones e imagens de capa

- Os ícones do app ficam em `icons/` (foram gerados como um logomark
  provisório — troque pelos seus quando tiver uma marca definida). Mantenha
  os mesmos nomes de arquivo e os mesmos tamanhos (192×192, 512×512, ícone
  "maskable" 512×512 e apple-touch-icon 180×180) pra não precisar editar o
  `manifest.webmanifest`.
- A imagem `images/og-cover.svg` é a que aparece quando o link do site é
  compartilhado no WhatsApp/Instagram/etc. — troque por uma imagem sua de
  1200×630px (pode ser `.jpg` ou `.png`; só lembre de atualizar o caminho
  nas tags `og:image` e `twitter:image` do `index.html`).

## 8. Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (público, pra usar o GitHub Pages
   gratuito) e envie todos os arquivos deste projeto pra ele (pela interface
   do GitHub, "Add file → Upload files", ou por `git push` se preferir).
2. No repositório, vá em **Settings → Pages**.
3. Em "Build and deployment", escolha **Deploy from a branch**.
4. Selecione a branch `main` (ou `master`) e a pasta `/ (root)`.
5. Salve. Em alguns minutos o GitHub mostra o link do site publicado
   (algo como `https://seuusuario.github.io/nome-do-repositorio/`).
6. Depois de publicar, atualize a URL nos arquivos `index.html` (tags
   `canonical`, `og:url`), `robots.txt` e `sitemap.xml` pra apontar pro
   endereço real do site.

Como todos os caminhos do projeto são relativos, o site funciona tanto na
raiz de um domínio quanto dentro de uma subpasta do GitHub Pages — não
precisa configurar nada extra pra isso.

## 9. Como testar o PWA (instalação como app)

1. Publique o site (o recurso de instalação só funciona em HTTPS — não
   funciona abrindo o `index.html` direto do computador com `file://`).
   Pra testar localmente antes de publicar, rode um servidor simples, por
   exemplo `python3 -m http.server 8000` dentro da pasta do projeto e abra
   `http://localhost:8000`.
2. No celular (Android/Chrome ou iOS/Safari), abra o link do site.
3. Depois de alguns segundos de uso, deve aparecer o aviso "Instale este
   portfólio como app no seu celular" na tela — ou você pode instalar pelo
   menu do navegador ("Adicionar à tela inicial"/"Instalar app").
4. No desktop (Chrome/Edge), um ícone de instalação aparece na barra de
   endereço.

Se atualizar bastante o conteúdo visual do site depois de publicado, abra o
`sw.js` e troque o valor de `CACHE_VERSAO` (ex: de `"v1"` pra `"v2"`) — isso
garante que quem já instalou o app baixa a versão nova.

## 10. Como atualizar o portfólio no dia a dia

No dia a dia, praticamente tudo se resume a editar `config.js` e adicionar
arquivos em `images/`. Depois de editar:

- Se estiver usando GitHub Pages direto pela interface web, é só subir os
  arquivos alterados de novo (mesma pasta, mesmo nome — o GitHub Pages
  atualiza sozinho em alguns minutos).
- Se estiver usando `git`, é o fluxo normal: `git add`, `git commit`,
  `git push`.

## 11. Personalização visual (opcional, pra quem for mexer no código)

- Cores, tipografia e espaçamentos ficam centralizados no topo do
  `styles.css`, no bloco `:root { ... }` — trocando os valores ali, o resto
  do site se ajusta sozinho.
- O site vem em modo escuro editorial por padrão. Existe uma base de modo
  claro pronta (`html.light-mode`) — pra ativá-la, seria necessário
  adicionar um botão que alterna a classe `light-mode` no `<html>` (não
  incluído por padrão, pra manter a experiência simples e consistente).

---

Qualquer dúvida sobre uma seção específica, os comentários dentro de
`config.js`, `script.js` e `styles.css` explicam o que cada parte faz.
