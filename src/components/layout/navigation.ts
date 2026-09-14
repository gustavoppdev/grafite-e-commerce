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
