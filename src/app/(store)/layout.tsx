import { StoreShell } from "@/components/layout/store-shell";

// Grupo de rotas (não aparece na URL): header e footer só nas páginas da loja.
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return <StoreShell>{children}</StoreShell>;
}
