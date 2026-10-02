import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NewsletterForm } from "@/features/demo/components/newsletter-form";
import { formatPrice } from "@/lib/format";

// Referência visual da loja (ferramenta de desenvolvimento, fora do grupo `(store)`).

export const metadata = {
  title: "Design system",
  // Não indexar em nenhum ambiente (preview incluído), mesmo com o 404 em produção.
  robots: { index: false, follow: false },
};

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

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted px-1 text-meta">{children}</code>;
}

// Classes por extenso: o Tailwind lê o código como texto, e `bg-${token}` montado em
// runtime nunca geraria o CSS.
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

// Só a forma visual do Produto; o componente de verdade vem com o catálogo.
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
      {/* `aspect-3/4` reserva a altura antes do conteúdo: a grade não pula (layout shift). */}
      <div className="relative aspect-3/4 w-full bg-muted">
        {soldOut && (
          <span className="absolute bottom-0 left-0 bg-background px-2 py-1 text-meta text-muted-foreground">
            Esgotado
          </span>
        )}
      </div>

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
  // 404 em produção: rota interna no ar é superfície de ataque de graça. O `NODE_ENV` é
  // constante no build, então a página some do bundle.
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
