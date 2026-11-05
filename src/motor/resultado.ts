/** Problemas que encuentra el validador. Los errores impiden exportar el personaje como «válido». */
export type Gravedad = 'error' | 'aviso';

export interface Problema {
  gravedad: Gravedad;
  /** Paso del asistente al que pertenece, para llevar al jugador allí. */
  paso: Paso;
  codigo: string;
  mensaje: string;
}

export type Paso =
  | 'concepto'
  | 'caracteristicas'
  | 'origen'
  | 'trasfondo'
  | 'carrera'
  | 'habilidades'
  | 'pasiones'
  | 'magia'
  | 'equipo';

export function error(paso: Paso, codigo: string, mensaje: string): Problema {
  return { gravedad: 'error', paso, codigo, mensaje };
}

export function aviso(paso: Paso, codigo: string, mensaje: string): Problema {
  return { gravedad: 'aviso', paso, codigo, mensaje };
}

export const errores = (p: readonly Problema[]) => p.filter((x) => x.gravedad === 'error');
export const avisos = (p: readonly Problema[]) => p.filter((x) => x.gravedad === 'aviso');
