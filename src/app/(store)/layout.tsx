import { StoreShell } from "@/components/layout/store-shell";

/*
  `(store)` é um grupo de rotas: os parênteses somem da URL. `src/app/(store)/page.tsx`
  responde em `/`, não em `/store`. Serve para dar o casco da loja (header e footer)
  só às páginas da loja. O admin e o `/design-system` ficam fora e não herdam nada disso.
*/
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return <StoreShell>{children}</StoreShell>;
}
