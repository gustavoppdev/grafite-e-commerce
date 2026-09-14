import { cn } from "cn";
import { siteConfig } from "@/lib/site";

// O logo é só tipografia: caixa alta com espaçamento largo, o único elemento
// "expressivo" num site onde todo o resto é contido.
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-sm uppercase tracking-[0.35em] text-foreground",
        className,
      )}
    >
      {siteConfig.name}
    </span>
  );
}
