import { CARACTERISTICAS, type Caracteristica } from '../datos/tipos';

export type Contexto = Record<Caracteristica, number> & {
  SUJETO?: Partial<Record<'POD' | 'CAR', number>>;
};

/**
 * Evalúa las fórmulas del vault: «FUE+DES», «INT x2», «INT x2 +40», «CON+POD», «0»,
 * y las de las Pasiones: «POD*2», «SUJETO.POD+SUJETO.CAR».
 * Admite términos separados por + y -, cada uno con multiplicador opcional («x2» o «*2»).
 */
export function evaluar(formula: string, ctx: Contexto): number {
  const limpia = formula.replace(/\s+/g, '').replace(/×/g, 'x');
  if (limpia === '') throw new Error('Fórmula vacía');
  const terminos = limpia.match(/[+-]?[^+-]+/g) ?? [];
  let total = 0;
  for (const t of terminos) {
    const signo = t.startsWith('-') ? -1 : 1;
    const cuerpo = t.replace(/^[+-]/, '');
    const m = /^([A-Z.]+|\d+)(?:[x*](\d+))?$/.exec(cuerpo);
    if (!m) throw new Error(`Término no válido «${t}» en la fórmula «${formula}»`);
    const factor = m[2] ? Number(m[2]) : 1;
    total += signo * factor * valorDe(m[1]!, ctx, formula);
  }
  return total;
}

function valorDe(simbolo: string, ctx: Contexto, formula: string): number {
  if (/^\d+$/.test(simbolo)) return Number(simbolo);
  if (simbolo.startsWith('SUJETO.')) {
    const c = simbolo.slice(7) as 'POD' | 'CAR';
    const v = ctx.SUJETO?.[c];
    if (v === undefined) throw new FaltaSujeto(c);
    return v;
  }
  if ((CARACTERISTICAS as readonly string[]).includes(simbolo))
    return ctx[simbolo as Caracteristica];
  throw new Error(`Símbolo desconocido «${simbolo}» en la fórmula «${formula}»`);
}

/** La fórmula necesita una característica del sujeto de la Pasión que no se ha indicado. */
export class FaltaSujeto extends Error {
  constructor(public caracteristica: 'POD' | 'CAR') {
    super(`Falta la característica ${caracteristica} del sujeto de la Pasión`);
  }
}
