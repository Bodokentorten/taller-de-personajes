// Paso 2: Características (fuente: «Características y Atributos», Cálculo de las Características).
import { CARACTERISTICAS, type Caracteristica, type Reglas } from '../datos/tipos';
import { tirar, type Aleatorio, type Tirada } from './dados';
import type { Personaje } from './personaje';
import { aviso, error, type Problema } from './resultado';

export type Valores = Record<Caracteristica, number>;

/** Tira todas las características (3d6; 2d6+6 para TAM e INT) y devuelve valores y registro. */
export function tirarCaracteristicas(
  reglas: Reglas,
  azar?: Aleatorio,
): { valores: Valores; tiradas: Record<Caracteristica, Tirada> } {
  const tiradas = {} as Record<Caracteristica, Tirada>;
  const valores = {} as Valores;
  for (const c of CARACTERISTICAS) {
    tiradas[c] = tirar(reglas.compra_caracteristicas.tiradas[c], azar);
    valores[c] = tiradas[c].total;
  }
  return { valores, tiradas };
}

export function puntosGastados(valores: Valores): number {
  return CARACTERISTICAS.reduce((s, c) => s + valores[c], 0);
}

export function validarCaracteristicas(p: Personaje, reglas: Reglas): Problema[] {
  const res: Problema[] = [];
  const { metodo, valores, tiradas } = p.caracteristicas;
  const { puntos, rangos } = reglas.compra_caracteristicas;
  for (const c of CARACTERISTICAS) {
    const v = valores[c];
    if (!Number.isInteger(v) || v < 1) {
      res.push(
        error('caracteristicas', 'car-invalida', `${c} debe ser un número entero positivo.`),
      );
      continue;
    }
    const [min, max] = rangos[c];
    if (metodo !== 'manual' && (v < min || v > max)) {
      res.push(
        error(
          'caracteristicas',
          'car-fuera-de-rango',
          `${c} ${v}: debe estar entre ${min} y ${max}.`,
        ),
      );
    }
  }
  if (metodo === 'compra') {
    const gastados = puntosGastados(valores);
    if (gastados !== puntos) {
      res.push(
        error(
          'caracteristicas',
          'compra-puntos',
          `La compra debe repartir exactamente ${puntos} puntos (llevas ${gastados}).`,
        ),
      );
    }
  } else if (metodo === 'tirada') {
    for (const c of CARACTERISTICAS) {
      const t = tiradas?.[c];
      if (!t)
        res.push(
          aviso('caracteristicas', 'tirada-sin-registro', `${c} no tiene la tirada registrada.`),
        );
      else if (t.total !== valores[c])
        res.push(
          error(
            'caracteristicas',
            'tirada-alterada',
            `${c} no coincide con su tirada (${t.total}).`,
          ),
        );
    }
  } else {
    res.push(
      aviso(
        'caracteristicas',
        'manual',
        'Características introducidas a mano: el DJ debe darlas por buenas.',
      ),
    );
  }
  return res;
}
