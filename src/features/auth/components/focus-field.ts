/*
  Leva o foco a um campo do formulário pelo `name`. Usado depois de um erro: quem navega por
  teclado ou leitor de tela cai direto no campo a corrigir, e a mensagem ligada a ele (pelo
  `aria-describedby`) é lida junto.
*/
export function focusField(form: HTMLFormElement, name: string | undefined) {
  if (!name) return;
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLInputElement) field.focus();
}
