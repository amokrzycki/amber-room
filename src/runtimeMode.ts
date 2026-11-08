export let livingLounge = false;

export function enableLivingLounge(): void {
  livingLounge = true;
}

export function isPlaytest(): boolean {
  return import.meta.env.DEV && livingLounge;
}
