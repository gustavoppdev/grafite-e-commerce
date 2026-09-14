import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "./container";

/*
  O skeleton copia as PROPORÇÕES do conteúdo real (título, blocos retrato de 3:4,
  nome e preço embaixo). Quando os produtos chegam, cada coisa já está no lugar e
  a tela não "pula" (layout shift), o que um spinner no meio da página não evita.

  O grid de 2/3/4 colunas é o mesmo que a listagem da Feature 4 vai usar.
*/
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Container className="flex flex-col gap-8 py-10">
      {/* Anúncio para leitores de tela; os blocos animados são só decoração. */}
      {/* <output> tem papel de "status": o leitor anuncia o texto sem roubar o foco. */}
      <output className="sr-only">Carregando produtos…</output>

      <Skeleton className="h-5 w-40 rounded-none" />

      <ul
        aria-hidden="true"
        className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4"
      >
        {Array.from({ length: count }, (_, index) => (
          // A lista é fixa e nunca reordena, então o índice como key é seguro aqui.
          // biome-ignore lint/suspicious/noArrayIndexKey: itens de placeholder sem identidade própria.
          <li key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-3/4 w-full rounded-none" />
            <div className="flex justify-between gap-4">
              <Skeleton className="h-4 w-2/3 rounded-none" />
              <Skeleton className="h-4 w-12 rounded-none" />
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
