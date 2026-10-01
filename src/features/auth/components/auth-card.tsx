import { cn } from "cn";

/*
  Casca das telas de autenticação (`/entrar` e `/cadastro`): título, uma linha de apoio,
  o formulário e um rodapé com o link para a outra tela. As duas ficam com a mesma
  largura, o mesmo ritmo e o mesmo lugar para cada coisa.

  Coluna estreita e centrada: um formulário curto esticado na largura da página fica com
  campos de 1000px para digitar um e-mail, e o olho perde a linha.
*/
export function AuthCard({
  title,
  description,
  footer,
  children,
  className,
}: {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-16 sm:py-24",
        className,
      )}
    >
      <div className="flex flex-col gap-2 text-center">
        <h1>{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {children}

      <div className="border-t pt-6 text-center text-muted-foreground">
        {footer}
      </div>
    </div>
  );
}
