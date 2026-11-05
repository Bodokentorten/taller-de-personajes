// Tipos de los catálogos que genera extractor/extraer.py (src/datos/jugador/*.json).
// Si cambia la forma de un catálogo en el extractor, hay que cambiarla aquí.

export type Caracteristica = 'FUE' | 'CON' | 'TAM' | 'DES' | 'INT' | 'POD' | 'CAR';
export const CARACTERISTICAS: readonly Caracteristica[] = ['FUE', 'CON', 'TAM', 'DES', 'INT', 'POD', 'CAR'];

export type Estamento = 'marginado' | 'esclavo' | 'villano' | 'acomodado' | 'baja-nobleza' | 'alta-nobleza';
export type Sexo = 'varon' | 'mujer';

export interface Entrada {
  id: string;
  nombre: string;
  /** Título exacto de la nota del vault, para el enlace [[…]]. */
  nota: string;
  ancla?: string;
  resumen?: string;
}

export interface Habilidad extends Entrada {
  tipo: 'estandar' | 'profesional';
  nombre_en: string | null;
  /** «FUE+DES», «INT x2», «INT x2 +40», «0»… */
  formula: string;
  caracteristicas: Caracteristica[];
  especialidades: boolean;
  ejemplos_especialidad: string[];
  culturas: string[];
  carreras: string[];
  magia_caotica?: boolean;
}

export interface ItemHabilidad {
  habilidad: string;
  especialidad?: string;
  cualquiera?: boolean;
  sugerencias?: string[];
  aclaracion?: string;
}

export interface Cultura extends Entrada {
  nombre_en: string;
  automaticas: { habilidad: string; bono: number }[];
  estandar: ItemHabilidad[];
  estandar_eleccion: { n: number; opciones: string[] }[];
  profesionales: ItemHabilidad[];
  n_profesionales: number;
  puntos: number;
  min_por_habilidad: number;
  max_por_habilidad: number;
  estilos: string[];
  pasiones_sugeridas: string[];
  dinero: { dados: string; multiplicador: number };
}

export interface RequisitosCarrera {
  credos?: string[];
  sexo?: Sexo;
  estamentos?: Estamento[];
  reinos?: string[];
  pueblos_extra?: string[];
}

export interface Carrera extends Entrada {
  nombre_en: string | null;
  origen: 'mythras' | 'aquelarre';
  arquetipos: string;
  restriccion: string;
  requisitos: RequisitosCarrera;
  culturas_habituales: string[];
  estandar: ItemHabilidad[];
  profesionales: ItemHabilidad[];
  max_profesionales: number;
  puntos: number;
  max_por_habilidad: number;
  magia: boolean;
  fe: boolean;
  aviso: string | null;
}

export interface RequisitosPueblo {
  estamentos_prohibidos?: Estamento[];
  estamentos_permitidos?: Estamento[];
  carreras_prohibidas?: string[];
  opcion_campaña?: string;
  /** Aviso que se muestra si el personaje elige esa carrera (por nombre). */
  avisos_carrera?: Record<string, string>;
}

export interface Pueblo extends Entrada {
  credo: string;
  reinos: string[];
  culturas_habituales: string[];
  culturas_texto: string;
  lengua_materna: string;
  idiomas_gratis: { idioma: string; bono: number; condicion?: string }[];
  costumbres: string;
  restricciones: string;
  requisitos: RequisitosPueblo;
  estilos_habituales: string[];
  nomina: string;
  pasiones_sugeridas: string[];
  raro: boolean;
}

export interface Credo extends Entrada {
  pasion_fe: string;
  clases_propias: boolean;
  clases_condicion: { pueblos: string[] } | null;
  titulos_nobleza: { min: number; max: number; alta_nobleza: string; baja_nobleza: string }[];
  notas: string[];
}

export type Reino = Entrada;

export interface ClaseSocial {
  min: number;
  max: number;
  clase: string;
  id: string;
  estamento: Estamento;
  ejemplos: string;
  mod_dinero: number;
  recursos: string;
}

export interface FilaD100 {
  min: number;
  max: number;
  [columna: string]: string | number;
}

export interface Trasfondo {
  clases: Record<string, ClaseSocial[]>;
  clases_credo: Record<string, ClaseSocial[]>;
  dinero: Record<string, { dados: string; multiplicador: number }>;
  equipo_inicial: { clase: string; estamentos: Estamento[]; ropa: string; armas: string; armadura: string; transporte: string }[];
  estamentos: Estamento[];
  padres: FilaD100[];
  hermanos: FilaD100[];
  familia_extendida: FilaD100[];
  reputacion: FilaD100[];
  conexiones: FilaD100[];
  eventos: FilaD100[];
}

/** Fila de una tabla por umbrales: {min, max, valor} o una fila de progresión {clave, valor}. */
export interface FilaUmbral {
  min?: number | null;
  max?: number | null;
  clave?: string;
  valor: string;
  azar?: string;
}

export interface Reglas {
  mod_dano: FilaUmbral[];
  mod_experiencia: FilaUmbral[];
  curacion: FilaUmbral[];
  suerte: FilaUmbral[];
  pg: { rangos: string[]; localizaciones: { localizacion: string; valores: string[] }[] };
  edades: { id: string; categoria: string; edad: string; puntos: number; max_incremento: number }[];
  piramide_texto: string[];
  pasiones: { objeto: string; ejemplos: string; base: string; formula: string }[];
  fichas_piramide: { valores: number[]; tope: number; min_profesionales: number; recomendado_estilo: boolean };
  compra_caracteristicas: {
    puntos: number;
    rangos: Record<Caracteristica, [number, number]>;
    tiradas: Record<Caracteristica, string>;
  };
  formulas_iniciales: FilaUmbral[];
}

export interface EstiloCombate {
  id: string;
  nombre: string;
  tipo: 'cultural' | 'profesional' | 'raro';
  armas: string[];
  rasgos: string[];
  rasgos_alternativos: boolean;
  contexto: string;
  culturas: string[];
}

export interface Formula extends Entrada {
  coleccion: 'reinos';
  forma: string;
  vis: number;
  naturaleza: string;
  origen: string;
  rango: 'I' | 'II' | 'III' | 'IV' | 'V';
  dominios: string[];
  ritual: boolean;
  goecia: boolean;
}

export interface Ritual extends Entrada {
  ordo: number;
  ordo_nombre: string;
  sacramento: boolean;
  estado_gracia: boolean;
  pf_requeridos: number;
  penalizador: number;
  credos: string[];
}

export interface Grimorio extends Entrada {
  autor: string;
  idioma: string;
  ensenar: number;
  estudio_maximo: number;
  dominios: string[];
}

export interface GrupoNomina extends Entrada {
  varones: string[];
  mujeres: string[];
  costumbre: string;
}

export interface Arma {
  id: string;
  nombre: string;
  /** Solo cuerpo a cuerpo: «Espadas», «Espadones (a dos manos)»… */
  grupo?: string;
  aclaracion?: string;
  dano: string;
  /** Cuerpo a cuerpo y escudos: tamaño y alcance. */
  tam?: string;
  alcance?: string;
  /** A distancia: si suma el Modificador de Daño, potencia y recarga. */
  suma_md?: boolean;
  potencia?: string;
  recarga?: string;
  efectos: string[];
  rasgos?: string[];
  notas?: string;
  car: number;
  pa: number | null;
  pg: number | null;
  condicion: string[];
  precio: number | null;
  precio_texto: string;
}

export interface Armadura {
  id: string;
  nombre: string;
  pa: number | null;
  cubre: string[];
  car: number;
  precio: number | null;
  precio_texto: string;
}

export interface CatalogoArmas {
  cuerpo_a_cuerpo: Arma[];
  distancia: Arma[];
  escudos: Arma[];
  armaduras: Armadura[];
  cascos: Armadura[];
}

export interface ObjetoEquipo {
  id: string;
  nombre: string;
  categoria: string;
  precio: number | null;
  precio_texto: string;
  car?: number | null;
}
