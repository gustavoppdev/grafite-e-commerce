import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/config/auth";
import {
  type SignUpInput,
  signInSchema,
  signUpFormSchema,
  signUpSchema,
} from "./schemas";

// Toda recusa confere o campo e a mensagem, não só `success === false`.
function fieldErrors(result: z.ZodSafeParseResult<unknown>) {
  if (result.success)
    throw new Error("expected the schema to reject the input");
  return z.flattenError(result.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
}

function formErrors(result: z.ZodSafeParseResult<unknown>) {
  if (result.success)
    throw new Error("expected the schema to reject the input");
  return z.flattenError(result.error).formErrors;
}

const validSignUp = {
  name: "Ana Souza",
  email: "ana@grafite.test",
  password: "caderno-pautado",
};

describe("signInSchema", () => {
  const valid = { email: "ana@grafite.test", password: "qualquer" };

  it("accepts a filled email and password", () => {
    expect(signInSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty email", () => {
    const result = signInSchema.safeParse({ ...valid, email: "" });
    expect(fieldErrors(result).email).toEqual(["Digite seu e-mail."]);
  });

  it("rejects an email made only of spaces as empty, not as malformed", () => {
    const result = signInSchema.safeParse({ ...valid, email: "   " });
    expect(fieldErrors(result).email).toEqual(["Digite seu e-mail."]);
  });

  it("rejects a malformed email", () => {
    const result = signInSchema.safeParse({ ...valid, email: "ana@" });
    expect(fieldErrors(result).email).toEqual(["Digite um e-mail válido."]);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({ ...valid, password: "" });
    expect(fieldErrors(result).password).toEqual(["Digite sua senha."]);
  });

  // Quebra se alguém aplicar o mínimo do cadastro no login.
  it("accepts a password shorter than the sign-up minimum", () => {
    const result = signInSchema.safeParse({ ...valid, password: "curta" });
    expect(result.success).toBe(true);
  });

  it("rejects a password longer than the server accepts", () => {
    const result = signInSchema.safeParse({
      ...valid,
      password: "a".repeat(PASSWORD_MAX_LENGTH + 1),
    });
    expect(fieldErrors(result).password).toEqual([
      `Use no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
    ]);
  });

  it("normalizes the email before validating", () => {
    const result = signInSchema.parse({
      ...valid,
      email: "  Ana@Grafite.TEST ",
    });
    expect(result.email).toBe("ana@grafite.test");
  });

  it("keeps spaces in the password", () => {
    const result = signInSchema.parse({ ...valid, password: " com espaço " });
    expect(result.password).toBe(" com espaço ");
  });
});

describe("signUpSchema", () => {
  it("accepts a valid sign-up", () => {
    expect(signUpSchema.parse(validSignUp)).toEqual(validSignUp);
  });

  // Borda exata dos limites: um caractere antes e um depois.
  describe("password length", () => {
    it("asks for a password when it is empty, before the minimum message", () => {
      const result = signUpSchema.safeParse({ ...validSignUp, password: "" });
      expect(fieldErrors(result).password?.[0]).toBe("Crie uma senha.");
    });

    it("accepts exactly the minimum", () => {
      const password = "a".repeat(PASSWORD_MIN_LENGTH);
      expect(signUpSchema.safeParse({ ...validSignUp, password }).success).toBe(
        true,
      );
    });

    it("rejects one below the minimum", () => {
      const password = "a".repeat(PASSWORD_MIN_LENGTH - 1);
      const result = signUpSchema.safeParse({ ...validSignUp, password });
      expect(fieldErrors(result).password).toEqual([
        `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      ]);
    });

    it("accepts exactly the maximum", () => {
      const password = "a".repeat(PASSWORD_MAX_LENGTH);
      expect(signUpSchema.safeParse({ ...validSignUp, password }).success).toBe(
        true,
      );
    });

    it("rejects one above the maximum", () => {
      const password = "a".repeat(PASSWORD_MAX_LENGTH + 1);
      const result = signUpSchema.safeParse({ ...validSignUp, password });
      expect(fieldErrors(result).password).toEqual([
        `Use no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
      ]);
    });
  });

  describe("name", () => {
    it("rejects an empty name", () => {
      const result = signUpSchema.safeParse({ ...validSignUp, name: "" });
      expect(fieldErrors(result).name).toEqual(["Digite seu nome."]);
    });

    it("rejects a name made only of spaces", () => {
      const result = signUpSchema.safeParse({ ...validSignUp, name: "    " });
      expect(fieldErrors(result).name).toEqual(["Digite seu nome."]);
    });

    it("trims the name", () => {
      const result = signUpSchema.parse({
        ...validSignUp,
        name: "  Ana Souza  ",
      });
      expect(result.name).toBe("Ana Souza");
    });

    it("accepts exactly the maximum length", () => {
      const name = "a".repeat(NAME_MAX_LENGTH);
      expect(signUpSchema.safeParse({ ...validSignUp, name }).success).toBe(
        true,
      );
    });

    it("rejects one above the maximum length", () => {
      const name = "a".repeat(NAME_MAX_LENGTH + 1);
      const result = signUpSchema.safeParse({ ...validSignUp, name });
      expect(fieldErrors(result).name).toEqual([
        `Use no máximo ${NAME_MAX_LENGTH} caracteres.`,
      ]);
    });

    it("accepts accents, apostrophes and hyphens", () => {
      const name = "Joana D'Ávila-Conceição";
      expect(signUpSchema.parse({ ...validSignUp, name }).name).toBe(name);
    });

    // O ataque: "\r\nBcc: ..." no nome, que depois entra no assunto de um e-mail.
    it.each([
      ["line break", "Ana\r\nBcc: todos@exemplo.invalido"],
      ["tab", "Ana\tSouza"],
      ["null byte", "Ana\u0000Souza"],
    ])("rejects a control character (%s)", (_label, name) => {
      const result = signUpSchema.safeParse({ ...validSignUp, name });
      expect(fieldErrors(result).name).toEqual([
        "Use apenas letras, espaços e pontuação comum.",
      ]);
    });
  });

  it("normalizes the email before validating", () => {
    const result = signUpSchema.parse({
      ...validSignUp,
      email: " Ana@Grafite.TEST",
    });
    expect(result.email).toBe("ana@grafite.test");
  });

  // O schema do servidor descarta `confirmPassword`.
  it("does not output confirmPassword", () => {
    const result = signUpSchema.parse({ ...validSignUp, confirmPassword: "x" });
    expect(result).not.toHaveProperty("confirmPassword");
  });

  it("has no confirmPassword in its type", () => {
    // @ts-expect-error -- se `confirmPassword` entrar no tipo, esta linha deixa de ser erro
    // e o `pnpm typecheck` falha por causa do `@ts-expect-error` sem uso.
    const input: SignUpInput = { ...validSignUp, confirmPassword: "x" };
    expect(input).toBeDefined();
  });
});

describe("signUpFormSchema", () => {
  const validForm = { ...validSignUp, confirmPassword: validSignUp.password };

  it("accepts matching passwords", () => {
    expect(signUpFormSchema.safeParse(validForm).success).toBe(true);
  });

  it("puts the mismatch error on confirmPassword, not on the whole form", () => {
    const result = signUpFormSchema.safeParse({
      ...validForm,
      confirmPassword: "outra-senha",
    });
    expect(fieldErrors(result).confirmPassword).toEqual([
      "As senhas não são iguais.",
    ]);
    expect(formErrors(result)).toEqual([]);
    expect(fieldErrors(result).password).toBeUndefined();
  });

  it("rejects an empty confirmation", () => {
    const result = signUpFormSchema.safeParse({
      ...validForm,
      confirmPassword: "",
    });
    expect(fieldErrors(result).confirmPassword).toContain(
      "Confirme sua senha.",
    );
  });

  it("keeps the core rules", () => {
    const result = signUpFormSchema.safeParse({ ...validForm, name: "  " });
    expect(fieldErrors(result).name).toEqual(["Digite seu nome."]);
  });
});
