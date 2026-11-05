/**
 * Edición compilada. Vite sustituye __EDICION__ por una constante al compilar,
 * así que las ramas `if (ES_DJ)` se eliminan por completo de la edición de jugador.
 */
export const EDICION = __EDICION__;
export const ES_DJ = __EDICION__ === 'dj';

/**
 * Carga perezosa del módulo del DJ. En la edición de jugador la rama es código
 * muerto y el import dinámico (y todo lo que arrastra) no llega al paquete.
 */
export async function cargarModuloDJ() {
  if (__EDICION__ === 'dj') {
    return import('./dj/modulo-dj');
  }
  return null;
}
