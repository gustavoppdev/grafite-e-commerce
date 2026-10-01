import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { requireAdmin } from "@/server/session";

/*
  O título vem de `generateMetadata`, e não de um `metadata` fixo, pelo mesmo motivo do
  layout: o Next resolve os metadados em paralelo com a página, e um título fixo
  "Administração" ia parar no payload da 404 de quem não é Admin. Aqui ele só é devolvido
  depois da checagem.
*/
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Administração", robots: { index: false } };
}

/*
  `requireAdmin()` aqui, na página, e não no layout (ver o comentário do layout).
  Visitante e Cliente recebem 404, e não 403: um 403 confirmaria que existe uma área de
  administração neste endereço. A recusa de alguém logado fica registrada no log do
  servidor (`src/server/session.ts`).
*/
export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <Container className="flex flex-col gap-2 py-16">
      <h1>Olá, {admin.name}</h1>
      <p className="text-muted-foreground">
        As ferramentas de catálogo, pedidos e clientes chegam nas próximas
        etapas.
      </p>
    </Container>
  );
}
