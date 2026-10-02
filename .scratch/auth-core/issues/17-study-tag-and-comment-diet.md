# 17 - Tag de estudo e dieta de comentários

Status: open
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

- [ ] `git checkout estudo/auth-core` mostra a versão comentada completa.
- [ ] `estudo/foundation` existe e aponta para o fim da Fundação.
- [ ] Nenhuma decisão de segurança perdeu o seu *porquê* (um comentário curto ou um
      ponteiro para o ADR continua no lugar).
- [ ] Nenhuma mudança de comportamento: `pnpm lint`, `pnpm typecheck`, `pnpm test` e
      `pnpm build` passam, e o diff só toca comentários.

## Comments
