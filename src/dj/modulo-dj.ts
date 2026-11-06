/**
 * Punto de entrada del código exclusivo del DJ (generador de PNJ, revisión de fichas, campaña).
 * Todo lo que se importe desde aquí incluye, directa o indirectamente, la cadena centinela:
 * si aparece en dist/, el build de jugador falla.
 */
export { CENTINELA_DJ } from './centinela';
export { default as Mesa } from './Mesa.svelte';

export const descripcion = 'Edición del DJ: generador de PNJ, revisión de fichas y campaña.';
