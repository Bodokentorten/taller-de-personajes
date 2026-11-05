// Biblioteca de personajes en el navegador (localStorage), con autoguardado.
import { personajeVacio, type Personaje } from '../motor/personaje';
import { leerArchivo, migrar, nuevoId, serializar } from './archivo';

const CLAVE = 'taller.personajes';

export interface Entrada {
  personaje: Personaje;
  modificado: string;
}

function leer(): Entrada[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const lista = JSON.parse(crudo) as { personaje: unknown; modificado: string }[];
    return lista.flatMap((e) => {
      try {
        return [{ personaje: migrar(e.personaje), modificado: e.modificado }];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

class Biblioteca {
  entradas = $state<Entrada[]>(leer());
  /** Último error al guardar (sin espacio, almacenamiento bloqueado…). */
  error = $state('');

  private guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify($state.snapshot(this.entradas)));
      this.error = '';
    } catch {
      this.error =
        'No se ha podido guardar en este navegador. Exporta el personaje a JSON para no perderlo.';
    }
  }

  obtener(id: string): Personaje | undefined {
    return this.entradas.find((e) => e.personaje.id === id)?.personaje;
  }

  crear(): Personaje {
    const p = personajeVacio(nuevoId());
    this.entradas.unshift({ personaje: p, modificado: new Date().toISOString() });
    this.guardar();
    return this.entradas[0]!.personaje;
  }

  /** Guarda los cambios de un personaje (se llama desde el autoguardado del asistente). */
  actualizar(p: Personaje) {
    const i = this.entradas.findIndex((e) => e.personaje.id === p.id);
    const copia = $state.snapshot(p) as Personaje;
    const entrada = { personaje: copia, modificado: new Date().toISOString() };
    if (i < 0) this.entradas.unshift(entrada);
    else this.entradas[i] = entrada;
    this.guardar();
  }

  duplicar(id: string): Personaje | undefined {
    const p = this.obtener(id);
    if (!p) return undefined;
    const copia = {
      ...($state.snapshot(p) as Personaje),
      id: nuevoId(),
      nombre: `${p.nombre || 'Sin nombre'} (copia)`,
    };
    this.entradas.unshift({ personaje: copia, modificado: new Date().toISOString() });
    this.guardar();
    return copia;
  }

  borrar(id: string) {
    this.entradas = this.entradas.filter((e) => e.personaje.id !== id);
    this.guardar();
  }

  /** Importa personajes; si ya existe uno con el mismo id, se le da un id nuevo (no se sobrescribe). */
  importar(texto: string): number {
    const nuevos = leerArchivo(texto);
    for (const p of nuevos) {
      if (this.obtener(p.id)) p.id = nuevoId();
      this.entradas.unshift({ personaje: p, modificado: new Date().toISOString() });
    }
    this.guardar();
    return nuevos.length;
  }

  exportar(ids?: string[]): string {
    const lista = this.entradas
      .filter((e) => !ids || ids.includes(e.personaje.id))
      .map((e) => $state.snapshot(e.personaje) as Personaje);
    return serializar(lista);
  }
}

export const biblioteca = new Biblioteca();

/** Descarga un texto como archivo. */
export function descargar(nombre: string, texto: string, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function nombreArchivo(base: string, ext = 'json'): string {
  const limpio = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${limpio || 'personaje'}.${ext}`;
}
