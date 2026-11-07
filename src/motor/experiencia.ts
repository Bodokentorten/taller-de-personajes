// Mejora del personaje (fuente: «Mejora del Personaje y Experiencia»). Todas las funciones modifican el
// personaje que reciben y devuelven el cambio anotado en el historial (o un error).
import type { Catalogo } from '../datos/catalogo';
import type { Caracteristica } from '../datos/tipos';
import { tirar, type Aleatorio } from './dados';
import { calcularHabilidades, nombreHabilidad, valorDe } from './habilidades';
import { avisoEstudioGoetico } from './magia';
import { valorPasion } from './pasiones';
import {
  caracteristicasActuales,
  experienciaVacia,
  partirClave,
  type Cambio,
  type Experiencia,
  type Personaje,
  type TipoCambio,
} from './personaje';

export const COSTE_HABILIDAD_NUEVA = 3;
export const COSTE_PASION_NUEVA = 1;

export type Resultado = { ok: true; cambio: Cambio } | { ok: false; error: string };

export function experiencia(p: Personaje): Experiencia {
  if (!p.experiencia) p.experiencia = experienciaVacia();
  return p.experiencia;
}

function anotar(
  p: Personaje,
  tipo: TipoCambio,
  detalle: string,
  delta: number,
  coste: number,
  objeto?: string,
): Cambio {
  const e = experiencia(p);
  const c: Cambio = {
    fecha: new Date().toISOString(),
    entrega: e.entrega,
    tipo,
    objeto,
    detalle,
    delta,
    coste,
  };
  e.historial.push(c);
  e.tiradas -= coste;
  return c;
}

const sumarExperiencia = (p: Personaje, clave: string, n: number) => {
  const a = p.asignaciones.find((x) => x.fuente === 'experiencia' && x.clave === clave);
  if (a) a.puntos += n;
  else p.asignaciones.push({ clave, fuente: 'experiencia', puntos: n });
};

/** El DJ concede tiradas: abre una entrega nueva (cada habilidad se puede tirar una vez por entrega). */
export function otorgarTiradas(
  p: Personaje,
  n: number,
  conModificador: boolean,
  modExperiencia: number,
  ordoActual?: number,
): Cambio {
  const e = experiencia(p);
  e.entrega += 1;
  // Al empezar a jugar se congela el ordo: los siguientes hay que estudiarlos (aprenderOrdo).
  if (e.ordo === undefined && ordoActual !== undefined) e.ordo = ordoActual;
  const total = Math.max(0, n + (conModificador ? modExperiencia : 0));
  const c = anotar(
    p,
    'otorgadas',
    `${total} tiradas de experiencia${conModificador ? ` (${n} ${modExperiencia >= 0 ? '+' : '−'} ${Math.abs(modExperiencia)} por CAR)` : ''}`,
    total,
    0,
  );
  e.tiradas += total;
  return c;
}

/** ¿Se ha tirado ya esta habilidad (o Pasión) en la entrega actual? */
export function yaTirada(p: Personaje, objeto: string): boolean {
  const e = experiencia(p);
  return e.historial.some(
    (c) =>
      c.entrega === e.entrega &&
      c.objeto === objeto &&
      (c.tipo === 'habilidad' || c.tipo === 'pasion'),
  );
}

/** 1d100 + INT contra el valor: si iguala o supera, +1d4+1; si no, +1. */
export function tiradaMejora(valor: number, int: number, azar?: Aleatorio) {
  const d100 = tirar('1d100', azar).total;
  const exito = d100 + int >= valor;
  const delta = exito ? tirar('1d4+1', azar).total : 1;
  return { d100, total: d100 + int, exito, delta };
}

export function mejorarHabilidad(
  p: Personaje,
  cat: Catalogo,
  clave: string,
  azar?: Aleatorio,
): Resultado {
  const e = experiencia(p);
  if (e.tiradas < 1) return { ok: false, error: 'No quedan tiradas de experiencia.' };
  if (yaTirada(p, clave))
    return { ok: false, error: 'Esa habilidad ya se ha tirado en esta entrega.' };
  const valor = valorDe(calcularHabilidades(p, cat), clave);
  const int = caracteristicasActuales(p).INT;
  const t = tiradaMejora(valor, int, azar);
  sumarExperiencia(p, clave, t.delta);
  e.entrenadas = e.entrenadas.filter((x) => x !== clave); // ya puede volver a entrenarse
  const nombre = nombreHabilidad(cat, clave);
  return {
    ok: true,
    cambio: anotar(
      p,
      'habilidad',
      `${nombre}: 1d100 (${t.d100}) + INT ${int} = ${t.total} contra ${valor}% → +${t.delta}${avisoEstudioGoetico(p, cat, clave, valor, valor + t.delta)}`,
      t.delta,
      1,
      clave,
    ),
  };
}

/** Aprender de los errores: +1 gratuito a cada habilidad pifiada (no se acumula). */
export function aplicarPifias(p: Personaje, cat: Catalogo, claves: string[]): Cambio[] {
  return [...new Set(claves)].map((c) => {
    sumarExperiencia(p, c, 1);
    return anotar(p, 'pifia', `${nombreHabilidad(cat, c)}: +1 por pifia`, 1, 0, c);
  });
}

export function mejorarPasion(
  p: Personaje,
  cat: Catalogo,
  indice: number,
  azar?: Aleatorio,
): Resultado {
  const e = experiencia(p);
  const x = p.pasiones[indice];
  if (!x) return { ok: false, error: 'Pasión desconocida.' };
  if (e.tiradas < 1) return { ok: false, error: 'No quedan tiradas de experiencia.' };
  const objeto = `pasion:${indice}`;
  if (yaTirada(p, objeto))
    return { ok: false, error: 'Esa Pasión ya se ha tirado en esta entrega.' };
  const valor = valorPasion(x, p, cat) ?? 0;
  const int = caracteristicasActuales(p).INT;
  const t = tiradaMejora(valor, int, azar);
  x.experiencia = (x.experiencia ?? 0) + t.delta;
  return {
    ok: true,
    cambio: anotar(
      p,
      'pasion',
      `${x.nombre}: 1d100 (${t.d100}) + INT ${int} = ${t.total} contra ${valor}% → +${t.delta}`,
      t.delta,
      1,
      objeto,
    ),
  };
}

export function nuevaPasion(p: Personaje, nombre: string, tipo: number): Resultado {
  if (experiencia(p).tiradas < COSTE_PASION_NUEVA)
    return { ok: false, error: 'No quedan tiradas de experiencia.' };
  if (!nombre.trim()) return { ok: false, error: 'Falta el nombre de la Pasión.' };
  p.pasiones.push({ nombre: nombre.trim(), tipo, orden: 3, adquirida: true });
  return {
    ok: true,
    cambio: anotar(
      p,
      'nueva-pasion',
      `Nueva Pasión: ${nombre.trim()}`,
      0,
      COSTE_PASION_NUEVA,
      `pasion:${p.pasiones.length - 1}`,
    ),
  };
}

/** Aprender una habilidad profesional nueva: 1 mes de estudio y 3 tiradas; empieza en su porcentaje básico. */
export function aprenderHabilidad(p: Personaje, cat: Catalogo, clave: string): Resultado {
  if (experiencia(p).tiradas < COSTE_HABILIDAD_NUEVA) {
    return { ok: false, error: `Hacen falta ${COSTE_HABILIDAD_NUEVA} tiradas de experiencia.` };
  }
  const { habilidad, especialidad } = partirClave(clave);
  const h = cat.habilidades.find((x) => x.id === habilidad);
  if (!h) return { ok: false, error: 'Habilidad desconocida.' };
  if (h.especialidades && !especialidad)
    return { ok: false, error: `Indica la especialidad de ${h.nombre}.` };
  if (calcularHabilidades(p, cat).some((x) => x.clave === clave))
    return { ok: false, error: 'Ya la conoce.' };
  p.asignaciones.push({ clave, fuente: 'experiencia', puntos: 0 });
  return {
    ok: true,
    cambio: anotar(
      p,
      'nueva-habilidad',
      `Aprende ${nombreHabilidad(cat, clave)} (1 mes de estudio)`,
      0,
      COSTE_HABILIDAD_NUEVA,
      clave,
    ),
  };
}

/** Coste de subir 1 punto una característica: 1 + valor actual − mínimo de la especie. TAM no se entrena. */
export function costeCaracteristica(
  p: Personaje,
  cat: Catalogo,
  c: Caracteristica,
): number | undefined {
  if (c === 'TAM') return undefined;
  const [min, max] = cat.reglas.compra_caracteristicas.rangos[c];
  const actual = caracteristicasActuales(p)[c];
  if (actual >= max) return undefined;
  return 1 + actual - min;
}

export function mejorarCaracteristica(p: Personaje, cat: Catalogo, c: Caracteristica): Resultado {
  const coste = costeCaracteristica(p, cat, c);
  if (coste === undefined)
    return {
      ok: false,
      error:
        c === 'TAM' ? 'El TAM no se puede entrenar.' : `${c} ya está en el máximo de la especie.`,
    };
  if (experiencia(p).tiradas < coste)
    return { ok: false, error: `Subir ${c} cuesta ${coste} tiradas.` };
  const antes = caracteristicasActuales(p)[c];
  p.caracteristicas.mejoras = {
    ...p.caracteristicas.mejoras,
    [c]: (p.caracteristicas.mejoras?.[c] ?? 0) + 1,
  };
  return {
    ok: true,
    cambio: anotar(p, 'caracteristica', `${c} ${antes} → ${antes + 1}`, 1, coste, c),
  };
}

// --------------------------------------------------------------------------- Entrenamiento

/** Tabla de mejoras por entrenamiento: diferencia mentor − alumno → dados (filas de 10 en 10 desde 21). */
export const FILAS_ENTRENAMIENTO = ['1d2', '1d3', '1d4', '1d6', '1d6+1', '1d6+2', '1d6+3', '1d6+4'];

export type ResultadoEnseñar = 'ninguno' | 'critico' | 'exito' | 'fallo' | 'pifia';

/** Fila de la tabla (0 = 21–30%), desplazada por la tirada de Enseñar del profesor; undefined si no aprende nada. */
export function filaEntrenamiento(
  diferencia: number,
  enseñar: ResultadoEnseñar,
): number | undefined {
  if (diferencia < 21) return undefined;
  let fila = Math.floor((diferencia - 21) / 10);
  fila += enseñar === 'critico' ? 2 : enseñar === 'exito' ? 1 : enseñar === 'pifia' ? -1 : 0;
  return fila < 0 ? undefined : fila;
}

/** Dados de mejora de una fila: más allá de la tabla, +1 por cada 10% adicional. */
export function dadosEntrenamiento(fila: number): string {
  if (fila < FILAS_ENTRENAMIENTO.length) return FILAS_ENTRENAMIENTO[fila]!;
  return `1d6+${4 + fila - (FILAS_ENTRENAMIENTO.length - 1)}`;
}

export function entrenar(
  p: Personaje,
  cat: Catalogo,
  clave: string,
  mentor: number,
  enseñar: ResultadoEnseñar,
  azar?: Aleatorio,
): Resultado {
  const e = experiencia(p);
  if (e.entrenadas.includes(clave)) {
    return {
      ok: false,
      error:
        'Esa habilidad ya se entrenó: no puede volver a entrenarse hasta que suba con una tirada de experiencia.',
    };
  }
  const valor = valorDe(calcularHabilidades(p, cat), clave);
  const diferencia = mentor - valor;
  const fila = filaEntrenamiento(diferencia, enseñar);
  if (diferencia < 21)
    return {
      ok: false,
      error: `El maestro necesita al menos un 20% más (tiene ${diferencia}% más).`,
    };
  e.entrenadas.push(clave);
  const nombre = nombreHabilidad(cat, clave);
  if (fila === undefined) {
    return {
      ok: true,
      cambio: anotar(
        p,
        'entrenamiento',
        `${nombre}: una semana con maestro, sin provecho (pifia en Enseñar)`,
        0,
        0,
        clave,
      ),
    };
  }
  const dados = dadosEntrenamiento(fila);
  const delta = tirar(dados, azar).total;
  sumarExperiencia(p, clave, delta);
  return {
    ok: true,
    cambio: anotar(
      p,
      'entrenamiento',
      `${nombre}: una semana con un maestro al ${mentor}% → ${dados} = +${delta}${avisoEstudioGoetico(p, cat, clave, valor, valor + delta)}`,
      delta,
      0,
      clave,
    ),
  };
}

// --------------------------------------------------------------------------- Magia y fe

/** Semanas de estudio de una fórmula según su vis («Grimorios y aprendizaje de fórmulas»). */
const SEMANAS_POR_VIS: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 5, 6: 5, 7: 10 };

export function aprenderFormula(p: Personaje, cat: Catalogo, id: string, como: string): Resultado {
  const f = cat.formulas.find((x) => x.id === id);
  if (!f) return { ok: false, error: 'Fórmula desconocida.' };
  if ([...p.magia.formulas, ...(p.magia.formulasAprendidas ?? [])].includes(id))
    return { ok: false, error: 'Ya la conoce.' };
  p.magia.formulasAprendidas = [...(p.magia.formulasAprendidas ?? []), id];
  return {
    ok: true,
    cambio: anotar(
      p,
      'formula',
      `Aprende la fórmula ${f.nombre} (${como}; ${SEMANAS_POR_VIS[f.vis] ?? f.vis} semanas)${f.goecia ? ' · goecia: tirada de Fuerza de voluntad o +1 Corrupción' : ''}`,
      0,
      0,
      id,
    ),
  };
}

export function aprenderOrdo(p: Personaje, ordoActual: number, alcanzable: number): Resultado {
  if (ordoActual >= alcanzable)
    return { ok: false, error: 'Aún no alcanza el siguiente ordo (PF y Teología).' };
  experiencia(p).ordo = ordoActual + 1;
  return {
    ok: true,
    cambio: anotar(
      p,
      'ordo',
      `Aprende los rituales del ordo ${ordoActual + 1} (estudio y tirada de Fe superada)`,
      1,
      0,
    ),
  };
}
