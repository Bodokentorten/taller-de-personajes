// Calculadora de hechizos de Magia Caótica.
// Fuentes: «Informe - Guía de Magia Caótica» (§6, Cálculo de la Dificultad) y «Fórmulas, vis y rangos»
// (dificultad base y final de una fórmula, racionalidad de la zona, gestos, voz y armadura).
import type { Catalogo } from '../datos/catalogo';
import type { Formula, Manipulacion } from '../datos/tipos';
import type { EstadoMagia } from './magia';
import { UMBRAL_RANGO } from './magia';

export type Rango = 'I' | 'II' | 'III' | 'IV' | 'V';
export interface Opcion {
  id: string;
  nombre: string;
  valor: number;
}

export const RANGOS: (Opcion & { id: Rango; umbral: number })[] = [
  { id: 'I', nombre: 'Rango I', valor: 0, umbral: UMBRAL_RANGO.I },
  { id: 'II', nombre: 'Rango II', valor: 5, umbral: UMBRAL_RANGO.II },
  { id: 'III', nombre: 'Rango III', valor: 10, umbral: UMBRAL_RANGO.III },
  { id: 'IV', nombre: 'Rango IV', valor: 15, umbral: UMBRAL_RANGO.IV },
  { id: 'V', nombre: 'Rango V', valor: 20, umbral: UMBRAL_RANGO.V },
];

export const DURACIONES: Opcion[] = [
  { id: 'instantanea', nombre: 'Instantánea', valor: 5 },
  { id: 'turno', nombre: 'Turno', valor: 10 },
  { id: 'horas', nombre: 'Horas / Escena', valor: 15 },
  { id: 'dias', nombre: 'Días', valor: 20 },
  { id: 'anillo', nombre: 'Anillo / Fetiche', valor: 20 },
  { id: 'semanas', nombre: 'Semanas / Lunar', valor: 25 },
  { id: 'meses', nombre: 'Meses / Estación', valor: 30 },
  { id: 'anos', nombre: 'Años', valor: 35 },
  { id: 'decadas', nombre: 'Décadas', valor: 45 },
  { id: 'permanente', nombre: 'Permanente', valor: 55 },
];

export const ALCANCES: Opcion[] = [
  { id: 'personal', nombre: 'Personal', valor: 0 },
  { id: 'toque', nombre: 'Toque / Ocular', valor: 5 },
  { id: 'cercano', nombre: 'Cercano / Voz', valor: 10 },
  { id: 'lejano', nombre: 'Lejano / Visual', valor: 15 },
  { id: 'muy-lejano', nombre: 'Muy lejano', valor: 25 },
  { id: 'conexion', nombre: 'Conexión arcana', valor: 40 },
];

export const OBJETIVOS: Opcion[] = [
  { id: 'personal', nombre: 'Personal', valor: 0 },
  { id: 'otro', nombre: 'Otro / Círculo', valor: 10 },
  { id: 'grupo', nombre: 'Parte / Grupo', valor: 20 },
  { id: 'area', nombre: 'Área / Sala', valor: 30 },
  { id: 'zona', nombre: 'Zona / Estructura', valor: 40 },
  { id: 'region', nombre: 'Región', valor: 55 },
];

export const ZONAS: Opcion[] = [
  { id: 'nexo', nombre: 'Nexo (aquelarre, cueva de mouras)', valor: 5 },
  { id: 'naturaleza', nombre: 'Naturaleza (monte, ruinas)', valor: 10 },
  { id: 'rural', nombre: 'Rural (aldea, camino, venta)', valor: 20 },
  { id: 'ciudad', nombre: 'Ciudad o templo', valor: 30 },
  { id: 'antimagia', nombre: 'Antimagia (catedral, camposanto)', valor: 50 },
];

export const ARMADURAS: Opcion[] = [
  { id: 'ninguna', nombre: 'Sin armadura o ropa de abrigo', valor: 0 },
  { id: 'ligera', nombre: 'Ligera (cuero, gambesón)', valor: 10 },
  { id: 'metalica', nombre: 'Metálica (malla)', valor: 20 },
  { id: 'completa', nombre: 'Completa (placas, arnés)', valor: 30 },
];

/** Tipo de armadura del catálogo → modificador (la pieza puesta más pesada manda). */
export const ARMADURA_POR_TIPO: Record<string, string> = {
  Blanda: 'ninguna',
  Ligera: 'ligera',
  Metálica: 'metalica',
  Completa: 'completa',
};

export const VOZ_BAJA = 10;
export const SIN_GESTOS = 10;
export const REQUISITO_EXTRA = 10;
export const FORMULA_COMPLETA = -20;
export const DIFICULTAD_MINIMA = 5;

const valor = (lista: Opcion[], id: string) => lista.find((x) => x.id === id)?.valor ?? 0;
const porNombre = (lista: Opcion[], nombre: string) =>
  lista.find((x) => x.nombre.toLowerCase().startsWith(nombre.toLowerCase().split(' (')[0]!));

export interface ParametrosHechizo {
  rango: Rango;
  duracion: string;
  alcance: string;
  objetivo: string;
  requisitos: number;
  /** Fórmula completa del grimorio de los reinos (conocida y con todos sus componentes): −20%. */
  formulaCompleta: boolean;
}

export interface Lanzamiento {
  zona: string;
  /** Resistencia de la Fuente a la manipulación usada. */
  manipulacion: number;
  vozBaja: boolean;
  sinGestos: boolean;
  armadura: string;
}

export interface ResultadoHechizo {
  base: number;
  final: number;
  umbral: number;
  desglose: { concepto: string; valor: number }[];
}

/** Dificultad base (Rango + duración + alcance + objetivo + requisitos − 20% si es fórmula, mínimo 5%). */
export function dificultadBase(h: ParametrosHechizo): {
  valor: number;
  desglose: ResultadoHechizo['desglose'];
} {
  const desglose = [
    { concepto: `Rango ${h.rango}`, valor: valor(RANGOS, h.rango) },
    {
      concepto: `Duración: ${DURACIONES.find((x) => x.id === h.duracion)?.nombre ?? h.duracion}`,
      valor: valor(DURACIONES, h.duracion),
    },
    {
      concepto: `Alcance: ${ALCANCES.find((x) => x.id === h.alcance)?.nombre ?? h.alcance}`,
      valor: valor(ALCANCES, h.alcance),
    },
    {
      concepto: `Objetivo: ${OBJETIVOS.find((x) => x.id === h.objetivo)?.nombre ?? h.objetivo}`,
      valor: valor(OBJETIVOS, h.objetivo),
    },
    ...(h.requisitos
      ? [
          {
            concepto: `${h.requisitos} requisito${h.requisitos > 1 ? 's' : ''} extra`,
            valor: h.requisitos * REQUISITO_EXTRA,
          },
        ]
      : []),
    ...(h.formulaCompleta ? [{ concepto: 'Fórmula completa', valor: FORMULA_COMPLETA }] : []),
  ];
  return {
    valor: Math.max(
      DIFICULTAD_MINIMA,
      desglose.reduce((s, x) => s + x.valor, 0),
    ),
    desglose,
  };
}

/** Lo que añade el momento de lanzar: zona, manipulación de la Fuente, voz, gestos y armadura. */
export function modificadoresLanzamiento(l: Lanzamiento): ResultadoHechizo['desglose'] {
  return [
    {
      concepto: `Zona: ${ZONAS.find((x) => x.id === l.zona)?.nombre.split(' (')[0] ?? l.zona}`,
      valor: valor(ZONAS, l.zona),
    },
    { concepto: 'Manipulación de la Fuente', valor: l.manipulacion },
    ...(l.vozBaja ? [{ concepto: 'En voz baja', valor: VOZ_BAJA }] : []),
    ...(l.sinGestos ? [{ concepto: 'Sin gestos', valor: SIN_GESTOS }] : []),
    ...(valor(ARMADURAS, l.armadura)
      ? [
          {
            concepto: `Armadura ${ARMADURAS.find((x) => x.id === l.armadura)!
              .nombre.split(' (')[0]!
              .toLowerCase()}`,
            valor: valor(ARMADURAS, l.armadura),
          },
        ]
      : []),
  ];
}

export function calcularHechizo(h: ParametrosHechizo, l: Lanzamiento): ResultadoHechizo {
  const b = dificultadBase(h);
  const mods = modificadoresLanzamiento(l);
  return {
    base: b.valor,
    final: b.valor + mods.reduce((s, x) => s + x.valor, 0),
    umbral: valor(RANGOS, h.rango) >= 0 ? RANGOS.find((r) => r.id === h.rango)!.umbral : 0,
    desglose: [...b.desglose, ...mods],
  };
}

/** Parámetros de una fórmula del grimorio de los reinos (para mostrar su desglose). */
export function parametrosDeFormula(f: Formula): ParametrosHechizo {
  return {
    rango: f.rango,
    duracion: porNombre(DURACIONES, f.duracion)?.id ?? 'horas',
    alcance: porNombre(ALCANCES, f.alcance)?.id ?? 'toque',
    objetivo: porNombre(OBJETIVOS, f.objetivo)?.id ?? 'otro',
    requisitos: 0,
    formulaCompleta: true,
  };
}

/** Resistencia de una Fuente a una manipulación (grimorio del catálogo o Fuente propia). */
export function manipulacionFuente(
  cat: Catalogo,
  fuente: { grimorio?: string; manipulacion?: Partial<Record<Manipulacion, number>> },
  m: Manipulacion,
): number {
  const g = fuente.grimorio ? cat.grimorios.find((x) => x.id === fuente.grimorio) : undefined;
  return (g?.manipulacion ?? fuente.manipulacion ?? {})[m] ?? 0;
}

/** Armadura puesta más pesada del personaje, como opción de la calculadora. */
export function armaduraDe(tipos: string[]): string {
  const orden = ['ninguna', 'ligera', 'metalica', 'completa'];
  return tipos
    .map((t) => ARMADURA_POR_TIPO[t] ?? 'ninguna')
    .reduce((a, b) => (orden.indexOf(b) > orden.indexOf(a) ? b : a), 'ninguna');
}

/** Dificultad final de una fórmula conocida lanzada con una de las Fuentes del personaje. */
export function dificultadFormula(
  cat: Catalogo,
  f: Formula,
  fuente: EstadoMagia['fuentes'][number] & {
    grimorio?: string;
    manipulacion?: Partial<Record<Manipulacion, number>>;
  },
  l: Omit<Lanzamiento, 'manipulacion'>,
): ResultadoHechizo {
  const mods = modificadoresLanzamiento({
    ...l,
    manipulacion: manipulacionFuente(cat, fuente, f.manipulacion),
  });
  return {
    base: f.dificultad_base,
    final: f.dificultad_base + mods.reduce((s, x) => s + x.valor, 0),
    umbral: UMBRAL_RANGO[f.rango],
    desglose: [{ concepto: 'Dificultad base de la fórmula', valor: f.dificultad_base }, ...mods],
  };
}

// --------------------------------------------------------------------------- Lanzamiento (Guía, §7)

/** Resistencia del Hechizo: la dificultad entre 5, redondeando hacia arriba (45% → 9 puntos). */
export function resistenciaHechizo(dificultad: number): number {
  return Math.ceil(dificultad / 5);
}

/** Modificador de Daño por Espíritu: ⌊(POD − 10) / 4⌋ (POD 10–13: +0; 14–17: +1; 6–9: −1…). */
export function mde(pod: number): number {
  return Math.floor((pod - 10) / 4);
}

/** Con dificultad del 20% o menos, el lanzamiento se resuelve con una sola tirada opuesta. */
export const LIMITE_LANZAMIENTO_RAPIDO = 20;

/**
 * Intercambios que se necesitan, de media, para doblegar el hechizo si se ganan todos:
 * cada uno resta 1d6 + MDE (mínimo 1) a la Resistencia.
 */
export function intercambiosMedios(dificultad: number, modEspiritu: number): number {
  if (dificultad <= LIMITE_LANZAMIENTO_RAPIDO) return 1;
  const porIntercambio = Math.max(1, 3.5 + modEspiritu);
  return Math.ceil(resistenciaHechizo(dificultad) / porIntercambio);
}
