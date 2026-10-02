// Quem é Admin, num lugar só: usado pela sessão e pelo script de promover.

export type Role = "user" | "admin";

// Mesma leitura do plugin admin (papéis separados por vírgula). Qualquer outro valor vira
// "user": na dúvida, o menor privilégio.
export function toRole(role: string | null | undefined): Role {
  const roles = (role ?? "").split(",").map((r) => r.trim());
  return roles.includes("admin") ? "admin" : "user";
}
