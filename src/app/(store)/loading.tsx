import { ProductGridSkeleton } from "@/components/layout/product-grid-skeleton";

/*
  `loading.tsx` é um atalho: o Next envolve as páginas deste segmento num
  <Suspense fallback={<Loading />}>. Enquanto a página espera dados no servidor,
  o header e o footer (do layout) aparecem na hora e só o miolo mostra o skeleton.

  Hoje a loja só tem a home, então o skeleton de listagem é genérico. Na Feature 4
  ele vai para a rota de produtos, e cada página ganha um skeleton com o seu formato.

  Atenção a um efeito colateral (testado): com loading.tsx, as páginas abaixo daqui são
  enviadas em partes (streaming) e o status HTTP já sai como 200. Se uma delas chamar
  `notFound()`, a tela de 404 aparece, mas o status continua 200, mesmo que a chamada
  seja imediata. O Next adiciona `noindex` para buscadores não indexarem a página.
  URLs que não existem continuam respondendo 404 de verdade (não passam por aqui).
*/
export default function StoreLoading() {
  return <ProductGridSkeleton />;
}
