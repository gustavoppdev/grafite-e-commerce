import { cn } from "cn";

/*
  Casca das telas de autenticação (`/entrar` e `/cadastro`): título, uma linha de apoio,
  o formulário e um rodapé com o link para a outra tela. As duas ficam com a mesma
  largura, o mesmo ritmo e o mesmo lugar para cada coisa.

  Coluna estreita e centrada: um formulário curto esticado na largura da página fica com
  campos de 1000px para digitar um e-mail, e o olho perde a linha.

  Alinhada pelo TOPO, com respiro fixo, e não centralizada na vertical. Centralizada,
  cada mensagem de erro que aparece aumenta a altura do bloco, o centro é recalculado e
  tudo sobe junto, inclusive o título e os campos que não mudaram. Pelo topo, a mensagem
  só empurra o que está abaixo dela.
*/
export function AuthCard({
  title,
  description,
  footer,
  children,
  className,
  titleRef,
}: {
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /*
    Para quem troca o conteúdo da tela e precisa levar o foco ao título novo (a confirmação
    do cadastro). Com ela, o título aceita foco por script (`tabIndex={-1}`), mas continua
    fora da ordem do Tab.
  */
  titleRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-sm flex-col gap-8 px-4 py-16 sm:py-24",
        className,
      )}
    >
      <div className="flex flex-col gap-2 text-center">
        <h1
          ref={titleRef}
          tabIndex={titleRef ? -1 : undefined}
          className="outline-none"
        >
          {title}
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {children}

      {footer && (
        <div className="border-t pt-6 text-center text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}
