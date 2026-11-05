// Tiradas de trasfondo (fuente: «Comunidad, Familia, Clase Social y Eventos de Trasfondo»).
import type { Catalogo } from '../datos/catalogo';
import type { FilaD100 } from '../datos/tipos';
import { tirar, type Aleatorio } from './dados';
import type { ResultadoTrasfondo, TablaTrasfondo } from './personaje';

export const TABLAS_TRASFONDO: { id: TablaTrasfondo | 'eventos'; nombre: string }[] = [
  { id: 'padres', nombre: 'Padres' },
  { id: 'hermanos', nombre: 'Hermanos' },
  { id: 'familia_extendida', nombre: 'Familia extendida' },
  { id: 'reputacion', nombre: 'Reputación de la familia' },
  { id: 'conexiones', nombre: 'Conexiones' },
  { id: 'eventos', nombre: 'Evento de trasfondo' },
];

/** Texto de una fila: une sus columnas de texto («Abuelos: … · Tíos: …»). */
export function textoFila(tabla: TablaTrasfondo | 'eventos', f: FilaD100): string {
  if (tabla === 'familia_extendida') {
    return `Abuelos: ${f.abuelos} · Tíos y tías: ${f.tios} · Primos: ${f.primos}`;
  }
  const partes = [f.texto, f.vinculos].filter((x) => typeof x === 'string' && x && x !== '—');
  return partes.join(' · ');
}

export function filaPara(
  cat: Catalogo,
  tabla: TablaTrasfondo | 'eventos',
  d100: number,
): FilaD100 | undefined {
  return cat.trasfondo[tabla].find((f) => d100 >= f.min && d100 <= f.max);
}

export function tirarTrasfondo(
  cat: Catalogo,
  tabla: TablaTrasfondo | 'eventos',
  azar?: Aleatorio,
): ResultadoTrasfondo {
  const t = tirar('1d100', azar).total;
  const f = filaPara(cat, tabla, t);
  return { tirada: t, texto: f ? textoFila(tabla, f) : '' };
}
