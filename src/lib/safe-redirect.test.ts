import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

/*
  Cada teste afirma o valor EXATO que sai. `expect(result).not.toBe(...)` passaria com a
  função devolvendo `https://exemplo.invalido`, ou seja, não testaria nada.
*/
describe("safeRedirectPath", () => {
  describe("keeps internal paths intact", () => {
    it.each([
      "/",
      "/conta",
      "/conta/pedidos",
      "/conta/pedidos?pagina=2",
      "/conta/pedidos#ultimo",
      "/produtos/caderno-a5?cor=grafite&tamanho=a5#detalhes",
      // `%20` é um espaço codificado: legítimo, não é separador de caminho.
      "/busca?q=caneta%20azul",
    ])("%s", (path) => {
      expect(safeRedirectPath(path)).toBe(path);
    });
  });

  /*
    A tabela do ticket 02, uma linha por teste, com o valor no nome: quem ler a lista de
    falhas sabe qual ataque voltou a passar.
  */
  describe("rejects values that leave the site", () => {
    it.each([
      "https://exemplo.invalido",
      "//exemplo.invalido",
      "/\\exemplo.invalido",
      "\\\\exemplo.invalido",
      "https:/exemplo.invalido",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "/%2f%2fexemplo.invalido",
      "/conta@exemplo.invalido",
      "next",
    ])("%s", (value) => {
      expect(safeRedirectPath(value)).toBe("/conta");
    });
  });

  // Variações que a tabela não lista, mas que derrubam checagens comuns.
  describe("rejects variations of the same attacks", () => {
    it.each([
      // O navegador apaga tab e quebra de linha: vira `//exemplo.invalido`.
      "/\t/exemplo.invalido",
      "/\n/exemplo.invalido",
      "///exemplo.invalido",
      "/%2F%2Fexemplo.invalido",
      "/%5cexemplo.invalido",
      // `%252f` vira `%2f` numa decodificação e `/` na seguinte.
      "/%252f%252fexemplo.invalido",
      "HTTPS://exemplo.invalido",
      " /conta",
    ])("%j", (value) => {
      expect(safeRedirectPath(value)).toBe("/conta");
    });
  });

  describe("falls back on values that are not a string", () => {
    it.each([
      ["undefined", undefined],
      ["null", null],
      ["an empty string", ""],
      ["a number", 42],
      // `?next=/conta&next=/admin` chega como array.
      ["an array", ["/conta"]],
    ])("%s", (_label, value) => {
      expect(safeRedirectPath(value)).toBe("/conta");
    });
  });

  // Sem este teste, um `fallback` ignorado (sempre "/conta") passaria em todos os outros.
  it("uses the fallback it receives", () => {
    expect(safeRedirectPath("//exemplo.invalido", "/produtos")).toBe(
      "/produtos",
    );
  });
});
