// Modelo del personaje (JSON versionado). Se guardan las ASIGNACIONES por fuente, no solo los totales,
// para poder rehacer, validar y mostrar de dónde sale cada punto.
import type { Caracteristica, Sexo } from '../datos/tipos';
import type { Tirada } from './dados';

export const VERSION_PERSONAJE = 1;

export type MetodoCaracteristicas = 'compra' | 'tirada' | 'manual';
export type MetodoHabilidades = 'estandar' | 'piramide';

/** De dónde sale una asignación de puntos de habilidad. */
export type Fuente = 'cultura' | 'carrera' | 'adicional' | 'piramide' | 'experiencia';

export interface Asignacion {
  /** Clave de la habilidad: «atletismo», «idioma:Latín», «estilo-de-combate:milicia-de-concejo». */
  clave: string;
  fuente: Fuente;
  puntos: number;
}

export interface Pasion {
  /** Texto libre: «Lealtad (Don Íñigo, su señor)». */
  nombre: string;
  /** Índice en reglas.pasiones (el tipo de objeto, que da la fórmula base). */
  tipo: number;
  /** Orden de importancia (1 → +40, 2 → +30, 3 → +20). */
  orden: 1 | 2 | 3;
  /** Características del sujeto, si la fórmula las usa. */
  sujeto?: { POD?: number; CAR?: number };
  /** Es la Pasión Fe del credo. */
  fe?: boolean;
  /** Puntos de la pirámide, aparte del bono inicial. */
  extra?: number;
  /** Puntos ganados (o perdidos) en juego con tiradas de experiencia. */
  experiencia?: number;
  /** Adquirida en juego: empieza en su valor base (sin bono) y no cuenta para las tres de la creación. */
  adquirida?: boolean;
}

export interface FuenteMistica {
  /** Clave de habilidad que la representa: «fuente-mistica:<id o nombre>». */
  clave: string;
  /** Id del grimorio del catálogo, si lo es. */
  grimorio?: string;
  nombre: string;
  dominios: string[];
}

export interface Personaje {
  version: typeof VERSION_PERSONAJE;
  id: string;
  nombre: string;
  sexo: Sexo | '';
  concepto: string;
  edad?: number;
  /** id de reglas.edades: «joven», «adulto»… (da los puntos adicionales y su tope). */
  categoriaEdad: string;

  caracteristicas: {
    metodo: MetodoCaracteristicas;
    valores: Record<Caracteristica, number>;
    tiradas?: Partial<Record<Caracteristica, Tirada>>;
    /** Aumentos ganados con experiencia (no cuentan para validar la creación). */
    mejoras?: Partial<Record<Caracteristica, number>>;
  };

  origen: {
    cultura: string;
    reino: string; // id de reinos
    pueblo: string;
    credo: string;
    /** id de la clase social en la tabla que le corresponde (por cultura o por credo). */
    clase: string;
    tiradaClase?: number;
  };

  carrera: string;
  metodoHabilidades: MetodoHabilidades;
  /** Lengua materna (texto) y lenguas de los idiomas gratuitos que no son fijas. */
  lenguaMaterna: string;
  /** Asignaciones de puntos de habilidad por fuente (los idiomas gratis los calcula el motor). */
  asignaciones: Asignacion[];
  /** Elecciones de la cultura entre opciones («Navegación fluvial o Montar»). */
  eleccionesCultura: string[];
  pasiones: Pasion[];

  magia: {
    fuentes: FuenteMistica[];
    /** Fórmulas iniciales (las que se validan al crear el personaje). */
    formulas: string[];
    formulasAlAzar?: boolean;
    /** Fórmulas aprendidas durante el juego, con maestro o grimorio. */
    formulasAprendidas?: string[];
  };
  /** Rituales conocidos: se calculan por ordo, pero se guardan para la ficha. */
  rituales: string[];

  dinero: { tirada?: Tirada; total?: number };
  /** Objetos comprados. id con prefijo de catálogo: «arma:daga», «armadura:velmez», «equipo:antorchas-3». */
  equipo: { id: string; cantidad: number; puesto?: boolean }[];
  /** Tiradas de trasfondo (familia, conexiones, eventos). */
  trasfondo: Partial<Record<TablaTrasfondo, ResultadoTrasfondo>> & {
    eventos?: ResultadoTrasfondo[];
  };
  aspecto: string;
  notas: string;
  /** Estado durante la partida (vista de juego). */
  juego?: EstadoJuego;
  /** Tiradas de experiencia, historial de mejoras y entrenamiento. */
  experiencia?: Experiencia;
  /** Para el frontmatter del vault («Plantilla - Personaje (PJ o PNJ)»). */
  partida?: string;
  jugador?: string;
  año?: number;
}

export type TablaTrasfondo =
  'padres' | 'hermanos' | 'familia_extendida' | 'reputacion' | 'conexiones';

export interface ResultadoTrasfondo {
  tirada: number;
  texto: string;
}

/** Reglas de la campaña que cambian la validación (las fija el DJ en campaña.json). */
export interface Campaña {
  /** Aplicar las restricciones de sexo de las carreras (regla opcional de la Sesión 0). */
  restriccionesSexo: boolean;
  /** Hidalguía universal vasca: los vascos tiran clase normalmente. */
  hidalguiaVasca: boolean;
  metodosHabilidades: MetodoHabilidades[];
  metodosCaracteristicas: MetodoCaracteristicas[];
  /** Si los PJ pueden ser de carreras mágicas. */
  permitirMagia: boolean;
  /** Si se pueden repetir las tiradas de trasfondo. */
  repetirTrasfondo: boolean;
  /** Nombre de la campaña y año en que transcurre (informativos). */
  nombre?: string;
  año?: number;
  /** Si no están vacías, solo se permiten esas carreras y esos pueblos (ids). */
  carrerasPermitidas?: string[];
  pueblosPermitidos?: string[];
}

export const CAMPAÑA_POR_DEFECTO: Campaña = {
  restriccionesSexo: false,
  hidalguiaVasca: false,
  metodosHabilidades: ['estandar', 'piramide'],
  metodosCaracteristicas: ['compra', 'tirada', 'manual'],
  permitirMagia: true,
  repetirTrasfondo: true,
};

export function personajeVacio(id: string): Personaje {
  return {
    version: VERSION_PERSONAJE,
    id,
    nombre: '',
    sexo: '',
    concepto: '',
    categoriaEdad: 'adulto',
    caracteristicas: {
      metodo: 'compra',
      valores: { FUE: 11, CON: 11, TAM: 13, DES: 11, INT: 13, POD: 11, CAR: 10 },
    },
    origen: { cultura: '', reino: '', pueblo: '', credo: '', clase: '' },
    carrera: '',
    metodoHabilidades: 'estandar',
    lenguaMaterna: '',
    asignaciones: [],
    eleccionesCultura: [],
    pasiones: [],
    magia: { fuentes: [], formulas: [] },
    rituales: [],
    dinero: {},
    equipo: [],
    trasfondo: {},
    aspecto: '',
    notas: '',
  };
}

/** Clave de habilidad con especialidad opcional. */
export function clave(habilidad: string, especialidad?: string): string {
  return especialidad ? `${habilidad}:${especialidad}` : habilidad;
}

export function partirClave(c: string): { habilidad: string; especialidad?: string } {
  const i = c.indexOf(':');
  return i < 0 ? { habilidad: c } : { habilidad: c.slice(0, i), especialidad: c.slice(i + 1) };
}

export interface EstadoJuego {
  /** PG actuales por localización (si falta, están al máximo). */
  pg: Partial<Record<string, number>>;
  notasHeridas: Partial<Record<string, string>>;
  pm?: number;
  pf?: number;
  suerte?: number;
  /** Índice del nivel de fatiga (0 = Fresco). */
  fatiga: number;
  estres: number;
  aterrorizado: boolean;
  corrupcion: number;
  municion: { nombre: string; cantidad: number }[];
  notasSesion: string;
  /** Habilidades marcadas durante la sesión (éxito en tensión) y pifiadas. */
  marcadas: string[];
  pifias: string[];
}

export type TipoCambio =
  | 'otorgadas'
  | 'habilidad'
  | 'pifia'
  | 'pasion'
  | 'nueva-pasion'
  | 'nueva-habilidad'
  | 'caracteristica'
  | 'entrenamiento'
  | 'formula'
  | 'ordo'
  | 'ajuste';

export interface Cambio {
  fecha: string;
  entrega: number;
  tipo: TipoCambio;
  /** Clave de habilidad, índice de pasión o característica. */
  objeto?: string;
  detalle: string;
  /** Variación de la puntuación (o de tiradas, en «otorgadas»). */
  delta: number;
  /** Tiradas de experiencia gastadas. */
  coste: number;
}

export interface Experiencia {
  /** Tiradas de experiencia disponibles. */
  tiradas: number;
  /** Número de la entrega actual: cada habilidad solo se tira una vez por entrega. */
  entrega: number;
  historial: Cambio[];
  /** Habilidades entrenadas que aún no han subido por experiencia (no se pueden volver a entrenar). */
  entrenadas: string[];
  /** Ordo de fe aprendido durante el juego (si falta, el que permitan PF y Teología al crear). */
  ordo?: number;
}

export function juegoVacio(): EstadoJuego {
  return {
    pg: {},
    notasHeridas: {},
    fatiga: 0,
    estres: 0,
    aterrorizado: false,
    corrupcion: 0,
    municion: [],
    notasSesion: '',
    marcadas: [],
    pifias: [],
  };
}

export function experienciaVacia(): Experiencia {
  return { tiradas: 0, entrega: 0, historial: [], entrenadas: [] };
}

/** Características actuales: las de creación más las mejoras ganadas en juego. */
export function caracteristicasActuales(p: Personaje): Record<Caracteristica, number> {
  const v = { ...p.caracteristicas.valores };
  for (const [c, n] of Object.entries(p.caracteristicas.mejoras ?? {}))
    v[c as Caracteristica] += n ?? 0;
  return v;
}
