import type { Catalogo } from '../../datos/catalogo';
import type { Personaje } from '../../motor/personaje';
import type { Paso, Problema } from '../../motor/resultado';

export interface DefinicionPaso {
  id: string;
  titulo: string;
  /** Pasos del motor cuyos problemas se muestran en este paso. */
  problemas: Paso[];
  visible?: (p: Personaje, cat: Catalogo) => boolean;
}

export const PASOS: DefinicionPaso[] = [
  { id: 'concepto', titulo: 'Concepto', problemas: ['concepto'] },
  { id: 'caracteristicas', titulo: 'Características', problemas: ['caracteristicas'] },
  { id: 'atributos', titulo: 'Atributos', problemas: [] },
  { id: 'origen', titulo: 'Origen y cultura', problemas: ['origen'] },
  { id: 'trasfondo', titulo: 'Trasfondo', problemas: ['trasfondo'] },
  { id: 'carrera', titulo: 'Carrera', problemas: ['carrera'] },
  { id: 'habilidades', titulo: 'Habilidades', problemas: ['habilidades'] },
  { id: 'pasiones', titulo: 'Pasiones', problemas: ['pasiones'] },
  {
    id: 'magia',
    titulo: 'Magia y fe',
    problemas: ['magia'],
    visible: (p, cat) => {
      const c = cat.carreras.find((x) => x.id === p.carrera);
      return Boolean(c?.magia || c?.fe);
    },
  },
  { id: 'equipo', titulo: 'Equipo', problemas: ['equipo'] },
];

export function pasosVisibles(p: Personaje, cat: Catalogo): DefinicionPaso[] {
  return PASOS.filter((x) => !x.visible || x.visible(p, cat));
}

export type EstadoPaso = 'ok' | 'aviso' | 'error';

export function estadoPaso(d: DefinicionPaso, problemas: readonly Problema[]): EstadoPaso {
  const propios = problemas.filter((x) => d.problemas.includes(x.paso));
  if (propios.some((x) => x.gravedad === 'error')) return 'error';
  if (propios.length) return 'aviso';
  return 'ok';
}
