import { Container } from "@/components/layout/container";

export default function HomePage() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
      <h1>Papelaria fina</h1>
      <p className="text-meta text-muted-foreground">
        Cadernos, escrita e objetos de mesa.
      </p>
    </Container>
  );
}
