# 02 - `safeRedirectPath` e testes

Status: resolved
Responsável: ~~Gustavo~~ Claude
Blocked by: -

## O que

Uma função pura que recebe o valor cru do parâmetro `?next=` e devolve um caminho seguro
para redirecionar depois do login, ou um padrão quando o valor não é confiável.

- `src/lib/safe-redirect.ts` — `safeRedirectPath(value: unknown, fallback = "/conta"): string`
- `src/lib/safe-redirect.test.ts` — os testes

Quem vai usar: a página `/entrar` (ticket 08), lendo `?next=`, e depois a Feature 6, quando
"adicionar ao carrinho" mandar o Visitante fazer login e voltar para o Produto (ADR 0002).

## Critérios de aceite

- [x] Caminho interno comum (`/conta/pedidos`, com query e com hash) passa intacto.
- [x] Todo valor da lista de ataques abaixo cai no `fallback`.
- [x] `undefined`, `null`, string vazia, número e array caem no `fallback`.
- [x] Um teste por caso, nome descritivo em inglês.
- [x] `pnpm test` passa e a suíte foi verificada por sabotagem (ver Guia).

## Guia

### O ataque que isso previne

**Open redirect.** O link que você manda para a vítima é do seu domínio de verdade — ela
confere, está certo:

```
https://grafite.vercel.app/entrar?next=https://grafite-1ogin.com/conta
```

Ela entra com a senha certa, no site certo. E o nosso código, obediente, redireciona para o
domínio do atacante — que mostra uma página igualzinha dizendo "sessão expirada, entre de
novo". Ela digita a senha outra vez, agora no site dele.

Dois agravantes: o `Referer` pode levar dados da nossa URL para o destino, e o link tem
credibilidade real porque o domínio é o nosso. É por isso que o valor de `?next=` é
**entrada de usuário**, exatamente como o corpo de um formulário.

### Os valores que você tem que recusar

Não invente a lista, use esta — cada linha é um jeito diferente de escapar do site, e vários
passam por uma checagem ingênua do tipo "começa com `/`":

| Valor | Por que é perigoso |
|---|---|
| `https://exemplo.invalido` | absoluto, óbvio |
| `//exemplo.invalido` | URL relativa ao protocolo: o navegador trata como `https://exemplo.invalido`, e **começa com `/`** |
| `/\exemplo.invalido` | vários navegadores tratam `\` como `/` |
| `\\exemplo.invalido` | idem, sem barra nenhuma |
| `https:/exemplo.invalido` | uma barra só; navegador "conserta" |
| `javascript:alert(1)` | não é navegação, é execução de script |
| `data:text/html,<script>...` | idem |
| `/%2f%2fexemplo.invalido` | escapado; cuidado com decodificação dupla |
| `/conta@exemplo.invalido` | o que vem antes do `@` numa URL é usuário, não host |
| `next` (sem barra) | caminho relativo: resolve em cima da página atual |

### Como abordar

- **Lista de permissão, não lista de proibição.** Enumerar o que é proibido é uma corrida
  que você perde: sempre falta um caso. A pergunta certa não é "isso é perigoso?", é
  "**isso é um caminho interno?**". Um caminho interno tem uma forma muito estreita —
  descreva essa forma e recuse todo o resto.
- Comece pelo tipo: o valor vem de `searchParams` e pode ser `string | string[] | undefined`.
  Se não é `string`, já acabou.
- Cuidado com `new URL(value, base)`: ele **resolve** o valor contra a base e devolve algo
  que parece do nosso domínio mesmo quando não é. Se você usar, olhe o resultado com
  atenção: `new URL("//exemplo.invalido", "https://grafite.app").href` dá o quê? Rode no
  `node` antes de decidir. Ele pode fazer parte da solução, mas não é a solução sozinho.
- Decida e **registre no comentário** o que fazer com um caminho que é interno mas você não
  reconhece (ex. `/admin` para um Cliente). Redirecionar e deixar a autorização barrar, ou
  voltar ao `fallback`? Qual dos dois erra de forma mais segura?
- Decida se o valor pode ser normalizado (tirar barras repetidas, decodificar) ou se é
  melhor recusar o que não está exatamente na forma esperada. Normalizar é onde mora a
  maioria dos bypasses de verdade.

### Sobre os testes

- **Onde se inspirar:** `src/lib/format.test.ts` — mesmo formato de `describe`/`it`.
- Um `it` por linha da tabela, com o valor no nome do teste. Uma pessoa lendo a lista de
  testes que falham tem que saber qual ataque voltou a passar.
- **Sabote a suíte** antes de considerar pronta, como você fez no ticket 14 da Fundação:
  troque a sua checagem por `value.startsWith("/")` e conte quantos testes falham. Se não
  falharem pelo menos os quatro primeiros da tabela, a suíte não está testando o que importa.
- Não teste o `fallback` só com o padrão: passe um `fallback` diferente em um teste, senão
  você nunca descobre se o parâmetro é usado.

## Comments

### 2026-09-28 — Claude: virou exemplo trabalhado

Gustavo travou depois de duas rodadas de dicas e pediu a solução para estudar e refazer
depois. Mesmo caminho do ticket 01: o ticket passa a ser exemplo trabalhado.

Decisões, todas explicadas nos comentários de `src/lib/safe-redirect.ts`:

- **Forma estreita (regex de lista de permissão)**: uma barra, 2º caractere que não seja
  `/` nem `\`, e daí em diante só caracteres de caminho ASCII. `@`, `\`, `:`, espaço e
  controle ficam de fora.
- **Não decodifica**: recusa `%2f`, `%5c` e `%25`. Validar a mesma string que será usada;
  o `searchParams` já decodificou uma vez, então barra codificada aqui é ataque.
- **`new URL` como segunda opinião**, não como regra principal.
- **Caminho interno desconhecido passa**: a autorização da página decide (ADR 0003).

Sabotagem com `value.startsWith("/")`: 11 de 31 testes falham, incluindo `//`, `/\`,
`/%2f%2f` e `@` da tabela.

**Para refazer:** apague o corpo da função e os comentários, mantenha os testes, e
reescreva até ficar verde. Depois compare com esta versão.
