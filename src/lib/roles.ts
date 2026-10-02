/*
  Quem é Admin, decidido num lugar só. Usam esta função: a sessão (`src/server/session.ts`)
  e o script que promove Admin (`scripts/promote-admin.ts`). Se cada um lesse o papel do
  seu jeito, o script poderia dizer "já é Admin" para alguém que a loja trata como Cliente.
*/

export type Role = "user" | "admin";

/*
  O plugin admin guarda o papel como texto, e aceita vários separados por vírgula
  ("admin,user"). Conferimos do mesmo jeito que ele (`plugins/admin/routes.mjs`), senão o
  plugin e a loja discordariam sobre quem é Admin. Qualquer outro valor — inclusive
  `null` — vira "user": na dúvida, o menor privilégio.
*/
export function toRole(role: string | null | undefined): Role {
  const roles = (role ?? "").split(",").map((r) => r.trim());
  return roles.includes("admin") ? "admin" : "user";
}
