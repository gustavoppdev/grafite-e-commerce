# 16 - Doc de estudo da feature

Status: resolved
Responsável: Claude
Blocked by: 15

## O que

O material de estudo do módulo, em `~/Documentos/grafite-estudo/01-auth-essencial/`, no
formato do da Fundação (AGENTS.md, decisão de 2026-10-01, que substituiu o
`docs/features/01-auth-core.md` que este ticket previa). O resumo para entrevista é o
capítulo 12.

## Critérios de aceite

- [x] Registra o que foi **considerado e descartado**, com o custo de cada alternativa —
      não narra o que o código faz. (Cap. 12, seção 1, e em cada capítulo.)
- [x] Cada decisão de segurança aparece pelo **ataque** que ela previne. (README do módulo:
      tabela ataque → onde está fechado → capítulo.)
- [x] Os números escolhidos estão lá com a conta que os justifica. (Cap. 12, seção 2.)
- [x] O que ficou como dívida consciente está nomeado, com o módulo que resolve. (Cap. 12,
      seção 3.)

## Comments

### 2026-10-02 — Claude

**Pasta reorganizada por módulo** (pedido do Gustavo):

```
~/Documentos/grafite-estudo/
├── README.md            índice geral, como usar, tags de estudo, aviso
├── 00-fundacao/         os 10 capítulos da Fundação (movidos) + README do módulo
└── 01-auth-essencial/   README (ataques, índice, roteiro de reconstrução) + 12 capítulos
```

O README da Fundação virou índice do módulo; "Como usar" e o aviso foram para o README geral.
O capítulo 10 da Fundação ganhou uma nota sobre o `postinstall` pulado pelo cache (achado do
ticket 15).

**Capítulos do módulo 01:** 01 sessão e cookie · 02 tabelas e banco exposto · 03 do
formulário ao servidor · 04 enumeração · 05 telas · 06 open redirect · 07 autorização ·
08 proxy · 09 rate limit · 10 primeiro Admin · 11 deploy · 12 decisões para defender.

Cada capítulo segue o formato da Fundação (conceito → GRAFITE → armadilhas → para outros
projetos → teste seu entendimento). A matéria-prima foram os Comments dos tickets 01–15, a
spec e os ADRs 0003 e 0005; os trechos de código foram conferidos contra os arquivos atuais.

**Roteiro de reconstrução** no README do módulo: os 15 passos na ordem dos tickets, cada um
com o "confira" que prova que funcionou (pedido do AGENTS.md: o doc tem que servir de guia
para refazer o módulo isolado).

**Os docs citam as tags `estudo/foundation` e `estudo/auth-core`.** A segunda é do ticket
17; a primeira também entra lá (no commit `266c622`, fim da Fundação), para o módulo 00
apontar para a versão do código que ele descreve.
