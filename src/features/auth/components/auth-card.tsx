import { cn } from "cn";

// Casca de `/entrar` e `/cadastro`: coluna estreita, alinhada pelo topo (centralizada, cada
// mensagem de erro faria título e campos subirem).
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
  // Permite focar o título por script (`tabIndex={-1}`) sem pô-lo na ordem do Tab.
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
