import { cn } from "cn";

// Largura máxima e respiro lateral num lugar só: header, páginas e footer alinham
// pela mesma borda sem cada um repetir `mx-auto max-w-... px-...`.
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    />
  );
}
