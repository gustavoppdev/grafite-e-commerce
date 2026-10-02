import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./errors";

// Frases escritas aqui, não importadas: senão o teste compararia o módulo com ele mesmo.
const GENERIC = "Não foi possível concluir agora. Tente de novo em instantes.";

describe("authErrorMessage", () => {
  it("uses one sentence for unknown email and wrong password", () => {
    expect(
      authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }),
    ).toBe("E-mail ou senha incorretos.");
  });

  // Quebra se alguém "melhorar" a mensagem apontando qual campo está errado (enumeração).
  it("never says which of the two credentials was wrong", () => {
    const message = authErrorMessage({
      code: "INVALID_EMAIL_OR_PASSWORD",
      status: 401,
    }).toLowerCase();

    expect(message).toContain("e-mail ou senha");
    for (const hint of [
      "não encontrado",
      "não cadastrado",
      "não existe",
      "senha incorreta",
      "senha errada",
    ]) {
      expect(message).not.toContain(hint);
    }
  });

  it("tells a banned user the account is blocked, without a reason", () => {
    expect(authErrorMessage({ code: "BANNED_USER", status: 403 })).toBe(
      "Sua conta está bloqueada.",
    );
  });

  it("asks to wait on rate limit, which has a status but no code", () => {
    expect(authErrorMessage({ status: 429 })).toBe(
      "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.",
    );
  });

  it("checks the 429 status before any code", () => {
    expect(
      authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD", status: 429 }),
    ).toBe("Muitas tentativas seguidas. Aguarde um pouco e tente de novo.");
  });

  it.each([
    ["INVALID_EMAIL", 400, "Digite um e-mail válido."],
    ["PASSWORD_TOO_SHORT", 400, "A senha precisa ter pelo menos 8 caracteres."],
    ["PASSWORD_TOO_LONG", 400, "A senha pode ter no máximo 128 caracteres."],
    ["INVALID_SIGN_UP_FIELDS", 400, "Confira os dados do cadastro."],
  ])("translates %s", (code, status, expected) => {
    expect(authErrorMessage({ code, status })).toBe(expected);
  });

  // Se este código chegar (config mudou), não pode virar "e-mail já cadastrado".
  it.each([
    "USER_ALREADY_EXISTS",
    "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
  ])("does not reveal that an account exists (%s)", (code) => {
    expect(authErrorMessage({ code, status: 422 })).toBe(GENERIC);
  });

  // O caso que vai acontecer de verdade um dia: um código novo numa atualização.
  it("falls back to a generic sentence for an unknown code", () => {
    expect(
      authErrorMessage({
        code: "SOME_CODE_FROM_A_FUTURE_VERSION",
        status: 400,
      }),
    ).toBe(GENERIC);
  });

  it("falls back to a generic sentence when there is no code", () => {
    expect(authErrorMessage({ status: 500 })).toBe(GENERIC);
  });

  it("falls back for the cross-origin refusal", () => {
    expect(authErrorMessage({ code: "INVALID_ORIGIN", status: 403 })).toBe(
      GENERIC,
    );
  });

  // Nomes que existem em todo objeto JavaScript, pelo protótipo.
  it.each([
    "toString",
    "constructor",
    "__proto__",
    "hasOwnProperty",
  ])("does not resolve prototype names as codes (%s)", (code) => {
    expect(authErrorMessage({ code, status: 400 })).toBe(GENERIC);
  });
});
