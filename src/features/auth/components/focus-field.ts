// Foca o campo com erro; a mensagem ligada por `aria-describedby` é lida junto.
export function focusField(form: HTMLFormElement, name: string | undefined) {
  if (!name) return;
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLInputElement) field.focus();
}
