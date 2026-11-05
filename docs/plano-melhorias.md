# Plano de melhorias incrementais — Curriculum CPM

Auditoria realizada em 05/11/2026, antes de qualquer mudança de funcionalidade. Este documento registra o estado encontrado, os problemas com prioridade, os arquivos envolvidos, os riscos de regressão e os testes exigidos em cada etapa. As regras permanentes estão em `CLAUDE.md`.

## 1. Estado do repositório

- A pasta de trabalho (`curriculos-main`) **não é um repositório Git**: não há `.git`, então não foi possível comparar com o GitHub nem listar alterações locais por `git status`. Ela parece ter sido extraída de um ZIP do GitHub.
- Todos os arquivos têm data de 05/11/2026 10:03, **exceto `curriculo-aluno.html` (10:30)**. Esse arquivo provavelmente foi editado localmente depois da extração. Ele contém `<link rel="stylesheet" href="style.css">`, que aponta para um arquivo inexistente, e não carrega `css/chatbot.css` (problema P0-1). **Antes de corrigir, confirmar com a equipe se a edição foi intencional.** Nada foi sobrescrito nesta auditoria.
- A equipe trabalha direto nesta pasta, sem Git. Por isso, **antes de cada etapa é feita uma cópia completa da pasta** fora do projeto, para permitir voltar atrás. Para publicar, os arquivos são enviados ao GitHub pela equipe.

## 2. Mapa do projeto

### 2.1 Páginas

| Página | Função | Estrutura | Observações |
| --- | --- | --- | --- |
| `index.html` | Início: banner, chamada para criar currículo, novidades | `pagina-padrao` | Banner usa imagem externa (folhadelondrina.com.br) |
| `curriculo.html` | Formulário enviado ao Formspree | `pagina-padrao` | Envio direto por POST, sem JavaScript |
| `vercurriculos.html` | Catálogo em carrossel (1 card por vez) | `pagina-padrao` | Gerado de `data/alunos-dados.json` |
| `curriculo-aluno.html?id=` | Currículo individual A4 + "Salvar como PDF" | `pagina-complementar` | Referência quebrada e chatbot sem CSS |
| `vagas.html` | Vagas (estáticas) | `pagina-padrao` | Empresas de exemplo; botões "Ver detalhes" sem ação |
| `certificados.html` | Links para cursos gratuitos | `pagina-padrao` | Um link com URL malformada |
| `quem-somos-nos.html` | Apresentação da equipe | `pagina-padrao` | Sem `<main>` |
| `modelo-curriculos.html` | Vitrine alternativa com busca e carrossel com rolagem | `pagina-complementar` | **Sem link de entrada**; paleta cinza fora da identidade |
| `dark_light.html` | Página auxiliar sobre o tema | `pagina-complementar` | **Sem link de entrada**; título invisível no tema claro |

### 2.2 CSS por página

- `css/styles.css`: base das páginas `pagina-padrao`. Contém **seletores globais de elemento** (`section`, `h1`, `h2`, `button`, `button:hover`, `input`), que afetam componentes de outros arquivos.
- `css/site-chrome.css`: cabeçalho, menu, rodapé e botão de tema nas duas variantes. Também redefine, no modo escuro de `pagina-complementar`, dois conjuntos de variáveis (`--fundo/--branco/--texto…` e `--bg/--surface/--text…`).
- `css/chatbot.css`: botão `#cb-toggle` e painel `#cb-panel`.
- `css/inicio.css`, `css/curriculo.css`, `css/oportunidades.css`, `css/vercurriculos.css`, `css/curriculo-aluno.css`, `css/modelo-curriculos.css`, `css/dark_light.css`: estilos específicos de cada página.

### 2.3 JavaScript e dependências

| Arquivo | Escopo | Depende de | Observações |
| --- | --- | --- | --- |
| `js/main.js` | Global (`themeToggle`, `darkModeClass`, `setTheme`) | `.theme-toggle` no HTML | Carregado por último em todas as páginas |
| `js/chatbot.js` | IIFE | `.chatbot` no HTML; `css/chatbot.css` | Cria `#cb-panel`; 10 opções, 11 regras |
| `js/vercurriculos.js` | IIFE, `defer` | IDs do catálogo; JSON | Carrossel com `transform`, setas do teclado, `inert` |
| `js/curriculo-aluno.js` | IIFE, `defer` | 22 IDs do currículo; JSON | `window.print()` no `#botao-imprimir` |
| `js/modelo-curriculos.js` | **Global** (`CONFIG`, `elementos`, funções) | IDs da página de modelos; JSON | Usa dados de demonstração se o JSON falhar |

Não há dependência entre os scripts de página. Todos os IDs consultados por `getElementById` existem nos respectivos HTML (verificado automaticamente).

### 2.4 Fluxos principais

- **JSON de estudantes**: `data/alunos-dados.json` → `{ "alunos": [...] }`. São 6 estudantes, todos ativos, com IDs únicos e fotos existentes. Os três scripts que leem o arquivo validam de formas diferentes: o catálogo exige `id` verdadeiro; o currículo compara `id` exato; a página de modelos exige `id` e `nome` em texto e usa `cache: "no-store"`.
- **Formspree**: `<form action="https://formspree.io/f/xeeykpoe" method="POST">` com validação nativa (`required`, `type="email"`, `type="url"`) e `_subject`. Sem `_next`, então o visitante vai para a página de agradecimento do Formspree. Não há aviso de privacidade/LGPD, honeypot antiespam nem `autocomplete`.
- **Chatbot Nina**: escolhe a primeira regra cuja palavra-chave aparece como **substring** da pergunta em minúsculas. Ações `openMaps` (link externo) e `openCatalog` (`vercurriculos.html#carrossel`). O painel usa `role="dialog"` não modal, `role="log"` + `aria-live`, `inert` quando fechado e fecha com Escape.
- **Tema**: `main.js` lê `localStorage.theme` e, na falta dele, `prefers-color-scheme`. Aplica `body.dark-mode` e atualiza `aria-pressed`/`aria-label`. Já na primeira carga **grava a preferência**, e a partir daí deixa de acompanhar o sistema.
- **Currículo e PDF**: `curriculo-aluno.js` lê `?id=`, preenche as seções, oculta as vazias e troca a foto ausente por um avatar SVG. A impressão usa `@page { size: A4; margin: 0 }` e `@media print`, que mostra só `#pagina-curriculo`.

## 3. Problemas encontrados

Legenda de verificação: **[V]** confirmado em navegador (Chrome headless, capturas em 1366/390 px, temas claro/escuro, PDF); **[E]** confirmado por análise estática ou cálculo; **[I]** inferido pela cascata CSS, ainda sem verificação interativa.

### P0 — Quebras visíveis ou de funcionalidade (corrigir primeiro)

| ID | Problema | Arquivos | Verif. |
| --- | --- | --- | --- |
| P0-1 | `curriculo-aluno.html` carrega `style.css` (404) e **não carrega `css/chatbot.css`**. O botão da Nina e o painel aparecem sem estilo no fim da página: texto "Nina…", campo e botão soltos abaixo do rodapé. | `curriculo-aluno.html:11` | [V] |
| P0-2 | Modo escuro no currículo individual: `site-chrome.css` escurece `--branco`/`--texto`, mas nome (`h1`), títulos de seção e títulos de itens continuam `#043175`. O contraste fica em **1,19:1** e o nome praticamente some. | `css/curriculo-aluno.css`, `css/site-chrome.css` | [V] |
| P0-3 | **PDF gerado com o tema escuro ativo** sai com fundo escuro (`#1f2937`) e nome/títulos ilegíveis, porque a impressão herda as variáveis do modo escuro. Afeta o principal uso da página. | `css/curriculo-aluno.css` (`@media print`) | [V] |
| P0-4 | Catálogo no modo escuro: `body.dark-mode h2 { color: #f5f5f5 }` (styles.css) vence `.nome-aluno`, e o **nome do estudante fica branco sobre o card branco** (1,09:1). | `css/styles.css`, `css/vercurriculos.css` | [V] |

### P1 — Acessibilidade WCAG 2.2 AA e defeitos relevantes

| ID | Problema | Arquivos | Verif. |
| --- | --- | --- | --- |
| P1-1 | `dark_light.html`: `h1 { color: white }` sobre fundo branco no tema claro, então o título fica invisível. O reset `* { padding: 0 }` encosta o texto na borda, e há erro de digitação na fonte (`'Outif'`). | `css/dark_light.css` | [V] |
| P1-2 | `modelo-curriculos.html` no escuro: o rótulo "Nossos estudantes" (`#484444` sobre `#111827`, 1,85:1) e o contador de resultados sobre a barra clara ficam ilegíveis; a barra e a mensagem vazia continuam com fundo branco translúcido. | `css/modelo-curriculos.css` | [V] |
| P1-3 | Opções do chatbot no *hover*: texto `#1B2A3D` sobre `#043175` (1,18:1) no tema claro e nas páginas complementares. A nota do rodapé do chat tem 4,20:1. | `css/chatbot.css` | [E] |
| P1-4 | Indicadores de foco amarelos (`#ffbf47`, `#f0b44d`) sobre branco: 1,6–1,9:1, abaixo de 3:1 (1.4.11). Há três cores de foco diferentes no projeto. | `css/vercurriculos.css`, `css/curriculo-aluno.css`, `css/modelo-curriculos.css` | [E] |
| P1-5 | Menu ativo/hover (branco sobre `#62a294`) e textos verdes (título profissional, período) sobre branco: 2,95:1. **Envolve cor institucional**: propor um verde mais escuro só com aprovação. | `css/site-chrome.css`, `css/curriculo-aluno.css`, `css/vercurriculos.css` | [E] |
| P1-6 | `button:hover { transform: translateY(-3px) }` (global) tem especificidade maior que `.controle { transform: translateY(-50%) }`, então as setas do catálogo devem "pular" ao passar o mouse. No escuro, `body.dark-mode button` torna os indicadores inativos `#374151` sobre `#212121` (1,56:1). | `css/styles.css`, `css/vercurriculos.css` | [I]/[E] |
| P1-7 | Formulário: faltam `autocomplete` (1.3.5 — nome, e-mail, URLs), indicação textual de campo obrigatório, aviso de privacidade/LGPD (dados de menores) e honeypot `_gotcha`. O botão "Salvar currículo" na verdade **envia** os dados. Mudanças de texto/consentimento precisam de aprovação da equipe. | `curriculo.html`, `css/curriculo.css` | [E] |
| P1-8 | `certificados.html`: a URL `…categoryid=8%22%3EAcessar` traz resto de HTML colado. O card "Escola Virtual GOV" aponta para `aprendamais.mec.gov.br` (conferir o destino correto). Os links com `target="_blank"` não avisam que abrem nova aba. | `certificados.html:50` | [E] |
| P1-9 | Tema: `main.js` roda no fim do `<body>`, então páginas no escuro piscam em claro primeiro (FOUC). O `localStorage` é usado sem `try/catch`, o que interrompe o script se o armazenamento estiver bloqueado. A primeira carga grava a preferência e "congela" o tema do sistema. `aria-label` muda junto com `aria-pressed` (o nome deveria ser fixo). Corrigir **sem mudar a chave `theme` nem a classe `dark-mode`**. | `js/main.js`, todos os HTML | [E] |
| P1-10 | Títulos de página repetidos ou pouco descritivos (2.4.2): "Curriculum CPM" em `curriculo.html`, `certificados.html` e `modelo-curriculos.html`. | HTML | [E] |

### P2 — Consistência, semântica e conteúdo

| ID | Problema | Arquivos |
| --- | --- | --- |
| P2-1 | Menus e rodapés divergentes: o rodapé de `quem-somos-nos.html` não tem "Ver Currículos"; os de `dark_light.html` e `modelo-curriculos.html` não têm "Certificados"; o menu de `dark_light.html` não tem "Quem Somos Nós". | HTML |
| P2-2 | Duas marcações de cabeçalho: `div.logo > p` (padrão, logo não é link) e `a.logo > span` (complementar). | HTML, `css/site-chrome.css` |
| P2-3 | `quem-somos-nos.html` não tem `<main>`; a hierarquia de títulos salta níveis: rodapé com `h3` sem `h2`, `curriculo.html` com `h2` antes do `h1`. | HTML |
| P2-4 | `modelo-curriculos.html` e `dark_light.html` não têm link de entrada. A página de modelos marca "Ver Currículos" como atual, e seus dados de demonstração (Ana Lima, Bruno Santos, Carolina Mendes, Diego Rocha) **aparecem como se fossem estudantes** quando o JSON falha, o que contraria a regra 14. Decidir: manter, vincular ou arquivar (não excluir sem decisão). | `modelo-curriculos.html`, `js/modelo-curriculos.js`, `dark_light.html` |
| P2-5 | As mensagens de erro para o público citam "Live Server" (instrução de desenvolvimento) no catálogo, no currículo e nos modelos. | `vercurriculos.html`, `js/curriculo-aluno.js`, `modelo-curriculos.html` |
| P2-6 | Conteúdo provisório: vagas com "Empresa Exemplo"/"Empresa ABC" e botões sem ação; notícias estáticas na página inicial. | `vagas.html`, `index.html` |
| P2-7 | O banner depende de imagem externa (disponibilidade e direitos autorais). Não há favicon (404 em `/favicon.ico`). | `css/inicio.css`, HTML |
| P2-8 | `logo3cpm.png` tem 1,49 MB e é exibida com 60 px (desempenho no celular). Otimizar só com um derivado aprovado (regra 4). | `logo3cpm.png` |
| P2-9 | Privacidade: o JSON público expõe e-mails pessoais de estudantes, provavelmente menores. O ID `ana-garcia` usa a foto `fotos/ana-beatriz.png` (só conferir, **não alterar** sem autorização). Levar à equipe/orientação. | `data/alunos-dados.json` |
| P2-10 | A documentação está desatualizada: README e `docs/refatoracao.md` dizem que `chatbot.css` é carregado por todas as páginas, o que deixou de valer para `curriculo-aluno.html`. | `README.md`, `docs/refatoracao.md` |

### P3 — Duplicação e manutenção

- **CSS duplicado ou conflitante**
  - `:root` com as mesmas cores em `vercurriculos.css` e `curriculo-aluno.css`.
  - Dois vocabulários de variáveis (`--fundo` e `--bg`) redefinidos no modo escuro.
  - `[hidden]` aparece 2×, `:focus-visible` 3× (cores diferentes) e o bloco `prefers-reduced-motion` 3×.
  - `.novidades article` e `.noticia` se sobrepõem.
  - `.card { gap }` não tem efeito (o card não é flex), e `box-sizing` do `.card` se repete na media query.
  - `nav` e `.logo` sem escopo em `curriculo-aluno.css` competem com `site-chrome.css`.
  - Nomes de classe iguais com significados diferentes: `.curriculo` (formulário × folha A4), `.foto-aluno`, `.nome-aluno`.
- **Seletores globais** em `styles.css` (`section { padding: 40px }`, `h1`, `h2`, `button`, `button:hover`, `input`) vazam para componentes (causa de P0-4 e P1-6).
- **Funções repetidas**
  - Gerador de avatar SVG 3× (com pequenas diferenças visuais).
  - Criador de elementos 3× (`criar`/`criarElemento`).
  - Verificação de texto 2× (`texto`/`temTexto`).
  - Carga e validação do JSON 3×.
  - `modelo-curriculos.js` expõe variáveis globais.
- **Chatbot** (comportamento a preservar, só documentado):
  - `"turno"` é substring de `"noturno"`, então perguntas com "noturno" sempre caem na regra de turnos, e a palavra `"noturno"` da regra do curso técnico nunca é alcançada.
  - `"como"` captura muitas perguntas livres.
- **Código não utilizado**: a varredura não achou classe CSS sem uso nem arquivos duplicados (hash). Os únicos candidatos são as páginas órfãs de P2-4. **Nenhum arquivo deve ser excluído só com base nisso.**

## 4. Etapas propostas (uma por vez, com aprovação)

| Etapa | Escopo | Arquivos | Risco de regressão | Testes obrigatórios |
| --- | --- | --- | --- | --- |
| 0 | Cópia de segurança da pasta antes de cada etapa (sem Git) | — | Nenhum | Cópia conferida (mesma quantidade de arquivos) |
| 1 | P0-1: trocar `style.css` por `css/chatbot.css` em `curriculo-aluno.html` (após confirmar a edição local) | `curriculo-aluno.html` | Baixo | Sem 404; chatbot abre/fecha/Escape na página; impressão continua ocultando o chatbot |
| 2 | P0-2/P0-3: modo escuro do currículo com cores legíveis; **impressão forçando a paleta clara** | `css/curriculo-aluno.css` | Médio: identidade da folha A4 e impressão | 6 currículos × claro/escuro × 1366/390 px; PDF pelo diálogo real em Chrome, Edge e Firefox nos dois temas; quebra de página; contraste ≥ 4,5:1 |
| 3 | P0-4 e P1-6: escopo dos seletores globais que vazam para o catálogo (nome no escuro, salto das setas, indicadores) | `css/styles.css`, `css/vercurriculos.css` | Médio: `styles.css` atinge 6 páginas | Captura antes/depois de todas as páginas `pagina-padrao` nos dois temas; *hover*/foco das setas; teclado ←/→ |
| 4 | P1-3, P1-4, P1-2, P1-1: contrastes do chatbot, foco unificado, modo escuro da página de modelos e de `dark_light.html` | `css/chatbot.css`, CSS de página | Baixo/médio | Medição de contraste; navegação só por teclado em todas as páginas; chatbot nas duas bases de página |
| 5 | P1-9: tema sem piscar e tolerante a `localStorage` bloqueado, mantendo `theme`/`dark-mode` | `js/main.js`, HTML (script curto no `<head>`) | Médio: atinge todas as páginas | Primeira visita com sistema claro/escuro; troca e persistência entre páginas; aba anônima; `localStorage` bloqueado; leitor de tela no botão |
| 6 | P1-7: formulário (`autocomplete`, obrigatórios, honeypot, texto do botão, aviso LGPD aprovado) | `curriculo.html`, `css/curriculo.css` | Alto: perda de envios | Conferir `action`, `method` e `name` inalterados; validação nativa; envio **interceptado** localmente; um envio real só com autorização e combinado com quem recebe o e-mail |
| 7 | P1-8, P1-10, P2-1 a P2-5: links, títulos, menus/rodapés, semântica, mensagens de erro | HTML, JS de página | Baixo | Verificador de links locais; destinos externos abertos manualmente; árvore de títulos; leitor de tela (NVDA) no menu |
| 8 | P3: consolidar duplicações (variáveis, foco, helpers JS) **sem mudar o visual** | CSS/JS | Médio | Comparação de capturas antes/depois (pixel e estilos calculados) em todas as páginas; mesmos testes dos fluxos JSON |
| 9 | P2-6 a P2-9 e documentação (README, `refatoracao.md`) | conforme decisão | Depende da decisão | Revisão da equipe/orientação; nenhum dado pessoal alterado sem autorização |

### Testes de regressão para toda etapa

1. Servir sob `/curriculos/` e abrir as 9 páginas: nenhum 404 e nenhum erro no console.
2. Temas claro e escuro, alternância e persistência entre páginas (chave `theme`).
3. Catálogo: 6 cards, anterior/próximo, volta circular, setas do teclado, indicadores, link para `curriculo-aluno.html?id=...`.
4. Currículo: ID válido, inexistente, ausente e inativo (simulado só no navegador); "Salvar como PDF".
5. Chatbot: abrir, menu, uma resposta de cada ação (`openMaps`, `openCatalog`), voltar, finalizar, Escape, foco de volta ao botão.
6. Formulário: campos, nomes e endpoint inalterados (sem envio real).
7. Larguras de 1366, 768 e 390 px; `prefers-reduced-motion`.

## 5. Testes executados nesta auditoria

- **Leitura integral** dos 9 HTML, 10 CSS, 5 JS, JSON, README e `docs/refatoracao.md`.
- **Script estático** (Python, fora do projeto):
  - JSON válido, 6 estudantes ativos, IDs únicos e fotos existentes.
  - Referências locais: a única quebrada é `style.css`.
  - Os IDs consultados pelo JS existem no HTML.
  - Páginas sem link de entrada identificadas; nenhum arquivo duplicado.
  - 15 pares de cores medidos (12 abaixo do mínimo WCAG).
- **Varredura de classes CSS** contra HTML e JS: nenhuma classe sem uso.
- **Servidor HTTP local** com o projeto sob `/curriculos/` (simulando o GitHub Pages): registrou 404 apenas em `style.css` e `favicon.ico`.
- **Chrome headless** com perfis temporários:
  - Capturas das 9 páginas em claro/escuro, 1366 e 390 px (36 capturas).
  - Captura alta de `curriculo-aluno.html` e dois PDFs (claro/escuro).
  - Confirmados P0-1, P0-2, P0-3, P0-4, P1-1 e P1-2.
- **Nenhum arquivo do site foi alterado**, nenhum formulário foi enviado e nada foi publicado. As capturas ficaram na pasta temporária da sessão.

## 6. Limitações da validação

- Sem Git, não foi possível identificar com certeza as alterações locais; a evidência é só a data de modificação.
- **O PDF do headless saiu em coluna única**: o Chrome headless usa papel Carta com margens, e a largura útil (~739 px) ativa `@media (max-width: 760px)`. No diálogo real, com `@page A4 margin 0`, a largura é ~794 px e as duas colunas devem se manter. Porém, **se o usuário escolher margens padrão no diálogo, o mesmo colapso pode acontecer**. Testar manualmente em Chrome, Edge e Firefox (risco ligado à etapa 2).
- O "salto" das setas (P1-6) foi deduzido da cascata; o *hover* não foi exercitado interativamente.
- Não foram testados: leitor de tela real, teclado virtual em celular físico, Safari/iOS, recebimento real pelo Formspree, destinos externos (cursos, Maps, banner) e o site publicado no GitHub Pages.
- O console do navegador não foi capturado de forma confiável no modo headless; a ausência de erros JS se baseia no carregamento correto do conteúdo dinâmico (catálogo, currículos e modelos renderizaram).

## 7. Registro de etapas concluídas

### Etapa "Padronização do design" — 05/11/2026

**Objetivo:** uma só linguagem visual em todas as páginas, sem mudar funcionalidades.

**Organização final do CSS**

| Arquivo | Conteúdo |
| --- | --- |
| `css/styles.css` | Variáveis (cores institucionais, tema claro e escuro, fontes, espaçamentos, raios, sombras, larguras, transição), base e componentes reutilizáveis |
| `css/site-chrome.css` | Cabeçalho, menu, rodapé e botão de tema, com marcação única nas 9 páginas |
| `css/chatbot.css` | Nina, usando os mesmos tokens |
| `css/inicio.css`, `curriculo.css`, `oportunidades.css`, `vercurriculos.css`, `modelo-curriculos.css`, `dark_light.css` | Apenas o que é exclusivo de cada página |
| `css/curriculo-aluno.css` | Folha A4 com variáveis próprias (`--a4-*`) e bloco de impressão independente do tema e da largura |

**Mudanças de marcação:**
- Cabeçalho, rodapé e botão de tema idênticos nas 9 páginas.
- Removidas as classes `pagina-padrao`/`pagina-complementar`.
- Ícones de sol/lua em SVG.
- Títulos do rodapé passaram a `h2`.
- `<main>` adicionado em `quem-somos-nos.html`.
- Cabeçalho de página em Vagas e Certificados.
- Emojis removidos dos títulos "Novidades" e "Dicas".
- `type="button"` nos botões "Ver detalhes" (continuam sem ação, como antes).
- `curriculo-aluno.html` deixou de referenciar `style.css` e passou a carregar `css/chatbot.css`.

**Itens do plano resolvidos:**
- **Totalmente:**
  - P0-1 a P0-4;
  - P1-1, P1-2, P1-3, P1-4 e P1-6;
  - P2-1 e P2-2;
  - P2-3, apenas na parte do `<main>` e dos títulos do rodapé;
  - P2-10;
  - P3, na parte de CSS: variáveis únicas, foco único, um bloco `[hidden]`, um bloco de movimento reduzido e o fim dos seletores globais que vazavam.
- **Parcialmente:** P1-5. O menu ativo não usa mais texto branco sobre verde, e os textos verdes do site usam `--cpm-verde-texto` (5,89:1). Na **folha A4 o verde original `#62a294` foi mantido** de propósito, para não alterar o currículo impresso; trocar só com aprovação.
- **Pendentes:** P1-7 (formulário), P1-8 (links de certificados), P1-9 (tema sem piscar), P1-10 (títulos das abas), P2-4 a P2-9 e a duplicação em JavaScript.

**Diferenças visuais intencionais:**
- Menu com links discretos e sublinhado verde na página atual, no lugar dos botões-pílula.
- Texto corrido em fonte sem serifa do sistema; títulos continuam em Georgia.
- Chatbot com as cores do site, no lugar da paleta bege.
- Página de modelos com a faixa azul institucional, no lugar da paleta cinza e dos círculos decorativos.
- Folha A4 branca também no tema escuro.

**Testes executados:**
- Navegador: Chrome headless, servidor local sob `/curriculos/`.
- Roteiro automatizado com 105 verificações, todas aprovadas:
  - em cada uma das 9 páginas: CSS carregados, cabeçalho e rodapé padrão, logo 52×52 sem distorção, um `<main>`, página atual marcada e chatbot com CSS, abrindo, saudando com 10 opções e fechando com Escape;
  - tema: alternância, `localStorage.theme`, `aria-pressed` e persistência;
  - catálogo: 6 estudantes, nome legível no escuro, setas centralizadas, próximo/anterior circular, teclado e links;
  - currículo: ID válido, inexistente e ausente; folha branca e nome azul no escuro;
  - formulário: `action`, `method` e nomes dos campos idênticos, validação nativa, **sem envio**;
  - modelos: 6 cards, busca e lista vazia;
  - nenhum erro JavaScript capturado.
- Capturas das 9 páginas nos temas claro e escuro em 1366 px.
- Visualização em largura real de 390 px (em `<iframe>`) das páginas principais nos dois temas.
- Chatbot aberto com resposta nos dois temas.
- PDF gerado com o tema claro e com o escuro: ambos claros, A4, uma página, duas colunas, só o currículo.
- Nenhuma resposta 404 do site.

**Limitações:**
- O headless impõe janela mínima de 500 px, por isso a validação de 390 px foi feita em `<iframe>`.
- O *hover* não pode ser fotografado no headless; as cores de *hover* foram conferidas por cálculo de contraste.
- Não testados: Firefox, Safari, celular físico, leitor de tela, impressão pelo diálogo real do navegador (com margens escolhidas pelo usuário) e o site publicado no GitHub Pages.

### Etapa "Responsividade e acessibilidade (WCAG 2.2 AA)" — 05/11/2026

Detalhes em `docs/relatorio-acessibilidade.md`.

**Resolvidos nesta etapa:**
- **P1-5:** verde da folha A4 escurecido apenas no texto.
- **P1-7:** só a parte de acessibilidade (`autocomplete`, obrigatórios, dicas); o texto LGPD e o rótulo do botão continuam pendentes.
- **P1-8:** URL corrigida; o nome do card "Escola Virtual GOV" ainda precisa ser conferido.
- **P1-9 e P1-10.**
- **P2-5:** mensagens de erro.

**Arquivos novos:** `js/menu.js`, `js/tema-inicial.js` e `docs/relatorio-acessibilidade.md`.

**Resultado:** 0 violações axe-core; nenhuma rolagem horizontal de 320 a 1440 px; 54 testes de teclado real e 105 funcionais aprovados.

### Etapa "Chatbot Nina" — 05/11/2026

**O que mudou:**
- **Interface:** janela compacta e responsiva com cabeçalho "Nina — Assistente automática", botões "Recomeçar" e "Fechar", conversa rolável, autor identificado em cada mensagem e campo com rótulo.
- **Menu inicial:** 7 ações rápidas (criar, PDF, enviar ao catálogo, encontrar estudantes, vagas, cursos, projeto) e "Mais assuntos".
- **Respostas:** reescritas, curtas e sem despedida repetida, mantendo só as informações institucionais verificadas.
- **Reconhecimento:** sem acentos e sem maiúsculas, com sinônimos, padrões por palavras completas, pontuação, prioridade e sugestão em caso de empate.
- **Pergunta ambígua** ("currículo"): a Nina pergunta o que a pessoa quer fazer.
- **Pergunta desconhecida:** a Nina orienta e mostra o menu.

**Arquivos:**
- novo `js/nina-conteudo.js`;
- reescritos `js/chatbot.js` e `css/chatbot.css`;
- os 9 HTML passaram a carregar `js/nina-conteudo.js`;
- `curriculo.html` ganhou `id="formulario"`.

**Testes** (teclas e cliques reais, temas claro e escuro):
- 38 testes da Nina aprovados: 39 perguntas reconhecidas corretamente; destinos de todas as ações conferidos (página e âncora existentes); envios e cliques rápidos; foco, Escape, Recomeçar, link para a própria página e PDF na página do currículo; janela dentro da tela de 320×568 a 1440×900, inclusive celular deitado (568×320).
- axe-core com o chat aberto: 0 violações.
- Regressão: funcional 105/105, teclado real 54/54, rolagem horizontal 108/108 combinações e axe-core 0 violações em todas as páginas.
- Movimento reduzido: sem animação e sem indicador de digitação.

**Limitações:**
- O histórico não é mantido ao trocar de página.
- Não testado com leitor de tela real nem em celular físico.
