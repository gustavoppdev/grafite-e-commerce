# 17 - Tag de estudo e dieta de comentários

Status: resolved
Responsável: Claude
Blocked by: 16

## O que

Fechar a feature deixando a `main` com cara de projeto profissional, sem perder a versão
de estudo (decisão de 2026-10-02, ver AGENTS.md e roadmap).

- `git tag estudo/auth-core` no commit do ticket 16, enviada ao GitHub.
- `git tag estudo/foundation` no commit `266c622` (fim da Fundação), que o módulo 00 do
  material de estudo cita.
- Um commit que enxuga os comentários do código para uma ou duas linhas com o *porquê*:
  decisões que não são óbvias e motivos de segurança ficam; explicação de aula sai, porque
  agora mora no doc de estudo e na tag.
- Não mexe em tickets, spec nem ADRs.

## Critérios de aceite

- [x] `git checkout estudo/auth-core` mostra a versão comentada completa.
- [x] `estudo/foundation` existe e aponta para o fim da Fundação.
- [x] Nenhuma decisão de segurança perdeu o seu *porquê* (um comentário curto ou um
      ponteiro para o ADR continua no lugar).
- [x] Nenhuma mudança de comportamento: `pnpm lint`, `pnpm typecheck`, `pnpm test` e
      `pnpm build` passam, e o diff só toca comentários.

## Comments

### 2026-10-02 — Claude

**Tags** (anotadas, enviadas ao GitHub):
- `estudo/foundation` → `266c622` (docs: close the foundation feature)
- `estudo/auth-core` → `e7dac26` (fechamento do ticket 16, última versão comentada)

**Dieta:** 59 arquivos, comentários de **1.499 → ~350 linhas** (+308/−1.639 no diff). Ficou
o *porquê* de cada decisão não óbvia e de cada medida de segurança, em uma a três linhas,
com ponteiro para ADR quando existe. Saíram a explicação de aula (agora no material de
estudo e na tag), referências a ticket/feature e narrativa de medição.

**Fora da dieta, de propósito:**
- `prisma/migrations/*`: migration aplicada é imutável (o Prisma guarda o checksum).
- `.env.example`: os comentários são instrução de configuração para quem clona.
- Tickets, spec, ADRs, `docs/structure.md`.

**Como foi provado que só comentários mudaram:** um verificador
(`same-code.mjs`, no scratchpad da sessão) que, para cada arquivo do diff, compara a árvore
sintática do TypeScript da versão anterior e da nova, ignorando comentários (inclusive
`{/* */}` vazios no JSX) e espaços do JSX. Para o `schema.prisma`, compara as linhas sem
`//`. Testado nos dois sentidos antes do uso: comentário novo passa, `export const x = 1`
é acusado. Resultado: "só comentários mudaram" nos 59 arquivos. Um bug do próprio
verificador apareceu no caminho (caminhos com parênteses, como `(admin)`, quebravam o
comando do shell e eram pulados como "novos"); corrigido e tudo conferido de novo.

Depois: `pnpm lint`, `typecheck`, `test` (104), `prisma validate` e `build` passam.
