import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8">
      <Logo />
      <Button>Adicionar ao carrinho</Button>
    </main>
  );
}
