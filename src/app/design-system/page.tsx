import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { NewsletterForm } from "@/features/demo/components/newsletter-form";

/*
  Referência visual viva da loja. Fica FORA do grupo `(store)`, então não herda
  header nem footer — é uma ferramenta de desenvolvimento, não uma página da loja.

  As demais seções (tipografia, cores, botões, campos, bloco de Produto) entram no
  ticket 03; aqui está só a seção de toast, que é a entrega do ticket 11.
*/

export const metadata = {
  title: "Design system",
  // Mesmo com o 404 em produção, avisamos os buscadores para não indexarem em
  // nenhum ambiente — um preview da Vercel, por exemplo, roda em produção? Não,
  // mas ambientes de teste mudam e essa linha custa nada.
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  /*
    404 em produção: esta página expõe o vocabulário visual e um formulário de teste.
    Nada secreto, mas também não é área da loja — deixar rota interna de pé em produção
    é superfície de ataque de graça, e uma página assim costuma ser o primeiro lugar
    onde alguém procura endpoint esquecido.

    O `NODE_ENV` é fixado pelo Next no build (`production` em `next build`), então esta
    comparação vira constante e a página some do bundle de produção.
  */
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container className="flex flex-col gap-12 py-16">
      <header className="flex flex-col gap-2">
        <h1>Design system</h1>
        <p className="text-meta text-muted-foreground">
          Referência visual da loja. Disponível só em desenvolvimento.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-meta text-muted-foreground uppercase tracking-widest">
          Toast e resultado de action
        </h2>
        <p className="max-w-prose">
          Envie vazio ou com e-mail inválido para ver o erro de campo; use{" "}
          <code className="bg-muted px-1">ana@grafite.test</code> para ver o
          erro geral em toast; qualquer outro e-mail válido mostra o toast de
          sucesso.
        </p>
        <NewsletterForm />
      </section>
    </Container>
  );
}
