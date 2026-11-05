import { onDestroy } from 'svelte';
import type { Personaje } from '../motor/personaje';
import { biblioteca } from './biblioteca.svelte';

/**
 * Guarda el personaje en la biblioteca poco después de cada cambio, y lo que quede pendiente al salir
 * de la vista (para no perder el último cambio al navegar). Llamar al iniciar un componente.
 */
export function autoguardar(obtener: () => Personaje, espera = 300) {
  let pendiente = false;
  $effect(() => {
    const p = obtener();
    JSON.stringify(p); // lee todo el objeto para seguir los cambios en profundidad
    pendiente = true;
    const t = setTimeout(() => {
      biblioteca.actualizar(p);
      pendiente = false;
    }, espera);
    return () => clearTimeout(t);
  });
  onDestroy(() => {
    if (pendiente) biblioteca.actualizar(obtener());
  });
}
