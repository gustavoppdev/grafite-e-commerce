# 06 - `error.tsx` e `global-error.tsx`

Status: resolved
Responsável: Claude
Blocked by: 04

## O que

- `src/app/(store)/error.tsx`: mensagem em pt-BR, botão "Tentar novamente" e link para a home. Mantém header/footer (o boundary fica abaixo do layout).
- `src/app/global-error.tsx`: fallback quando o próprio layout raiz quebra; precisa ter `<html>` e `<body>` próprios.
- Registrar o erro no console do servidor/cliente com o `digest`, sem mostrar detalhes técnicos na tela.
- Rota temporária para testar (ex. uma página que lança erro), removida antes do commit final ou mantida só em desenvolvimento.
- Comentários explicando: por que `error.tsx` precisa ser client component, o que é o `digest`, e a diferença entre os dois arquivos.

## Critérios de aceite

- [ ] Erro numa página da loja mostra o boundary com header/footer visíveis.
- [ ] "Tentar novamente" re-renderiza o segmento.
- [ ] Nenhuma mensagem ou stack trace interno aparece para o usuário.
