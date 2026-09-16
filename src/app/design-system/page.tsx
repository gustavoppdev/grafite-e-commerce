import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NewsletterForm } from "@/features/demo/components/newsletter-form";
import { formatPrice } from "@/lib/format";

/*
  Referência visual viva da loja: todo elemento do vocabulário visual num lugar só.
  Fica FORA do grupo `(store)`, então não herda header nem footer — é ferramenta de
  desenvolvimento, não página da loja.

  Serve para três coisas: decidir espaçamento e contraste vendo lado a lado, conferir
  se um token novo não quebrou nada, e ser o lugar onde se testa um componente antes
  de colocá-lo numa tela de verdade.
*/

export const metadata = {
  title: "Design system",
  // Mesmo com o 404 em produção, avisamos os buscadores para não indexarem em
  // nenhum ambiente — preview da Vercel, ambiente de teste futuro, o que aparecer.
  robots: { index: false, follow: false },
};

// Cabeçalho de seção: mesmo tratamento em todas, para a página ter ritmo previsível.
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 border-t pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-meta uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {description && <p className="max-w-prose">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// Nome de classe ou de token no meio do texto. Fundo `muted` para destacar do corpo.
function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted px-1 text-meta">{children}</code>;
}

/*
  As classes de cor são escritas por extenso de propósito.

  O Tailwind varre o código procurando nomes de classe como TEXTO; ele não executa
  nada. Uma classe montada em runtime (`` `bg-${token}` ``) não existe no arquivo e o
  CSS correspondente nunca é gerado — o quadrado sairia transparente. Por isso a lista
  repete `bg-background`, `bg-foreground`... em vez de derivar do nome do token.
*/
const colorTokens = [
  { className: "bg-background", token: "background", use: "fundo da loja" },
  {
    className: "bg-foreground",
    token: "foreground / primary",
    use: "texto, botão principal",
  },
  { className: "bg-muted", token: "muted", use: "placeholder de Produto" },
  {
    className: "bg-muted-foreground",
    token: "muted-foreground",
    use: "texto secundário, Esgotado",
  },
  {
    className: "bg-subtle-foreground",
    token: "subtle-foreground",
    use: "riscado e desabilitado",
  },
  { className: "bg-border", token: "border / input", use: "linhas e bordas" },
  { className: "bg-ring", token: "ring", use: "foco visível" },
  { className: "bg-destructive", token: "destructive", use: "erros" },
];

// Bloco de Produto. Vira componente de verdade em `src/features/products/` na Feature 4;
// aqui é só a forma visual, para acertar proporção e espaçamento antes.
function ProductBlock({
  name,
  cents,
  soldOut = false,
}: {
  name: string;
  cents: number;
  soldOut?: boolean;
}) {
  return (
    <article className="flex flex-col gap-3">
      {/*
        A loja não tem imagens: o Produto é um retângulo `bg-muted` em proporção retrato.
        `aspect-3/4` reserva a altura ANTES de qualquer conteúdo chegar, então a grade
        nunca "pula" (layout shift). É a mesma proporção do skeleton de carregamento.
      */}
      <div className="relative aspect-3/4 w-full bg-muted">
        {soldOut && (
          <span className="absolute bottom-0 left-0 bg-background px-2 py-1 text-meta text-muted-foreground">
            Esgotado
          </span>
        )}
      </div>

      {/* Nome e preço na mesma linha, nas pontas: o olho varre a coluna de preços reta. */}
      <div className="flex justify-between gap-4">
        <h3 className={soldOut ? "text-subtle-foreground" : undefined}>
          {name}
        </h3>
        <p
          className={
            soldOut ? "text-subtle-foreground line-through" : "text-foreground"
          }
        >
          {formatPrice(cents)}
        </p>
      </div>
    </article>
  );
}

export default function DesignSystemPage() {
  /*
    404 em produção: esta página expõe o vocabulário visual e um formulário de teste.
    Nada secreto, mas rota interna de pé em produção é superfície de ataque de graça —
    e uma página assim costuma ser o primeiro lugar onde se procura endpoint esquecido.

    O `NODE_ENV` é fixado pelo Next no build (`production` em `next build`), então esta
    comparação vira constante e a página some do bundle de produção.
  */
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container className="flex max-w-4xl flex-col gap-12 py-16">
      <header className="flex flex-col gap-2">
        <h1>Design system</h1>
        <p className="text-meta text-muted-foreground">
          Referência visual da loja. Disponível só em desenvolvimento.
        </p>
      </header>

      <Section
        title="Tipografia"
        description="Hanken Grotesk, peso 400 na loja inteira. A hierarquia vem de espaço e posição, não de tamanho nem de negrito — por isso os títulos têm o mesmo corpo do texto."
      >
        <dl className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <dt className="text-meta text-subtle-foreground">
              Texto base — 14px (<Code>text-sm</Code>, herdado do body)
            </dt>
            <dd>
              Cadernos de capa dura costurados à mão, com miolo de papel 90g.
            </dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-meta text-subtle-foreground">
              Metadado — 13px (<Code>text-meta</Code>)
            </dt>
            <dd className="text-meta text-muted-foreground">
              Preço na listagem, breadcrumb, rodapé, mensagens de apoio.
            </dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-meta text-subtle-foreground">
              Logo — caixa alta, <Code>tracking</Code> largo
            </dt>
            <dd>
              <Logo />
            </dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-meta text-subtle-foreground">
              Link — sublinhado só no hover, com respiro{" "}
              <Code>underline-offset-4</Code>
            </dt>
            <dd>
              <Link href="/" className="underline-offset-4 hover:underline">
                Voltar para a loja
              </Link>
            </dd>
          </div>
        </dl>
      </Section>

      <Section
        title="Cores"
        description="Só tema claro. Cada token tem um papel; componente nenhum escreve cor em hex."
      >
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {colorTokens.map((color) => (
            <li key={color.token} className="flex flex-col gap-2">
              {/* A borda existe para o quadrado branco (`background`) não sumir no fundo. */}
              <div
                className={`aspect-square w-full border ${color.className}`}
              />
              <div className="flex flex-col">
                <span className="text-meta">{color.token}</span>
                <span className="text-meta text-muted-foreground">
                  {color.use}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Botões"
        description="O principal é contornado e inverte no hover. Passe o mouse e use Tab para ver o hover e o foco visível."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Adicionar à sacola</Button>
          <Button variant="outline">Continuar comprando</Button>
          <Button variant="ghost">Limpar filtros</Button>
          <Button variant="link">Ver detalhes</Button>
          <Button variant="destructive">Cancelar pedido</Button>
          <Button disabled>Indisponível</Button>
        </div>

        {/* Ação principal de uma tela ocupa a largura toda: não há dúvida do que fazer. */}
        <Button className="w-full">Finalizar compra</Button>
      </Section>

      <Section
        title="Campos"
        description="Estado de erro marca a borda e a mensagem. A cor sozinha não pode carregar a informação: quem não distingue vermelho precisa do texto."
      >
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-normal">Nome</Label>
            <Input id="ds-normal" placeholder="Como está no cartão" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-erro">CEP</Label>
            <Input
              id="ds-erro"
              defaultValue="0000"
              aria-invalid
              aria-describedby="ds-erro-msg"
            />
            <p
              id="ds-erro-msg"
              role="alert"
              className="text-meta text-destructive"
            >
              CEP deve ter 8 dígitos.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ds-off">Cupom</Label>
            <Input id="ds-off" defaultValue="INDISPONIVEL" disabled />
          </div>
        </div>
      </Section>

      <Section
        title="Bloco de Produto"
        description="Proporção retrato 3:4, nome e preço embaixo na mesma linha. Esgotado escurece o nome, risca o preço e marca o bloco."
      >
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
          <li>
            <ProductBlock name="Caderno Pauta Fina" cents={12900} />
          </li>
          <li>
            <ProductBlock name="Caneta Tinteiro Média" cents={34900} />
          </li>
          <li>
            <ProductBlock name="Bloco Milimetrado A5" cents={4500} soldOut />
          </li>
          <li>
            <ProductBlock name="Porta-canetas de Latão" cents={189000} />
          </li>
        </ul>
      </Section>

      <Section
        title="Toast e resultado de action"
        description="Erro de campo aparece colado no input; erro geral vira toast. Envie vazio para ver o primeiro, use ana@grafite.test para ver o segundo, e qualquer outro e-mail válido para o toast de sucesso."
      >
        <NewsletterForm />
      </Section>
    </Container>
  );
}
