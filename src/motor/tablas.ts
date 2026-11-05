import type { FilaUmbral } from '../datos/tipos';

/**
 * Busca un valor en una tabla por umbrales del vault («6 o menos», «7-12», «13-18», «Cada 6 puntos: +1»).
 * Si el valor pasa del último tramo y hay una fila de progresión («Cada N puntos» con «+k»), suma k por
 * cada N puntos (o fracción) de más: con «13-18 → 3» y «Cada 6 puntos +1», 19–24 → 4 y 25–30 → 5.
 */
export function buscarUmbral(tabla: readonly FilaUmbral[], valor: number): string {
  for (const f of tabla) {
    if (f.clave !== undefined) continue;
    const min = f.min ?? Number.NEGATIVE_INFINITY;
    const max = f.max ?? Number.POSITIVE_INFINITY;
    if (valor >= min && valor <= max) return f.valor;
  }
  const tramos = tabla.filter((f) => f.clave === undefined && f.max != null);
  const ultimo = tramos[tramos.length - 1];
  const prog = tabla.find((f) => f.clave !== undefined);
  if (!ultimo || ultimo.max == null) throw new Error('Tabla por umbrales vacía');
  if (valor < (tramos[0]?.min ?? 0)) return tramos[0]!.valor;
  const paso = prog ? Number(/(\d+)/.exec(prog.clave!)?.[1]) : NaN;
  const inc = prog ? Number(/^\+?(-?\d+)$/.exec(prog.valor.trim())?.[1]) : NaN;
  if (!Number.isFinite(paso) || !Number.isFinite(inc)) {
    // Progresión no numérica (Modificador de Daño): se devuelve el último tramo.
    return ultimo.valor;
  }
  const extra = Math.ceil((valor - ultimo.max) / paso) * inc;
  return conSigno(
    Number(ultimo.valor.replace('+', '')) + extra,
    ultimo.valor.trim().startsWith('+'),
  );
}

export function buscarUmbralNumero(tabla: readonly FilaUmbral[], valor: number): number {
  return Number(buscarUmbral(tabla, valor).replace('–', '-').replace('+', ''));
}

function conSigno(n: number, signo: boolean): string {
  return signo && n >= 0 ? `+${n}` : String(n);
}

/** «1–5» → [1, 5]; «+5» → null (fila de progresión). */
export function rango(texto: string): [number, number] | null {
  const m = /^(\d+)\s*[–-]\s*(\d+)$/.exec(texto.trim());
  return m ? [Number(m[1]), Number(m[2])] : null;
}
