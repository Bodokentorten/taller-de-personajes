// Paso 8: Pasiones (fuente: «Pasiones y Equipo Inicial») y la Pasión Fe («05 - Magia y Fe/Fe»).
import type { Catalogo } from '../datos/catalogo';
import { evaluar, FaltaSujeto } from './formulas';
import { caracteristicasActuales, type Pasion, type Personaje } from './personaje';
import { aviso, error, type Problema } from './resultado';

/** Bono inicial según el orden de importancia: +40, +30 y +20. */
export const BONO_PASION = { 1: 40, 2: 30, 3: 20 } as const;
export const MAX_PASIONES = 3;

export function valorPasion(x: Pasion, p: Personaje, cat: Catalogo): number | undefined {
  const tipo = cat.reglas.pasiones[x.tipo];
  if (!tipo) return undefined;
  try {
    const base = evaluar(tipo.formula, { ...caracteristicasActuales(p), SUJETO: x.sujeto });
    const bono = x.adquirida ? 0 : BONO_PASION[x.orden];
    return base + bono + (x.extra ?? 0) + (x.experiencia ?? 0);
  } catch (e) {
    if (e instanceof FaltaSujeto) return undefined;
    throw e;
  }
}

/** Índice del tipo de Pasión «organización o grupo» (la Fe es POD+INT como una organización o un ideal). */
export function tipoFe(cat: Catalogo): number {
  return cat.reglas.pasiones.findIndex((t) => t.formula === 'POD+INT');
}

export function pasionFe(p: Personaje): Pasion | undefined {
  return p.pasiones.find((x) => x.fe);
}

export function valorFe(p: Personaje, cat: Catalogo): number {
  const f = pasionFe(p);
  return f ? (valorPasion(f, p, cat) ?? 0) : 0;
}

export function validarPasiones(p: Personaje, cat: Catalogo): Problema[] {
  const res: Problema[] = [];
  // Las reglas de la creación solo se aplican a las Pasiones iniciales.
  const iniciales = p.pasiones.filter((x) => !x.adquirida);
  if (iniciales.length > MAX_PASIONES) {
    res.push(
      error(
        'pasiones',
        'demasiadas',
        `Un personaje nuevo empieza con ${MAX_PASIONES} Pasiones como mucho.`,
      ),
    );
  }
  const ordenes = iniciales.map((x) => x.orden);
  if (new Set(ordenes).size !== ordenes.length) {
    res.push(
      error(
        'pasiones',
        'orden-repetido',
        'Cada Pasión debe tener un orden distinto (+40, +30, +20).',
      ),
    );
  }
  for (const x of p.pasiones) {
    if (!x.nombre.trim()) res.push(error('pasiones', 'sin-nombre', 'Hay una Pasión sin nombre.'));
    if (!cat.reglas.pasiones[x.tipo])
      res.push(error('pasiones', 'tipo', `Tipo de Pasión desconocido para «${x.nombre}».`));
    else if (valorPasion(x, p, cat) === undefined) {
      res.push(
        error(
          'pasiones',
          'sin-sujeto',
          `«${x.nombre}»: indica el POD y el CAR de la persona (o pide al DJ que los fije).`,
        ),
      );
    }
    if (x.extra && p.metodoHabilidades !== 'piramide') {
      res.push(
        error(
          'pasiones',
          'extra',
          `«${x.nombre}»: solo con la pirámide puede recibir puntos extra al crear el personaje.`,
        ),
      );
    }
  }
  const credo = cat.credos.find((c) => c.id === p.origen.credo);
  const fes = p.pasiones.filter((x) => x.fe);
  if (fes.length > 1) res.push(error('pasiones', 'varias-fe', 'Solo puede haber una Pasión Fe.'));
  if (credo && fes.length === 0) {
    res.push(
      aviso(
        'pasiones',
        'sin-fe',
        `Casi todo el mundo tiene la Pasión ${credo.pasion_fe}; sin ella no se resiste lo sobrenatural ni se obran rituales.`,
      ),
    );
  }
  const fe = fes[0];
  if (fe && fe.tipo !== tipoFe(cat)) {
    res.push(
      error(
        'pasiones',
        'fe-tipo',
        'La Fe es una Pasión hacia una organización o un ideal (POD + INT).',
      ),
    );
  }
  if (fe && credo && !fe.nombre.toLowerCase().startsWith('fe')) {
    res.push(
      aviso('pasiones', 'fe-nombre', `La Pasión Fe de tu credo se llama «${credo.pasion_fe}».`),
    );
  }
  return res;
}
