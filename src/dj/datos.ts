// Datos secretos del DJ (src/datos/dj/*.json, generados por el extractor y fuera del repositorio).
// Se cargan con import.meta.glob: si la carpeta está vacía (en GitHub Actions), las listas quedan vacías.
import { CENTINELA_DJ } from './centinela';
import type { ItemHabilidad } from '../datos/tipos';

export interface Sociedad {
  id: string;
  nombre: string;
  nota: string;
  subtipo: string;
  ambito: string;
  resumen: string;
  en_juego: string[];
  carreras: string[];
  culturas: string[];
  habilidades: ItemHabilidad[];
  estilos: string[];
  pasiones: string[];
  formulas: string[];
  ganchos: string[];
  desde: number;
  credos: string[] | null;
  estamentos: string[] | null;
  rol: string;
}

const archivos = import.meta.glob<{ default: unknown }>('../datos/dj/*.json', { eager: true });

function cargar<T>(nombre: string): T[] {
  const m = Object.entries(archivos).find(([ruta]) => ruta.endsWith(`/${nombre}.json`));
  return (m?.[1].default as T[] | undefined) ?? [];
}

export const datosDJ = {
  centinela: CENTINELA_DJ,
  sociedades: cargar<Sociedad>('sociedades'),
};
