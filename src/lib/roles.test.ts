import { describe, expect, it } from "vitest";
import { toRole } from "./roles";

describe("toRole", () => {
  it("reconhece o Admin, sozinho ou junto de outros papéis", () => {
    expect(toRole("admin")).toBe("admin");
    expect(toRole("user,admin")).toBe("admin");
    expect(toRole("user, admin")).toBe("admin");
  });

  it("cai para Cliente em qualquer outro valor", () => {
    expect(toRole("user")).toBe("user");
    expect(toRole(null)).toBe("user");
    expect(toRole(undefined)).toBe("user");
    expect(toRole("")).toBe("user");
  });

  // Comparação exata: um papel que só PARECE admin não pode virar admin.
  it("não aceita variações de grafia", () => {
    expect(toRole("Admin")).toBe("user");
    expect(toRole("administrator")).toBe("user");
    expect(toRole("superadmin")).toBe("user");
  });
});
