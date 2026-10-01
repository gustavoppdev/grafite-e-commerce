export type NavLink = {
  label: string;
  href: string;
};

// Categorias fixas de exemplo. Na Feature 4 (Catálogo) passam a vir do banco.
export const categoryLinks: NavLink[] = [
  { label: "Cadernos", href: "/produtos?categoria=cadernos" },
  { label: "Escrita", href: "/produtos?categoria=escrita" },
  { label: "Mesa", href: "/produtos?categoria=mesa" },
  { label: "Papéis", href: "/produtos?categoria=papeis" },
];

// Links de conta do footer. O footer é igual para todo mundo (não lê a sessão), então lista
// as entradas para quem chega de fora; o header é quem mostra o estado real da conta.
export const accountLinks: NavLink[] = [
  { label: "Entrar", href: "/entrar" },
  { label: "Criar conta", href: "/cadastro" },
  { label: "Minha conta", href: "/conta" },
];
