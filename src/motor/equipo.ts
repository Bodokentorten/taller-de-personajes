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

export interface ResumenEquipo {
  objetos: (ObjetoResuelto & { cantidad: number; puesto: boolean })[];
  coste: number;
  sinPrecio: number;
  dinero: number | undefined;
  restante: number | undefined;
  car: number;
  carArmadura: number;
  estado: EstadoCarga;
}

export function resumenEquipo(
  p: Personaje,
  cat: Catalogo,
  indice = catalogoEquipo(cat),
): ResumenEquipo {
  const porId = new Map(indice.map((o) => [o.id, o]));
  const objetos = p.equipo
    .map((e) => {
      const o = porId.get(e.id);
      return o ? { ...o, cantidad: e.cantidad, puesto: Boolean(e.puesto) } : undefined;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const coste = objetos.reduce((s, o) => s + (o.precio ?? 0) * o.cantidad, 0);
  const llevable = (o: (typeof objetos)[number]) => o.tipo === 'armadura' || o.tipo === 'casco';
  const car = cargaTotal(
    objetos.map((o) => ({
      car: o.car,
      cantidad: o.cantidad,
      armaduraPuesta: llevable(o) && o.puesto,
    })),
  );
  const carArmadura = objetos
    .filter((o) => llevable(o) && o.puesto)
    .reduce((s, o) => s + o.car * o.cantidad, 0);
  const dinero = p.dinero.total;
  return {
    objetos,
    coste: Math.round(coste * 10) / 10,
    sinPrecio: objetos.filter((o) => o.precio === null).length,
    dinero,
    restante: dinero === undefined ? undefined : Math.round((dinero - coste) * 10) / 10,
    car,
    carArmadura,
    estado: estadoCarga(car, caracteristicasActuales(p).FUE),
  };
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
