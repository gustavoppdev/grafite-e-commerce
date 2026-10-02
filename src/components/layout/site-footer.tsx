import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Container } from "./container";
import { Logo } from "./logo";
import { accountLinks, categoryLinks, type NavLink } from "./navigation";

const columns: { id: string; title: string; links: NavLink[] }[] = [
  { id: "footer-loja", title: "Loja", links: categoryLinks },
  { id: "footer-conta", title: "Conta", links: accountLinks },
];

export function SiteFooter() {
  // Calculado no servidor. Como a página é estática, o valor é fixado no build;
  // cada deploy atualiza. Para um ano de copyright, isso basta.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t text-meta text-muted-foreground">
      <Container className="grid gap-10 py-12 md:grid-cols-4">
        <div className="flex flex-col gap-3 md:col-span-2">
          <Logo />
          <p className="max-w-xs">{siteConfig.description}</p>
        </div>

        {columns.map((column) => (
          // `aria-labelledby` dá ao <nav> o nome do título visível: o leitor de tela
          // anuncia "navegação Loja" em vez de só "navegação", que se repetiria.
          <nav key={column.id} aria-labelledby={column.id}>
            <h2 id={column.id} className="mb-3 text-foreground">
              {column.title}
            </h2>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <Container className="flex flex-col gap-1 border-t py-6 md:flex-row md:justify-between">
        <p>
          © {year} {siteConfig.name}
        </p>
        <p>
          Loja fictícia, projeto de portfólio. Nada é vendido e nenhum pagamento
          real é processado.
        </p>
      </Container>
    </footer>
  );
}
