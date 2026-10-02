# Estrutura do projeto

Onde cada coisa mora e por quê. Documento vivo: quando uma feature criar uma pasta ou uma
regra nova, ela é atualizada aqui. (Substitui a seção "Estrutura de pastas" da spec da
Fundação, que ficou como registro do que foi planejado.)

## Árvore

```
src/
├── app/                          rotas: compõem features e componentes, quase sem lógica
│   ├── (store)/                  loja: layout com header e footer
│   │   ├── page.tsx              /
│   │   ├── entrar/  cadastro/    autenticação
│   │   └── conta/                área da pessoa
│   ├── (admin)/                  administração: casca própria, sem o header da loja
│   │   └── admin/
│   ├── api/
│   │   ├── auth/[...all]/        rotas HTTP do better-auth (+ piso de tempo)
│   │   └── health/
│   ├── design-system/            referência visual (404 em produção)
│   ├── layout.tsx  not-found.tsx  global-error.tsx  globals.css
│   └── fonts.ts  fonts/          fonte local (Hanken Grotesk + licença)
├── components/
│   ├── ui/                       gerado pelo shadcn (não editar à toa)
│   ├── common/                   padrões visuais nossos, genéricos (PageMessage)
│   └── layout/                   a casca da loja: header, footer, container, logo
├── features/<feature>/           tudo de UMA feature
│   ├── actions.ts                server actions (`"use server"`)
│   ├── schemas.ts (+ .test.ts)   Zod, roda nos dois lados
│   ├── components/               UI da feature
│   └── ...                       o que mais for só dela (ex.: `auth-client.ts`)
├── server/                       SÓ SERVIDOR: env, db, auth, session
├── config/                       valores do projeto: env.schema, site, limites, headers
├── lib/                          funções puras, sem I/O, testáveis
├── proxy.ts                      redireciona para o login sem consultar nada (conveniência, ADR 0003)
└── generated/                    Prisma Client (gerado, fora do git)
prisma/                           schema.prisma + migrations/
scripts/                          tarefas de operador, rodadas no terminal (`pnpm admin:promote`)
vercel.json                       região das funções (gru1, ao lado do banco em São Paulo)
certs/                            CA do Supabase (pública, usada no TLS)
docs/                             ADRs, este arquivo, instruções dos agentes
.scratch/                         roadmap, specs e tickets de cada feature
```

## Onde cada arquivo novo vai

| Pergunta | Pasta |
|---|---|
| Toca segredo, banco ou rede do lado do servidor? | `server/` |
| É um valor de configuração do projeto (número, texto, lista)? | `config/` |
| É função pura, sem I/O, que roda nos dois lados? | `lib/` |
| Pertence a uma feature só (mesmo sendo UI)? | `features/<feature>/` |
| É peça visual genérica, sem saber de domínio? | `components/common/` |
| É parte da casca da loja (header, footer)? | `components/layout/` |
| É uma URL? | `app/` |
| É tarefa de operador (só quem tem acesso ao banco pode fazer)? | `scripts/` |

Na dúvida entre `features/` e `components/common/`: comece na feature. Só promova para
`common/` quando uma SEGUNDA feature precisar, e aí o formato certo já é conhecido.

## Direção dos imports

```
app/  ──►  features/  ──►  components/ui, components/common, lib/, config/
  │            │
  │            └──►  server/        (actions e Server Components da feature)
  └──►  server/  ──►  lib/, config/
                 └──►  features/<x>/schemas.ts, errors.ts   (só arquivos puros)
components/layout/  ──►  features/   (só para encaixar peças na casca: menu da conta)
```

- **`server/` só é importado por `app/` e `features/`.** Nenhum arquivo de `components/`
  lê sessão ou banco. Quem precisa disso é a feature.
- **`server/` pode importar arquivos PUROS de uma feature** (schema, constante de erro): é
  assim que o `server/auth.ts` impõe no servidor o mesmo `signUpSchema` do formulário. Nunca
  componentes nem actions: o servidor não depende de UI.
- **`components/ui` e `components/common` não importam nada do domínio** (`features/`,
  `server/`). `components/layout` pode importar de `features/` para compor a casca.
- **`lib/` e `config/` não importam nada do projeto.** São as folhas da árvore.
- **`scripts/` não importa `src/server/`.** Um script é outro processo (Node comum, via
  `tsx`), e o `server-only` lançaria erro. Ele monta a própria conexão, com as mesmas
  garantias do `server/db.ts` (TLS validado, timeout), e pode importar `lib/`, `config/` e
  `generated/`. Nada em `src/` importa de `scripts/`.
- Uma feature não importa outra. Se precisar, o pedaço compartilhado sobe para `lib/`,
  `config/` ou `components/common/`.

## Regras que valem em todo lugar

- **`import "server-only"` em todo arquivo de `src/server/`, e em nenhum fora.** A pasta é
  a fronteira de segurança, visível na árvore: se um Client Component importar algo de lá,
  o build quebra antes de o segredo chegar ao navegador.
- **Arquivo com `"use server"` exporta apenas server actions.** Cada função exportada vira
  um endpoint público; um helper exportado por engano viraria endpoint sem ninguém notar.
- **Sem barrel files** (`index.ts` reexportando a pasta): um barrel que junta servidor e
  componente arrasta o servidor para o bundle do navegador.
- **Teste ao lado do código:** `schemas.ts` + `schemas.test.ts`.
- **Autorização na página, não no layout.** Layout não roda de novo a cada navegação e não
  impede as páginas de baixo de rodarem (ADR 0003). Um layout pode checar a MAIS, para não
  renderizar interface restrita (ver `(admin)/layout.tsx`), mas nunca no lugar da página.
- **Tarefa de operador nunca vira rota nem server action.** Promover Admin, por exemplo:
  uma tela para isso teria que funcionar sem ser Admin, ou seja, seria pública.
- **Route handler fino**, com uma exceção aceita: o que age sobre a resposta HTTP pode
  morar nele (o piso de tempo em `api/auth/[...all]/route.ts`), com um ponteiro no arquivo
  de configuração correspondente.

## Grupos de rotas

Um grupo (`(nome)/`) existe quando as rotas dentro dele **compartilham algo**: um
`layout.tsx`, um `loading.tsx`, um `error.tsx`. Pasta só para "organizar" adiciona um nível
sem comportamento.

- `(store)`: header e footer da loja.
- `(admin)`: casca da administração.
- Previsto: `(store)/(auth)/` na Feature 2, quando houver 5 telas de autenticação para
  compartilhar um layout (ver roadmap).

## Nomes

- Arquivos e pastas em `kebab-case`; identificadores em inglês (`signInSchema`,
  `requireUser`).
- Texto de interface e URLs da loja em português (`/entrar`, `/cadastro`, `/conta`).
- Comentários em português, explicando o **porquê**.
