# Genealogia da sua família

Álbum-livro interativo sobre genealogia **da sua família** em Next.js. Não vinculado a um único sobrenome: em um único arquivo de configuração você define o sobrenome do «dono» do álbum — o título e a descrição são inseridos automaticamente em todos os idiomas. O usuário folheia as páginas duplas, navega pelos capítulos e pelas fichas de pessoas a partir da árvore genealógica ou de fotos interativas.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Vitest](https://img.shields.io/badge/Vitest-4-yellow)

## Recursos

- **Página dupla de capa** — nome da família, capa, índice dos capítulos
- **Árvore genealógica** — até 6 níveis (de «eu» até tataravós)
- **Pessoas** — página dupla por pessoa, navegação entre elas
- **História, Fotos, Outros materiais** — capítulos com hipertexto e páginas duplas
- **Fotos interativas** — zonas clicáveis (rect/polygon) → link para a pessoa
- **Multilíngue** — russo, inglês, alemão, francês, espanhol, italiano, português, holandês, ucraniano, polonês; o idioma escolhido é salvo
- **Configurações** — cor das páginas e idioma em localStorage (uma «configuração» para tudo)
- **Interface responsiva** — confortável em tablets e desktops

## Configuração para sua família

- **Sobrenome e identidade** — em `src/lib/constants/owner.ts` defina `FAMILY_SURNAME`. O título do livro («Genealogia da família …») e a descrição são gerados a partir dele em todas as localidades.
- **Dados** — em um único arquivo `src/data/data.json` ficam as seções `persons`, `pages`, `photos`, `history`; nomes e textos são seus, sem vínculo com um sobrenome específico no código.
- **Raiz da árvore** — em `src/lib/constants/chapters.ts` defina `ROOT_PERSON_ID` (a pessoa «eu»).

## Início rápido

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) — a página inicial abrirá na localidade selecionada (por padrão redireciona para `/ru`). O idioma é alterado pelo botão no canto superior direito (ao lado da escolha da cor das páginas).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Execução em modo de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run start` | Execução do build de produção |
| `npm run test` | Execução dos testes |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Cobertura de código (limites 90% / branches 79%) |
| `npm run type-check` | Verificação de tipos TypeScript |
| `npm run lint` | Verificação ESLint |

## Estrutura do projeto

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   └── [locale]/                # Locales: /ru, /en, ...
│       ├── layout.tsx           # I18nProvider, SetDocumentLang
│       ├── page.tsx             # Home (página dupla de capa)
│       └── chapter/[slug]/      # Capítulos: /ru/chapter/family-tree, ...
├── components/
│   ├── book/                    # BookLayout, BookSpread, SpreadNavigation, TitleSpread, TocBookmark
│   ├── content/                 # RichText, ContentBlocks, ImageWithHotspots, PersonCard
│   ├── tree/                    # FamilyTree, TreeNode
│   └── ui/                      # NavButton, PageColorPicker, LocaleSwitcher
├── data/
│   └── data.json                # Arquivo único de dados: persons, pages, photos, history
├── lib/
│   ├── constants/               # chapters, routes, owner, storage
│   ├── i18n/                    # locales, messages, useLocaleRoutes
│   ├── data/                    # persons, pages, spreads
│   ├── types/
│   └── utils/
├── hooks/
│   ├── useSpreadState.ts
│   └── useClickOutside.ts
└── middleware.ts                # Redireciona / e /chapter/* para /{locale}/...
```

## Dados

Todos os dados da aplicação ficam em **um único** arquivo **`src/data/data.json`** (seções: `persons`, `pages`, `photos`, `history`). No painel administrativo é possível copiar ou baixar um único JSON — ele tem a mesma estrutura. Para atualizar os dados no projeto, salve o arquivo baixado como `src/data/data.json` (substitua o arquivo).

### Pessoas (`data.json` → `persons`)

Suas pessoas: id, nome, anos, local de nascimento, profissão, `parentIds` para montar a árvore. O sobrenome no título do livro vem do arquivo de configuração, não desses registros.

```json
{
  "id": "person-1",
  "name": "João Pedro Silva",
  "birthYears": "1925–1998",
  "birthPlace": "São Paulo",
  "occupation": "professor",
  "parentIds": ["person-2", "person-3"],
  "gender": "m"
}
```

### Páginas duplas (`data.json` → `pages`)

Página esquerda e direita da página dupla com blocos de conteúdo (paragraph, heading, list), imagens e hotspots. O capítulo «Pessoas» é montado a partir da lista de pessoas: uma página dupla = uma pessoa.

### Fotos (`public/photos/` e `data.json` → `photos`)

Crie a pasta `public/photos/` e qualquer estrutura de subpastas (por exemplo `2020/`, `family/`). Coloque as fotos lá (jpg, png, gif, webp). No painel administrativo (aba Photos) elas aparecerão automaticamente após a varredura. Legendas e pessoas nas fotos são salvas na seção `photos` em `data.json`.

## Deploy

### Vercel

Conecte o repositório em [vercel.com](https://vercel.com). O deploy é feito automaticamente a cada push.

### Standalone / Docker

Consulte [DEPLOY.md](DEPLOY.md) (se existir no repositório).

## Especificação

Descrição detalhada: [SPEC.md](SPEC.md) (se existir no repositório).
