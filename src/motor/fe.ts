// Fe y rituales (fuentes: «05 - Magia y Fe/Fe» y «Rituales de fe»).
import type { Catalogo } from '../datos/catalogo';
import type { Ritual } from '../datos/tipos';
import { valorEspecialidad, type ValorHabilidad } from './habilidades';
import { pasionFe, valorFe } from './pasiones';
import type { Personaje } from './personaje';
import { aviso, error, type Problema } from './resultado';

/** Requisitos por ordo (primus … sextus): PF actuales y Conocimiento (Teología) para conocerlo. */
export const ORDINES = [
  { ordo: 1, nombre: 'primus ordo', pf: 10, teologia: 40 },
  { ordo: 2, nombre: 'secundus ordo', pf: 13, teologia: 50 },
  { ordo: 3, nombre: 'tertius ordo', pf: 15, teologia: 60 },
  { ordo: 4, nombre: 'quartus ordo', pf: 18, teologia: 70 },
  { ordo: 5, nombre: 'quintus ordo', pf: 20, teologia: 85 },
  // El sextus exige además Santidad: nunca al crear el personaje.
  { ordo: 6, nombre: 'sextus ordo', pf: 20, teologia: 85, santidad: true },
] as const;

/** Fe mínima para obrar rituales («si la Fe baja de 50% … pierde la capacidad»). */
export const FE_MINIMA_RITUALES = 50;

/** PF máximos = Pasión Fe ÷ 5, redondeando hacia arriba. */
export function pfMaximos(fe: number): number {
  return Math.ceil(fe / 5);
}

export interface EstadoFe {
  fe: number;
  pf: number;
  puedeObrar: boolean;
  teologia: number;
  /** Ordo más alto que conoce al crear el personaje (0 = ninguno). */
  ordoMaximo: number;
  /** Ordo que permitirían ahora sus PF y su Teología (puede ser mayor que el aprendido). */
  ordoAlcanzable: number;
  rituales: Ritual[];
}

export function estadoFe(
  p: Personaje,
  cat: Catalogo,
  hoja: readonly ValorHabilidad[],
  conoceGoecia: boolean,
): EstadoFe {
  const carrera = cat.carreras.find((c) => c.id === p.carrera);
  const fe = valorFe(p, cat);
  const pf = pfMaximos(fe);
  const teologia = valorEspecialidad(hoja, 'conocimiento', 'Teología');
  const puedeObrar = Boolean(carrera?.fe) && fe >= FE_MINIMA_RITUALES && !conoceGoecia;
  let ordoAlcanzable = 0;
  if (puedeObrar) {
    for (const o of ORDINES) {
      if ('santidad' in o) break;
      if (pf >= o.pf && teologia >= o.teologia) ordoAlcanzable = o.ordo;
      else break; // se aprenden en orden
    }
  }
  // Al crear el personaje conoce todo lo que alcanza; en juego, los ordos nuevos hay que estudiarlos.
  const aprendido = p.experiencia?.ordo;
  const ordoMaximo = aprendido === undefined ? ordoAlcanzable : Math.min(aprendido, ordoAlcanzable);
  const rituales = cat.rituales.filter(
    (r) => r.ordo <= ordoMaximo && r.credos.includes(p.origen.credo),
  );
  return { fe, pf, puedeObrar, teologia, ordoMaximo, ordoAlcanzable, rituales };
}

export function validarFe(
  p: Personaje,
  cat: Catalogo,
  estado: EstadoFe,
  conoceGoecia: boolean,
): Problema[] {
  const res: Problema[] = [];
  const carrera = cat.carreras.find((c) => c.id === p.carrera);
  if (!carrera?.fe) {
    if (p.rituales.length)
      res.push(
        error(
          'magia',
          'rituales-sin-carrera',
          'Solo los ordenados (carreras con fe) conocen rituales.',
        ),
      );
    return res;
  }
  if (!pasionFe(p)) {
    res.push(
      error(
        'pasiones',
        'clerigo-sin-fe',
        `${carrera.nombre}: para obrar rituales hace falta la Pasión Fe.`,
      ),
    );
  } else if (estado.fe < FE_MINIMA_RITUALES) {
    res.push(
      aviso(
        'magia',
        'fe-baja',
        `Con Fe ${estado.fe}% no puede obrar rituales (hace falta ${FE_MINIMA_RITUALES}%).`,
      ),
    );
  }
  if (conoceGoecia) {
    res.push(
      error(
        'magia',
        'goecia-y-fe',
        'Quien conoce una fórmula de goecia o estudia una fuente goética no puede obrar rituales de fe.',
      ),
    );
  }
  if (estado.puedeObrar && estado.ordoMaximo === 0) {
    res.push(
      aviso(
        'magia',
        'sin-ordo',
        `Para conocer el primus ordo hacen falta 10 PF y Conocimiento (Teología) 40% (tiene ${estado.pf} PF y ${estado.teologia}%).`,
      ),
    );
  }
  const conocidos = new Set(estado.rituales.map((r) => r.id));
  for (const r of p.rituales) {
    if (!conocidos.has(r)) {
      const rit = cat.rituales.find((x) => x.id === r);
      res.push(
        error(
          'magia',
          'ritual-no-accesible',
          `No puede conocer «${rit?.nombre ?? r}»: no llega a su ordo o no es de su credo.`,
        ),
      );
    }
  }
  return res;
}
