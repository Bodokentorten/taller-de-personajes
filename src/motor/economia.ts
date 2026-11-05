// Dinero inicial (fuente: «Comunidad, Familia, Clase Social…», §2) y carga («Carga y Movimiento (ENC)»).
import type { Catalogo } from '../datos/catalogo';
import { tirar, type Aleatorio, type Tirada } from './dados';
import { claseSocial } from './origen';
import type { Personaje } from './personaje';
import { aviso, error, type Problema } from './resultado';

/** Fórmula del dinero inicial: dados de la cultura × multiplicador × modificador de la clase social. */
export function formulaDinero(
  p: Personaje,
  cat: Catalogo,
): { dados: string; multiplicador: number; mod: number } | undefined {
  const d = cat.trasfondo.dinero[p.origen.cultura];
  const clase = claseSocial(p, cat);
  if (!d || !clase) return undefined;
  return { dados: d.dados, multiplicador: d.multiplicador, mod: clase.mod_dinero };
}

export function tirarDinero(
  p: Personaje,
  cat: Catalogo,
  azar?: Aleatorio,
): { tirada: Tirada; total: number } | undefined {
  const f = formulaDinero(p, cat);
  if (!f) return undefined;
  const tirada = tirar(f.dados, azar);
  return { tirada, total: Math.round(tirada.total * f.multiplicador * f.mod) };
}

export function validarDinero(p: Personaje, cat: Catalogo): Problema[] {
  const f = formulaDinero(p, cat);
  if (!f) return [];
  const { tirada, total } = p.dinero;
  if (total === undefined)
    return [
      aviso(
        'equipo',
        'sin-dinero',
        `Tira el dinero inicial: ${f.dados} × ${f.multiplicador} mrs × ${f.mod}.`,
      ),
    ];
  if (tirada && Math.round(tirada.total * f.multiplicador * f.mod) !== total) {
    return [
      error(
        'equipo',
        'dinero-alterado',
        `El dinero (${total} mrs) no corresponde a la tirada (${tirada.total}).`,
      ),
    ];
  }
  return [];
}

// --------------------------------------------------------------------------- Carga

export type EstadoCarga = 'normal' | 'cargado' | 'sobrecargado' | 'inmovil';

/**
 * Estado de carga según «Carga y Movimiento (ENC)»: hasta FUE×2 normal, hasta ×3 cargado, hasta ×4
 * sobrecargado y más, inmóvil. (Ojo: «Equipo, Armas y Armaduras» dice «hasta FUE puntos sin penalización»;
 * se sigue la nota detallada de Carga.)
 */
export function estadoCarga(car: number, fue: number): EstadoCarga {
  if (car <= fue * 2) return 'normal';
  if (car <= fue * 3) return 'cargado';
  if (car <= fue * 4) return 'sobrecargado';
  return 'inmovil';
}

export interface ObjetoConCarga {
  car: number;
  cantidad: number;
  /** Armadura puesta: cuenta la mitad de su CAR. */
  armaduraPuesta?: boolean;
}

/** CAR total: la armadura puesta cuenta la mitad; los objetos de CAR 0 cuentan 1 por cada 20. */
export function cargaTotal(objetos: readonly ObjetoConCarga[]): number {
  let total = 0;
  let menudos = 0;
  for (const o of objetos) {
    if (o.car === 0) menudos += o.cantidad;
    else total += (o.armaduraPuesta ? o.car / 2 : o.car) * o.cantidad;
  }
  return total + Math.floor(menudos / 20);
}
