// Equipo comprado: resuelve los ids con prefijo de catálogo y calcula coste y carga.
import type { Catalogo } from '../datos/catalogo';
import { cargaTotal, estadoCarga, type EstadoCarga } from './economia';
import { caracteristicasActuales, type Personaje } from './personaje';

export type TipoObjeto = 'arma' | 'distancia' | 'escudo' | 'armadura' | 'casco' | 'equipo';

export interface ObjetoResuelto {
  id: string;
  tipo: TipoObjeto;
  nombre: string;
  categoria: string;
  precio: number | null;
  precioTexto: string;
  car: number;
  /** Solo armaduras y cascos: localizaciones y PA. */
  cubre?: string[];
  pa?: number | null;
}

export function catalogoEquipo(cat: Catalogo): ObjetoResuelto[] {
  const a = cat.armas;
  return [
    ...a.cuerpo_a_cuerpo.map((x) => ({
      id: `arma:${x.id}`,
      tipo: 'arma' as const,
      nombre: x.nombre,
      categoria: x.grupo ? `Armas: ${x.grupo}` : 'Armas cuerpo a cuerpo',
      precio: x.precio,
      precioTexto: x.precio_texto,
      car: x.car,
    })),
    ...a.distancia.map((x) => ({
      id: `distancia:${x.id}`,
      tipo: 'distancia' as const,
      nombre: x.nombre,
      categoria: 'Armas a distancia',
      precio: x.precio,
      precioTexto: x.precio_texto,
      car: x.car,
    })),
    ...a.escudos.map((x) => ({
      id: `escudo:${x.id}`,
      tipo: 'escudo' as const,
      nombre: x.nombre,
      categoria: 'Escudos',
      precio: x.precio,
      precioTexto: x.precio_texto,
      car: x.car,
    })),
    ...a.armaduras.map((x) => ({
      id: `armadura:${x.id}`,
      tipo: 'armadura' as const,
      nombre: x.nombre,
      categoria: 'Armaduras',
      precio: x.precio,
      precioTexto: x.precio_texto,
      car: x.car,
      cubre: x.cubre,
      pa: x.pa,
    })),
    ...a.cascos.map((x) => ({
      id: `casco:${x.id}`,
      tipo: 'casco' as const,
      nombre: x.nombre,
      categoria: 'Cascos',
      precio: x.precio,
      precioTexto: x.precio_texto,
      car: x.car,
      cubre: x.cubre,
      pa: x.pa,
    })),
    ...cat.equipo.map((x) => ({
      id: `equipo:${x.id}`,
      tipo: 'equipo' as const,
      nombre: x.nombre,
      categoria: x.categoria,
      precio: x.precio,
      precioTexto: x.precio_texto,
      car: x.car ?? 0,
    })),
  ];
}

// --------------------------------------------------------------------------- Contenedores

/**
 * Contenedores (fuente: «Carga y Movimiento (ENC)»): morral o zurrón, CAR 1 y hasta 20 CAR dentro; saco,
 * CAR 0 y hasta 30. Las alforjas y las albardas van en la montura o la bestia de carga: lo que se guarda
 * en ellas figura en el inventario pero no pesa sobre el personaje.
 */
export const CONTENEDORES: Record<string, { capacidad?: number; car?: number; animal?: boolean }> =
  {
    'equipo:morral': { capacidad: 20, car: 1 },
    'equipo:zurron': { capacidad: 20, car: 1 },
    'equipo:saco': { capacidad: 30, car: 0 },
    'equipo:alforjas': { animal: true },
    'equipo:albardas': { animal: true },
  };

/** Categorías del mercado que no se llevan encima (animales, carros, barcos, propiedades, servicios…). */
const NO_SE_LLEVAN = new Set([
  'Monturas y pertrechos',
  'Ganado y animales',
  'Carros y carruajes',
  'Embarcaciones',
  'Propiedades',
  'Servicios',
  'Alojamiento',
  'Comidas (una ración)',
  'Mercancías al por mayor (por 1.000 libras)',
]);

export type Ubicacion = 'encima' | 'contenedor' | 'soltado' | 'animal' | 'fuera';

export const NOMBRE_UBICACION: Record<Ubicacion, string> = {
  encima: 'encima',
  contenedor: 'en un contenedor',
  soltado: 'soltado',
  animal: 'en la montura',
  fuera: 'no se lleva encima',
};

export interface ObjetoEnInventario extends ObjetoResuelto {
  /** Posición de la entrada en `personaje.equipo` (puede haber dos entradas del mismo objeto). */
  pos: number;
  cantidad: number;
  puesto: boolean;
  en?: string;
  soltado: boolean;
  /** Dónde está a efectos de carga. */
  ubicacion: Ubicacion;
  /** Si es un contenedor: su capacidad (por unidad) y lo que lleva dentro. */
  contenedor?: { capacidad?: number; animal: boolean; dentro: number };
}

export interface ResumenEquipo {
  objetos: ObjetoEnInventario[];
  coste: number;
  sinPrecio: number;
  dinero: number | undefined;
  restante: number | undefined;
  /** CAR que lleva encima el personaje (sin lo soltado ni lo que va en la montura). */
  car: number;
  /** CAR de lo que va en la montura o soltado (figura en el inventario, no pesa). */
  carFuera: number;
  carArmadura: number;
  estado: EstadoCarga;
  /** Contenedores que llevan más de su capacidad. */
  desbordados: string[];
}

export function esContenedor(id: string): boolean {
  return id in CONTENEDORES;
}

export function resumenEquipo(
  p: Personaje,
  cat: Catalogo,
  indice = catalogoEquipo(cat),
): ResumenEquipo {
  const porId = new Map(indice.map((o) => [o.id, o]));
  const base = p.equipo
    .map((e, pos) => {
      const o = porId.get(e.id);
      if (!o) return undefined;
      const def = CONTENEDORES[e.id];
      return {
        ...o,
        car: def?.car ?? o.car,
        pos,
        cantidad: e.cantidad,
        puesto: Boolean(e.puesto),
        en: e.en && p.equipo.some((x) => x.id === e.en && esContenedor(x.id)) ? e.en : undefined,
        soltado: Boolean(def && !def.animal && e.soltado),
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const ubicacionDe = (o: (typeof base)[number]): Ubicacion => {
    const def = CONTENEDORES[o.id];
    if (def?.animal || NO_SE_LLEVAN.has(o.categoria)) return def?.animal ? 'animal' : 'fuera';
    if (o.soltado) return 'soltado';
    if (o.en) {
      const c = base.find((x) => x.id === o.en);
      if (c && CONTENEDORES[c.id]?.animal) return 'animal';
      if (c?.soltado) return 'soltado';
      return 'contenedor';
    }
    return 'encima';
  };
  const objetos: ObjetoEnInventario[] = base.map((o) => {
    const def = CONTENEDORES[o.id];
    const dentro = def
      ? base.filter((x) => x.en === o.id).reduce((s, x) => s + x.car * x.cantidad, 0)
      : 0;
    return {
      ...o,
      ubicacion: ubicacionDe(o),
      ...(def
        ? { contenedor: { capacidad: def.capacidad, animal: Boolean(def.animal), dentro } }
        : {}),
    };
  });

  const coste = objetos.reduce((s, o) => s + (o.precio ?? 0) * o.cantidad, 0);
  const llevable = (o: ObjetoEnInventario) => o.tipo === 'armadura' || o.tipo === 'casco';
  const pesa = (o: ObjetoEnInventario) => o.ubicacion === 'encima' || o.ubicacion === 'contenedor';
  const aCarga = (lista: ObjetoEnInventario[]) =>
    cargaTotal(
      lista.map((o) => ({
        car: o.car,
        cantidad: o.cantidad,
        armaduraPuesta: llevable(o) && o.puesto,
      })),
    );
  const car = aCarga(objetos.filter(pesa));
  const carFuera = aCarga(
    objetos.filter((o) => o.ubicacion === 'animal' || o.ubicacion === 'soltado'),
  );
  const carArmadura = objetos
    .filter((o) => llevable(o) && o.puesto && pesa(o))
    .reduce((s, o) => s + o.car * o.cantidad, 0);
  const dinero = p.dinero.total;
  return {
    objetos,
    coste: Math.round(coste * 10) / 10,
    sinPrecio: objetos.filter((o) => o.precio === null).length,
    dinero,
    restante: dinero === undefined ? undefined : Math.round((dinero - coste) * 10) / 10,
    car,
    carFuera,
    carArmadura,
    estado: estadoCarga(car, caracteristicasActuales(p).FUE),
    desbordados: objetos
      .filter(
        (o) =>
          o.contenedor?.capacidad !== undefined &&
          o.contenedor.dentro > o.contenedor.capacidad * o.cantidad,
      )
      .map((o) => o.nombre),
  };
}

/** «Soltar el morral»: suelta (o recoge) un contenedor; él y lo que lleva dejan de pesar. */
export function soltarContenedor(p: Personaje, id: string, soltar: boolean) {
  const e = p.equipo.find((x) => x.id === id);
  if (e && esContenedor(id) && !CONTENEDORES[id]!.animal) e.soltado = soltar;
}

/** Suelta de golpe todos los contenedores que lleva encima (la regla tácita de soltar el morral). */
export function soltarTodo(p: Personaje) {
  for (const e of p.equipo) if (esContenedor(e.id) && !CONTENEDORES[e.id]!.animal) e.soltado = true;
}

/** PA por localización con la armadura puesta: no se suman capas, cuenta la pieza de PA más alto. */
export function armaduraPorLocalizacion(r: ResumenEquipo): Record<string, number> {
  const res: Record<string, number> = {};
  for (const o of r.objetos) {
    if (!o.puesto || !o.cubre) continue;
    for (const l of o.cubre) res[l] = Math.max(res[l] ?? 0, o.pa ?? 0);
  }
  return res;
}
