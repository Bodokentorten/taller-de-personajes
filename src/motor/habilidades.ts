// Habilidades: valor base, idiomas gratuitos del origen y totales por fuente.
import type { Catalogo } from '../datos/catalogo';
import type { Habilidad, ItemHabilidad, Pueblo } from '../datos/tipos';
import type { Valores } from './caracteristicas';
import { evaluar } from './formulas';
import { clave, partirClave, type Fuente, type Personaje } from './personaje';

export type FuenteTotal = Fuente | 'base' | 'origen';

export interface ValorHabilidad {
  clave: string;
  habilidad: Habilidad;
  especialidad?: string;
  /** Nombre para mostrar: «Idioma (Latín)», «Estilo de combate (Milicia de Concejo)». */
  nombre: string;
  base: number;
  desglose: Partial<Record<FuenteTotal, number>>;
  total: number;
}

export function base(h: Habilidad, v: Valores): number {
  return evaluar(h.formula, v);
}

/** Normaliza para comparar especialidades: sin mayúsculas, tildes ni espacios sobrantes. */
export function normal(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Idiomas gratuitos del pueblo (Aquelarre): se suman antes de repartir puntos, sobre la base normal de
 * Idioma. Los que tienen condición «si no es su lengua materna» se omiten si coinciden con ella.
 */
export function idiomasGratis(
  pueblo: Pueblo | undefined,
  lenguaMaterna: string,
): { clave: string; puntos: number }[] {
  if (!pueblo) return [];
  return pueblo.idiomas_gratis
    .filter(
      (i) =>
        !(i.condicion?.includes('lengua materna') && normal(i.idioma) === normal(lenguaMaterna)),
    )
    .map((i) => ({ clave: clave('idioma', i.idioma), puntos: i.bono }));
}

export function nombreHabilidad(cat: Catalogo, c: string): string {
  const { habilidad, especialidad } = partirClave(c);
  const h = cat.habilidades.find((x) => x.id === habilidad);
  const n = h?.nombre ?? habilidad;
  if (!especialidad) return n;
  const estilo =
    habilidad === 'estilo-de-combate' ? cat.estilos.find((e) => e.id === especialidad) : undefined;
  return `${n} (${estilo?.nombre ?? especialidad})`;
}

/**
 * Hoja de habilidades: todas las estándar (aunque no tengan puntos) y las profesionales o con
 * especialidad que tengan algún punto. Las estándar con especialidades (Estilo de combate) solo
 * aparecen por especialidad.
 */
export function calcularHabilidades(p: Personaje, cat: Catalogo): ValorHabilidad[] {
  const v = p.caracteristicas.valores;
  const pueblo = cat.pueblos.find((x) => x.id === p.origen.pueblo);
  const mapa = new Map<string, ValorHabilidad>();

  const entrada = (c: string): ValorHabilidad | undefined => {
    const existente = mapa.get(c);
    if (existente) return existente;
    const { habilidad, especialidad } = partirClave(c);
    const h = cat.habilidades.find((x) => x.id === habilidad);
    if (!h) return undefined;
    const b = base(h, v);
    const nueva: ValorHabilidad = {
      clave: c,
      habilidad: h,
      especialidad,
      nombre: nombreHabilidad(cat, c),
      base: b,
      desglose: { base: b },
      total: b,
    };
    mapa.set(c, nueva);
    return nueva;
  };
  const sumar = (c: string, f: FuenteTotal, puntos: number) => {
    const e = entrada(c);
    if (!e) return;
    e.desglose[f] = (e.desglose[f] ?? 0) + puntos;
    e.total += puntos;
  };

  for (const h of cat.habilidades) if (h.tipo === 'estandar' && !h.especialidades) entrada(h.id);
  for (const i of idiomasGratis(pueblo, p.lenguaMaterna)) sumar(i.clave, 'origen', i.puntos);
  for (const a of p.asignaciones) sumar(a.clave, a.fuente, a.puntos);
  return [...mapa.values()].sort(
    (a, b) =>
      Number(a.habilidad.tipo !== 'estandar') - Number(b.habilidad.tipo !== 'estandar') ||
      a.nombre.localeCompare(b.nombre, 'es'),
  );
}

export function valorDe(hoja: readonly ValorHabilidad[], c: string): number {
  return hoja.find((h) => h.clave === c)?.total ?? 0;
}

/** Valor más alto entre las especialidades que empiecen por `especialidad` (sin tildes): «Teología» casa con «Teología y Talmud». */
export function valorEspecialidad(
  hoja: readonly ValorHabilidad[],
  habilidad: string,
  especialidad: string,
): number {
  const e = normal(especialidad);
  return Math.max(
    0,
    ...hoja
      .filter((h) => h.habilidad.id === habilidad && normal(h.especialidad ?? '').startsWith(e))
      .map((h) => h.total),
  );
}

/**
 * ¿La clave de habilidad cumple el elemento de una lista de cultura o carrera?
 * - Las habilidades con especialidades (Idioma, Conocimiento, Artesanía…) exigen indicar una, pero se
 *   acepta cualquiera: muchas listas son descriptivas («Conocimiento (Principal)», «(Especie específica)»).
 *   Si la lista pide una concreta y se elige otra, `especialidadSugerida` lo detecta para dar un aviso.
 * - Estilo de combate: vale cualquier estilo, salvo que la lista nombre un estilo concreto del catálogo.
 * - El resto, sin especialidad.
 */
export function casa(item: ItemHabilidad, c: string, cat: Catalogo): boolean {
  const { habilidad, especialidad } = partirClave(c);
  if (item.habilidad !== habilidad) return false;
  if (habilidad === 'estilo-de-combate') {
    if (!especialidad) return false;
    const fijo = item.especialidad
      ? cat.estilos.find((e) => normal(e.nombre) === normal(item.especialidad!))
      : undefined;
    return fijo ? fijo.id === especialidad : true;
  }
  const h = cat.habilidades.find((x) => x.id === habilidad);
  return h?.especialidades ? Boolean(especialidad) : !especialidad;
}

/**
 * Si el elemento pide una especialidad concreta (una de las de ejemplo de la habilidad, como «Ocultismo» o
 * «Teología») y la clave lleva otra, devuelve la pedida; si no, undefined.
 */
export function especialidadSugerida(
  item: ItemHabilidad,
  c: string,
  cat: Catalogo,
): string | undefined {
  const { especialidad } = partirClave(c);
  if (
    !item.especialidad ||
    item.cualquiera ||
    !especialidad ||
    item.habilidad === 'estilo-de-combate'
  )
    return undefined;
  const h = cat.habilidades.find((x) => x.id === item.habilidad);
  const concreta = h?.ejemplos_especialidad.some((e) => normal(e) === normal(item.especialidad!));
  return concreta && normal(item.especialidad) !== normal(especialidad)
    ? item.especialidad
    : undefined;
}
