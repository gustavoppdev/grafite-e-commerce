# 16 - Doc de estudo da feature

Status: open
Responsável: Gustavo
Blocked by: 15

## O que

`docs/features/01-auth-core.md`, em pt-BR: o documento que você usa para defender esta
feature numa entrevista.

## Critérios de aceite

- [ ] Registra o que foi **considerado e descartado**, com o custo de cada alternativa —
      não narra o que o código faz.
- [ ] Cada decisão de segurança aparece pelo **ataque** que ela previne.
- [ ] Os números que você escolheu (limites do rate limit, tamanho da secret, tamanho da
      senha) estão lá com a conta que os justifica.
- [ ] O que ficou como dívida consciente está nomeado, com o ticket/feature que resolve.

## Guia

- **A matéria-prima são os `## Comments` dos tickets desta pasta**, não o código. Se um
  ticket ficou sem registro de decisão, é um sinal: ou a decisão foi automática (então não
  vale escrever), ou você a esqueceu (então recupere agora, enquanto está fresca).

- **As decisões desta feature que rendem mais numa conversa técnica:**
  - Login pelo cliente da biblioteca e não por server action, **porque o rate limit mora no
    roteador HTTP**. É uma decisão que contraria o padrão do próprio projeto por um motivo
    concreto — exatamente o tipo de coisa que diferencia quem copiou tutorial de quem
    entendeu. As três alternativas e o custo de cada uma estão na spec.
  - `cookieCache` desligado: uma consulta por requisição em troca de revogação imediata.
  - `requireAdmin` devolvendo 404 em vez de 403.
  - Autorização repetida em toda página/action, com o proxy só como conveniência
    (ADR 0003, CVE-2025-29927).
  - Mensagem única no login (o que o usuário perde, e o que a Feature 2 devolve).
  - Rate limit no banco e não em memória por causa de serverless.
  - Primeiro Admin fora da interface, e `role` nunca vindo de formulário.
  - Sem regra de composição de senha, e o que entra no lugar.
  - Ler a sessão no header tornar as páginas dinâmicas — e isso ser proteção.

- **Escreva o que você erraria de novo.** O `server-only` versus a CLI (tickets 04 e 14) é
  uma cicatriz útil: ela mostra que você entende *por que* a regra do `src/server/` existe e
  onde ela deixa de valer.

- Pode ser curto. Denso e defensável vale mais que longo.

## Comments
