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
  /** Puntos de la pirámide o de experiencia, aparte del bono inicial. */
  extra?: number;
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

  magia: { fuentes: FuenteMistica[]; formulas: string[]; formulasAlAzar?: boolean };
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
