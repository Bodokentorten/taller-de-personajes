import type { Catalogo } from '../../datos/catalogo';
import type { Habilidad, ItemHabilidad } from '../../datos/tipos';
import { partirClave, type Fuente, type Personaje } from '../../motor/personaje';

export function puntos(p: Personaje, fuente: Fuente, c: string): number {
  return p.asignaciones
    .filter((a) => a.fuente === fuente && a.clave === c)
    .reduce((s, a) => s + a.puntos, 0);
}

/** Fija los puntos de una fuente en una habilidad (0 la quita). */
export function fijar(p: Personaje, fuente: Fuente, c: string, n: number) {
  const resto = p.asignaciones.filter((a) => !(a.fuente === fuente && a.clave === c));
  p.asignaciones = n > 0 ? [...resto, { clave: c, fuente, puntos: n }] : resto;
}

export function gastados(p: Personaje, fuente: Fuente): number {
  return p.asignaciones.filter((a) => a.fuente === fuente).reduce((s, a) => s + a.puntos, 0);
}

/** Claves con puntos de una fuente para una habilidad dada (sus especialidades). */
export function clavesDe(p: Personaje, fuente: Fuente, habilidad: string): string[] {
  return [
    ...new Set(
      p.asignaciones
        .filter((a) => a.fuente === fuente && partirClave(a.clave).habilidad === habilidad)
        .map((a) => a.clave),
    ),
  ];
}

export function habilidad(cat: Catalogo, id: string): Habilidad | undefined {
  return cat.habilidades.find((h) => h.id === id);
}

/** ¿El elemento de la lista se concreta en una sola clave (sin especialidad que elegir)? */
export function claveFija(cat: Catalogo, it: ItemHabilidad): string | undefined {
  const h = habilidad(cat, it.habilidad);
  if (!h || it.habilidad === 'estilo-de-combate') return undefined;
  return h.especialidades ? undefined : h.id;
}

/** Sugerencias de especialidad para un elemento: la que pide la lista, las sugeridas y las de ejemplo. */
export function sugerenciasEspecialidad(cat: Catalogo, it: ItemHabilidad): string[] {
  const h = habilidad(cat, it.habilidad);
  return [
    ...new Set([
      ...(it.especialidad ? [it.especialidad] : []),
      ...(it.sugerencias ?? []),
      ...(h?.ejemplos_especialidad ?? []),
    ]),
  ];
}
