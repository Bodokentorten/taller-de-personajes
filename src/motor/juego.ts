// Reglas para la mesa: tiradas de habilidad, heridas, fatiga y pánico.
// Fuentes: «Reglas de Habilidades y Tiradas», «Daño, Heridas y Curación», «Fatiga» y
// «Informe de Integración - Horror, Estrés y Pánico».
import { tirar, type Aleatorio } from './dados';

// --------------------------------------------------------------------------- Tiradas de habilidad

export const DIFICULTADES = [
  { id: 'muy-facil', nombre: 'Muy fácil', aplicar: (v: number) => v * 2 },
  { id: 'facil', nombre: 'Fácil', aplicar: (v: number) => v * 1.5 },
  { id: 'normal', nombre: 'Normal', aplicar: (v: number) => v },
  { id: 'dificil', nombre: 'Difícil', aplicar: (v: number) => (v * 2) / 3 },
  { id: 'formidable', nombre: 'Formidable', aplicar: (v: number) => v / 2 },
  { id: 'herculeo', nombre: 'Hercúleo', aplicar: (v: number) => v / 5 },
] as const;

export type Dificultad = (typeof DIFICULTADES)[number]['id'];
export type Grado = 'critico' | 'exito' | 'fallo' | 'pifia';

export const NOMBRE_GRADO: Record<Grado, string> = {
  critico: 'Éxito crítico',
  exito: 'Éxito',
  fallo: 'Fallo',
  pifia: 'Pifia',
};

/** Valor de la habilidad con el grado de dificultad aplicado (redondeando hacia arriba). */
export function valorConDificultad(valor: number, d: Dificultad): number {
  const dif = DIFICULTADES.find((x) => x.id === d) ?? DIFICULTADES[2];
  return Math.ceil(dif.aplicar(valor));
}

/**
 * Grado de éxito de una tirada d100 contra un valor (ya modificado por la dificultad):
 * crítico ≤ ⌈valor/10⌉; 01–05 siempre éxito; 96–00 siempre fallo; pifia 99–00 (solo 00 si el valor pasa de 100).
 */
export function grado(d100: number, valor: number): Grado {
  const pifia = valor > 100 ? d100 === 100 : d100 >= 99;
  if (pifia) return 'pifia';
  if (d100 >= 96) return 'fallo';
  if (d100 <= Math.ceil(valor / 10)) return 'critico';
  if (d100 <= 5 || d100 <= valor) return 'exito';
  return 'fallo';
}

export interface TiradaHabilidad {
  nombre: string;
  valor: number;
  dificultad: Dificultad;
  efectivo: number;
  d100: number;
  grado: Grado;
}

export function tirarHabilidad(
  nombre: string,
  valor: number,
  dificultad: Dificultad = 'normal',
  azar?: Aleatorio,
): TiradaHabilidad {
  const efectivo = valorConDificultad(valor, dificultad);
  const d100 = tirar('1d100', azar).total;
  return { nombre, valor, dificultad, efectivo, d100, grado: grado(d100, efectivo) };
}

// --------------------------------------------------------------------------- Heridas

export type NivelHerida = 'ilesa' | 'leve' | 'grave' | 'mayor';

/** Leve: PG positivos pero por debajo del máximo · Grave: 0 o menos · Mayor: −PG iniciales o menos. */
export function nivelHerida(actual: number, maximo: number): NivelHerida {
  if (actual <= -maximo) return 'mayor';
  if (actual <= 0) return 'grave';
  if (actual < maximo) return 'leve';
  return 'ilesa';
}

export const EFECTO_HERIDA: Record<NivelHerida, string> = {
  ilesa: '',
  leve: 'Sin penalización. Primeros auxilios cura 1d3 PG. Se cura por días.',
  grave:
    'Cicatriz; no puede atacar ni lanzar magia 1d3 turnos. Resistencia opuesta al ataque: si falla, la extremidad queda inútil o cae inconsciente. Se cura por semanas.',
  mayor:
    'Incapacitado. Resistencia opuesta: si falla en cabeza, pecho o abdomen, muerte. Si sobrevive, necesita tratamiento o se desangra. Se cura por meses.',
};

// --------------------------------------------------------------------------- Fatiga

export const FATIGA = [
  { nombre: 'Fresco', habilidades: '', efecto: 'Sin penalizaciones' },
  { nombre: 'Agitado', habilidades: 'Difícil', efecto: 'Recupera en 15 minutos' },
  { nombre: 'Cansado', habilidades: 'Difícil', efecto: 'Movimiento −1 m · recupera en 3 horas' },
  {
    nombre: 'Fatigado',
    habilidades: 'Formidable',
    efecto: 'Movimiento −2 m, Iniciativa −2 · 6 horas',
  },
  {
    nombre: 'Exhausto',
    habilidades: 'Formidable',
    efecto: 'Movimiento a la mitad, Iniciativa −4, −1 PA · 12 horas',
  },
  {
    nombre: 'Debilitado',
    habilidades: 'Hercúleo',
    efecto: 'Movimiento a la mitad, Iniciativa −6, −2 PA · 18 horas',
  },
  {
    nombre: 'Incapacitado',
    habilidades: 'Hercúleo',
    efecto: 'Inmóvil, Iniciativa −8, −3 PA · 24 horas',
  },
  {
    nombre: 'Semiconsciente',
    habilidades: 'Desesperado',
    efecto: 'Ninguna actividad posible · 36 horas',
  },
  { nombre: 'Comatoso', habilidades: '—', efecto: 'Ninguna actividad posible · 48 horas' },
  { nombre: 'Muerto', habilidades: '—', efecto: '' },
] as const;

/** Grado de dificultad que impone la fatiga a las habilidades (el más difícil prevalece). */
export function dificultadPorFatiga(nivel: number): Dificultad | undefined {
  const h = FATIGA[nivel]?.habilidades;
  return h === 'Difícil'
    ? 'dificil'
    : h === 'Formidable'
      ? 'formidable'
      : h === 'Hercúleo'
        ? 'herculeo'
        : undefined;
}

// --------------------------------------------------------------------------- Pánico

export const PANICO = [
  { min: 1, max: 6, nombre: 'Nervios de acero', efecto: '+1 de Estrés; actúa con normalidad.' },
  {
    min: 7,
    max: 9,
    nombre: 'Sudor frío',
    efecto: '−10% a todas las tiradas el siguiente asalto (o −1 PA ahora).',
  },
  {
    min: 10,
    max: 12,
    nombre: 'Grito de terror',
    efecto: 'Rompe el Sigilo y la Concentración; los aliados cercanos ganan +1 de Estrés.',
  },
  {
    min: 13,
    max: 15,
    nombre: 'Huida desesperada',
    efecto:
      '#Aterrorizado: el próximo turno corre en dirección opuesta (si está acorralado, solo para o esquiva).',
  },
  {
    min: 16,
    max: 18,
    nombre: 'Ataque de histeria',
    efecto: '#Aterrorizado: el próximo turno arremete a ciegas contra la amenaza más cercana.',
  },
  {
    min: 19,
    max: 21,
    nombre: 'Estado de shock',
    efecto: '#Aterrorizado, postrado, sin acciones proactivas 1d4 asaltos; −1d3 INT temporal.',
  },
  {
    min: 22,
    max: Infinity,
    nombre: 'Colapso psicológico',
    efecto: 'INT temporal a 0; Fuerza de voluntad o estupor catatónico. Gana una Cicatriz mental.',
  },
] as const;

/** Tirada de pánico: 1d20 + Estrés. */
export function tirarPanico(estres: number, azar?: Aleatorio) {
  const d20 = tirar('1d20', azar).total;
  const total = d20 + estres;
  const r = PANICO.find((x) => total >= x.min && total <= x.max)!;
  return { d20, total, ...r, aterrorizado: total >= 13 };
}

/** Valor de una habilidad en los seis grados de dificultad (Muy fácil … Hercúleo). */
export function valoresPorDificultad(
  valor: number,
): { id: Dificultad; nombre: string; valor: number }[] {
  return DIFICULTADES.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    valor: valorConDificultad(valor, d.id),
  }));
}

/** Abreviaturas para tablas estrechas. */
export const ABREVIATURA_DIFICULTAD: Record<Dificultad, string> = {
  'muy-facil': 'M. fácil',
  facil: 'Fácil',
  normal: 'Normal',
  dificil: 'Difícil',
  formidable: 'Formid.',
  herculeo: 'Hercúleo',
};
