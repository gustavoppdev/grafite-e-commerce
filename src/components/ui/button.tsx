import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/*
  O estilo da loja mora aqui, nas variantes, e não em classes repetidas em cada tela.
  Quem usa escreve só `<Button>` ou `<Button variant="ghost">`; se o visual mudar,
  muda neste arquivo e o site inteiro acompanha.

  O foco visível vem do `:focus-visible` global em `globals.css`, por isso não há
  `outline-none` nem anéis de foco próprios aqui.
*/
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-normal whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Botão principal da loja: contorno fino que inverte no hover (referência: therow.com).
        default:
          "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background aria-expanded:bg-foreground aria-expanded:text-background",
        // Contorno discreto para ações secundárias ao lado do principal.
        outline:
          "border-border bg-background hover:border-foreground aria-expanded:border-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        ghost: "hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "border-destructive bg-transparent text-destructive hover:bg-destructive hover:text-background",
        link: "h-auto px-0 text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        xs: "h-7 gap-1 px-2.5 text-meta [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 text-meta [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-8",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
