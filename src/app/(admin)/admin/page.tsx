import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { requireAdmin } from "@/server/session";

// Título só depois da checagem: um `metadata` fixo iria no payload da 404.
export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Administração", robots: { index: false } };
}

// A proteção é aqui, na página (404 para quem não é Admin).
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
