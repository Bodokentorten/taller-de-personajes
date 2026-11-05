/**
 * Punto de entrada del código exclusivo del DJ (generador de PNJ, datos secretos…).
 * Todo lo que se importe desde aquí debe incluir, directa o indirectamente,
 * la cadena centinela: si aparece en dist/, el build de jugador falla.
 */
export { CENTINELA_DJ } from './centinela';

export const descripcion = 'Edición del DJ: generador de PNJ y revisión de fichas (fase 7).';
