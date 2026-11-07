// Reglas para la mesa: tiradas de habilidad, heridas, fatiga y miedo.
// Fuentes: «Reglas de Habilidades y Tiradas», «Daño, Heridas y Curación», «Fatiga», «Escalera de miedo»
// e «Informe de Integración - Horror, Estrés y Pánico».
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

// --------------------------------------------------------------------------- Miedo («Escalera de miedo»)

/** Umbral de cada peldaño: POD ÷ 2, hacia arriba (la Corrupción, al bajar el POD, lo baja). */
export function umbralMiedo(pod: number): number {
  return Math.max(1, Math.ceil(pod / 2));
}

export type IdPeldaño =
  'sereno' | 'inquieto' | 'asustado' | 'aterrorizado' | 'quebrado' | 'colapso';

export interface Peldaño {
  id: IdPeldaño;
  nombre: string;
  alEntrar: string;
  mientras: string;
}

/** Peldaños de la escalera, de Sereno (0) a Colapso (5, al llegar a 4 × Umbral). */
export const PELDAÑOS: readonly Peldaño[] = [
  { id: 'sereno', nombre: 'Sereno', alEntrar: '', mientras: 'Sin efectos.' },
  {
    id: 'inquieto',
    nombre: 'Inquieto',
    alEntrar: '',
    mientras: '−10% en las tiradas de confrontación contra la fuente del miedo.',
  },
  {
    id: 'asustado',
    nombre: 'Asustado',
    alEntrar: 'Pierde 1 Punto de Acción este asalto.',
    mientras:
      'Difícil contra la fuente del miedo; no se le acerca sin superar Fuerza de voluntad (gratuita, 1/asalto).',
  },
  {
    id: 'aterrorizado',
    nombre: 'Aterrorizado',
    alEntrar: 'Reacción de terror (elige el jugador) y #Aterrorizado.',
    mientras: 'Como Asustado; cada nuevo fallo ante el horror, otra reacción de terror.',
  },
  {
    id: 'quebrado',
    nombre: 'Quebrado',
    alEntrar:
      'Estado de Shock: Postrado, sin Acciones Proactivas 1d4 asaltos (reacciones Formidables), −1d3 INT temporal y #Aterrorizado.',
    mientras: 'Todas sus habilidades son Difíciles; cada nuevo fallo ante el horror, un Colapso.',
  },
  {
    id: 'colapso',
    nombre: 'Colapso psicológico',
    alEntrar:
      'INT temporal a 0; Fuerza de voluntad o estupor catatónico (si la supera, todo Difícil). Gana una Cicatriz mental.',
    mientras: 'Como Quebrado.',
  },
];

export const REACCIONES_TERROR = [
  { nombre: 'Huida', efecto: 'Corre (Movimiento × 3) alejándose de la fuente del miedo.' },
  { nombre: 'Parálisis', efecto: 'No se mueve; sólo puede Parar o Esquivar.' },
  {
    nombre: 'Histeria',
    efecto:
      'Arremete contra la amenaza más cercana; sin hechizos ni efectos especiales defensivos o tácticos.',
  },
  {
    nombre: 'Plegaria o alarido',
    efecto: 'Pierde las Acciones Proactivas; rompe el Sigilo y la Concentración.',
  },
] as const;

/** Índice del peldaño (0 Sereno … 4 Quebrado, 5 Colapso) para un Estrés y un Umbral. */
export function indicePeldaño(estres: number, umbral: number): number {
  if (estres <= 0) return 0;
  if (estres >= 4 * umbral) return 5;
  return 1 + Math.min(3, Math.floor(estres / umbral));
}

export function peldaño(estres: number, umbral: number): Peldaño {
  return PELDAÑOS[indicePeldaño(estres, umbral)]!;
}

/** Estrés que falta para el peldaño siguiente (undefined en Colapso). */
export function faltaParaSiguiente(estres: number, umbral: number): number | undefined {
  const i = indicePeldaño(estres, umbral);
  if (i >= 5) return undefined;
  const limite = i === 0 ? 1 : i * umbral;
  return Math.max(1, limite - estres);
}

/** Grados de Horror: dado de Estrés con fallo y Estrés fijo con éxito. */
export const GRADOS_HORROR = [
  { id: 'I', dado: '1d3', max: 3, exito: 0 },
  { id: 'II', dado: '1d6', max: 6, exito: 0 },
  { id: 'III', dado: '1d8', max: 8, exito: 0 },
  { id: 'IV', dado: '1d10', max: 10, exito: 1 },
  { id: 'V', dado: '1d12', max: 12, exito: 2 },
] as const;
export type GradoHorror = (typeof GRADOS_HORROR)[number]['id'];

/** Estrés de una vez a partir del cual hay golpe fuerte. */
export const GOLPE_FUERTE = 5;

export interface TiradaHorror {
  grado: GradoHorror;
  /** La tirada de Fuerza de voluntad (con el modificador ya aplicado). */
  fv: TiradaHabilidad;
  /** Estrés ganado (−1 con crítico, si tenía). */
  ganado: number;
  antes: number;
  despues: number;
  /** Peldaño cuyo efecto «al entrar» sufre por el Estrés (o por un nuevo fallo estando Aterrorizado o Quebrado). */
  entra?: Peldaño;
  /** Segunda Fuerza de voluntad del golpe fuerte (si lo hubo). */
  golpeFuerte?: TiradaHabilidad;
  /** Efecto que sufre por fallar el golpe fuerte, si es peor que el de `entra`. */
  porGolpe?: Peldaño;
}

const falla = (t: TiradaHabilidad) => t.grado === 'fallo' || t.grado === 'pifia';

/**
 * Tirada contra el horror según la «Escalera de miedo»: Fuerza de voluntad; con fallo suma el dado del
 * Grado (con pifia, el máximo); 5 o más de una vez (o una pifia desde el Grado II) obligan a una segunda
 * Fuerza de voluntad, y si falla queda Aterrorizado en el acto (o un peldaño más, si ya lo estaba).
 */
export function tirarHorror(
  fuerzaVoluntad: number,
  gradoHorror: GradoHorror,
  estres: number,
  umbral: number,
  modificador = 0,
  dificultad: Dificultad = 'normal',
  azar?: Aleatorio,
): TiradaHorror {
  const g = GRADOS_HORROR.find((x) => x.id === gradoHorror)!;
  const valor = Math.max(0, fuerzaVoluntad + modificador);
  const fv = tirarHabilidad('Fuerza de voluntad', valor, dificultad, azar);
  let ganado: number = g.exito;
  if (fv.grado === 'critico') ganado = estres > 0 ? -1 : 0;
  else if (fv.grado === 'fallo') ganado = tirar(g.dado, azar).total;
  else if (fv.grado === 'pifia') ganado = g.max;
  const despues = Math.max(0, estres + ganado);
  const r: TiradaHorror = { grado: gradoHorror, fv, ganado, antes: estres, despues };
  const iA = indicePeldaño(estres, umbral);
  let iE = indicePeldaño(despues, umbral);
  // Un nuevo fallo estando Aterrorizado repite la reacción; estando Quebrado, Colapso.
  if (falla(fv) && iE === iA && iA >= 3) iE = iA === 3 ? 3 : 5;
  if (iE >= 2 && (iE > iA || (falla(fv) && iA >= 3))) r.entra = PELDAÑOS[iE];
  if (falla(fv) && (ganado >= GOLPE_FUERTE || (fv.grado === 'pifia' && gradoHorror !== 'I'))) {
    r.golpeFuerte = tirarHabilidad('Fuerza de voluntad (golpe fuerte)', valor, dificultad, azar);
    if (falla(r.golpeFuerte)) {
      const i = Math.min(5, Math.max(3, iA + 1));
      if (!r.entra || iE < i) r.porGolpe = PELDAÑOS[i];
    }
  }
  return r;
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
