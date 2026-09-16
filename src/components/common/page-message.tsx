import { cn } from "cn";

// Mensagem centralizada para páginas de estado: erro, não encontrado, vazio.
// Mesmo tom e mesmo espaçamento em todas, sem cada página reinventar o layout.
export function PageMessage({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h1>{title}</h1>
        <p className="max-w-sm text-muted-foreground">{description}</p>
      </div>
      {children && (
        <div className="flex flex-col items-center gap-3">{children}</div>
      )}
    </div>
  );
}
