// Paso 3: Atributos (fuente: «Características y Atributos», Paso 3).
import type { Reglas } from '../datos/tipos';
import type { Valores } from './caracteristicas';
import { buscarUmbral, buscarUmbralNumero, rango } from './tablas';

export const LOCALIZACIONES = [
  { id: 'cabeza', nombre: 'Cabeza', fila: 'Cabeza', d20: [19, 20] },
  { id: 'brazo-izq', nombre: 'Brazo izquierdo', fila: 'Cada brazo', d20: [16, 18] },
  { id: 'brazo-der', nombre: 'Brazo derecho', fila: 'Cada brazo', d20: [13, 15] },
  { id: 'pecho', nombre: 'Pecho', fila: 'Pecho', d20: [10, 12] },
  { id: 'abdomen', nombre: 'Abdomen', fila: 'Abdomen', d20: [7, 9] },
  { id: 'pierna-izq', nombre: 'Pierna izquierda', fila: 'Cada pierna', d20: [4, 6] },
  { id: 'pierna-der', nombre: 'Pierna derecha', fila: 'Cada pierna', d20: [1, 3] },
] as const;

export type IdLocalizacion = (typeof LOCALIZACIONES)[number]['id'];

export interface Atributos {
  puntosAccion: number;
  modDano: string;
  modExperiencia: number;
  curacion: number;
  pg: Record<IdLocalizacion, number>;
  iniciativa: number;
  suerte: number;
  puntosMagia: number;
  movimiento: number;
}

/** PG de una localización: tabla por tramos de CON+TAM y +1 por cada 5 puntos (o fracción) por encima. */
export function pgLocalizacion(reglas: Reglas, fila: string, conTam: number): number {
  const loc = reglas.pg.localizaciones.find((l) => l.localizacion === fila);
  if (!loc) throw new Error(`Localización desconocida en la tabla de PG: ${fila}`);
  let ultimoMax = 0;
  let ultimoValor = 0;
  for (let i = 0; i < reglas.pg.rangos.length; i++) {
    const r = rango(reglas.pg.rangos[i]!);
    const v = Number(loc.valores[i]);
    if (!r) continue;
    if (conTam >= r[0] && conTam <= r[1]) return v;
    ultimoMax = r[1];
    ultimoValor = v;
  }
  if (conTam < 1) return Number(loc.valores[0]);
  const incremento = Number(loc.valores[loc.valores.length - 1]!.replace('+', '')) || 1;
  return ultimoValor + Math.ceil((conTam - ultimoMax) / 5) * incremento;
}

export function calcularAtributos(v: Valores, reglas: Reglas): Atributos {
  const pg = {} as Record<IdLocalizacion, number>;
  for (const l of LOCALIZACIONES) pg[l.id] = pgLocalizacion(reglas, l.fila, v.CON + v.TAM);
  return {
    // «Todos los personajes de Mythras Imperative tienen 2 Puntos de Acción».
    puntosAccion: 2,
    modDano: buscarUmbral(reglas.mod_dano, v.FUE + v.TAM).replace('–', '-'),
    modExperiencia: buscarUmbralNumero(reglas.mod_experiencia, v.CAR),
    curacion: buscarUmbralNumero(reglas.curacion, v.CON),
    pg,
    // «La Iniciativa es el promedio de DES e INT»; se redondea hacia arriba, como en Mythras.
    iniciativa: Math.ceil((v.DES + v.INT) / 2),
    suerte: buscarUmbralNumero(reglas.suerte, v.POD),
    puntosMagia: v.POD,
    movimiento: 6,
  };
}

/** Penalizador de armadura a la Iniciativa: −⌈CAR total de armadura puesta ÷ 5⌉. */
export function penalizadorArmadura(carArmadura: number): number {
  return carArmadura > 0 ? -Math.ceil(carArmadura / 5) : 0;
}
