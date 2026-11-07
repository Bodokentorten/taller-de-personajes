// Formato de los archivos JSON (copia de un personaje o de toda la biblioteca) y migraciones.
import { personajeVacio, VERSION_PERSONAJE, type Personaje } from '../motor/personaje';
import { GRIMORIOS_RENOMBRADOS } from '../motor/magia';

export const FORMATO = 'taller-de-personajes';

export interface ArchivoBiblioteca {
  formato: typeof FORMATO;
  version: number;
  exportado: string;
  personajes: Personaje[];
}

export function nuevoId(): string {
  const azar =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return azar.slice(0, 13);
}

/**
 * Lleva un personaje guardado al modelo actual: rellena los campos que falten con los valores de un
 * personaje vacío (así, un JSON antiguo sigue cargando cuando el modelo crece).
 */
export function migrar(dato: unknown): Personaje {
  if (!dato || typeof dato !== 'object') throw new Error('No es un personaje.');
  const p = dato as Partial<Personaje> & { version?: number };
  if (typeof p.id !== 'string') throw new Error('Al personaje le falta el id.');
  if (p.version !== undefined && p.version > VERSION_PERSONAJE) {
    throw new Error(`El personaje es de una versión más nueva del taller (${p.version}).`);
  }
  const base = personajeVacio(p.id);
  // Grimorios renombrados en el vault (De Feits lo Diable → De Feits de l'Àngel, 2026-11-06).
  for (const f of p.magia?.fuentes ?? []) {
    if (f.grimorio && GRIMORIOS_RENOMBRADOS[f.grimorio])
      f.grimorio = GRIMORIOS_RENOMBRADOS[f.grimorio];
  }
  return {
    ...base,
    ...p,
    version: VERSION_PERSONAJE,
    caracteristicas: { ...base.caracteristicas, ...p.caracteristicas },
    origen: { ...base.origen, ...p.origen },
    magia: { ...base.magia, ...p.magia },
    dinero: { ...base.dinero, ...p.dinero },
    trasfondo: { ...base.trasfondo, ...p.trasfondo },
  };
}

export function serializar(personajes: Personaje[]): string {
  const a: ArchivoBiblioteca = {
    formato: FORMATO,
    version: VERSION_PERSONAJE,
    exportado: new Date().toISOString(),
    personajes,
  };
  return JSON.stringify(a, null, 1);
}

/** Lee un archivo exportado (biblioteca completa o un solo personaje). */
export function leerArchivo(texto: string): Personaje[] {
  let dato: unknown;
  try {
    dato = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (dato && typeof dato === 'object' && (dato as ArchivoBiblioteca).formato === FORMATO) {
    const lista = (dato as ArchivoBiblioteca).personajes;
    if (!Array.isArray(lista)) throw new Error('El archivo no contiene personajes.');
    return lista.map(migrar);
  }
  // Un personaje suelto
  return [migrar(dato)];
}
