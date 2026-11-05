import { describe, expect, it } from 'vitest';
import { catalogo } from '../datos/catalogo';
import { calcularAtributos, penalizadorArmadura, pgLocalizacion } from './atributos';
import { tirarCaracteristicas, validarCaracteristicas } from './caracteristicas';
import { azarConSemilla } from './dados';
import { cargaTotal, estadoCarga } from './economia';
import { pfMaximos } from './fe';
import { evaluar, FaltaSujeto } from './formulas';
import { personajeVacio } from './personaje';
import { buscarUmbral } from './tablas';

const R = catalogo.reglas;
const V = { FUE: 14, CON: 13, TAM: 13, DES: 13, INT: 11, POD: 9, CAR: 7 };

describe('fórmulas', () => {
  it('evalúa las fórmulas de habilidades y pasiones', () => {
    expect(evaluar('FUE+DES', V)).toBe(27);
    expect(evaluar('INT x2', V)).toBe(22);
    expect(evaluar('INT x2 +40', V)).toBe(62);
    expect(evaluar('INT+CAR +40', V)).toBe(58);
    expect(evaluar('0', V)).toBe(0);
    expect(evaluar('POD*2', V)).toBe(18);
    expect(evaluar('SUJETO.POD+SUJETO.CAR', { ...V, SUJETO: { POD: 12, CAR: 14 } })).toBe(26);
  });
  it('avisa si falta el sujeto de una Pasión', () => {
    expect(() => evaluar('POD+SUJETO.CAR', V)).toThrow(FaltaSujeto);
  });
  it('todas las fórmulas del catálogo se pueden evaluar', () => {
    for (const h of catalogo.habilidades)
      expect(Number.isFinite(evaluar(h.formula, V)), h.nombre).toBe(true);
  });
});

describe('tablas por umbrales', () => {
  it('lee tramos y progresiones', () => {
    expect(buscarUmbral(R.suerte, 6)).toBe('1');
    expect(buscarUmbral(R.suerte, 13)).toBe('3');
    expect(buscarUmbral(R.suerte, 19)).toBe('4'); // «Cada 6 puntos: +1»
    expect(buscarUmbral(R.suerte, 25)).toBe('5');
    expect(buscarUmbral(R.mod_experiencia, 6)).toBe('-1');
    expect(buscarUmbral(R.mod_experiencia, 20)).toBe('+2');
    expect(buscarUmbral(R.mod_dano, 5)).toBe('–1d8');
    expect(buscarUmbral(R.mod_dano, 27)).toBe('+1d2');
  });
  it('PG por localización, con +1 cada 5 puntos por encima de 40', () => {
    expect(pgLocalizacion(R, 'Pecho', 26)).toBe(8);
    expect(pgLocalizacion(R, 'Cada brazo', 7)).toBe(1);
    expect(pgLocalizacion(R, 'Cabeza', 40)).toBe(8);
    expect(pgLocalizacion(R, 'Cabeza', 41)).toBe(9);
    expect(pgLocalizacion(R, 'Cabeza', 46)).toBe(10);
  });
});

describe('atributos', () => {
  it('calcula los atributos de un guerrero', () => {
    const a = calcularAtributos(V, R);
    expect(a).toMatchObject({
      puntosAccion: 2,
      modDano: '+1d2',
      modExperiencia: 0,
      curacion: 3,
      iniciativa: 12,
      suerte: 2,
      puntosMagia: 9,
      movimiento: 6,
    });
    expect(a.pg).toEqual({
      cabeza: 6,
      'brazo-izq': 5,
      'brazo-der': 5,
      pecho: 8,
      abdomen: 7,
      'pierna-izq': 6,
      'pierna-der': 6,
    });
  });
  it('redondea la Iniciativa hacia arriba y resta la armadura', () => {
    expect(calcularAtributos({ ...V, DES: 12 }, R).iniciativa).toBe(12); // (12+11)/2 = 11,5
    expect(penalizadorArmadura(0)).toBe(0);
    expect(penalizadorArmadura(6)).toBe(-2);
    expect(penalizadorArmadura(10)).toBe(-2);
  });
});

describe('características', () => {
  it('la compra debe sumar 80 y respetar los rangos', () => {
    const p = personajeVacio('x');
    expect(validarCaracteristicas(p, R)).toEqual([]);
    p.caracteristicas.valores = { ...p.caracteristicas.valores, FUE: 12 };
    expect(validarCaracteristicas(p, R).map((x) => x.codigo)).toEqual(['compra-puntos']);
    p.caracteristicas.valores = { FUE: 19, CON: 10, TAM: 8, DES: 10, INT: 13, POD: 10, CAR: 10 };
    expect(validarCaracteristicas(p, R).map((x) => x.codigo)).toEqual(['car-fuera-de-rango']);
  });
  it('las tiradas son reproducibles y se comprueban', () => {
    const t = tirarCaracteristicas(R, azarConSemilla(7));
    expect(t).toEqual(tirarCaracteristicas(R, azarConSemilla(7)));
    expect(t.valores.TAM).toBeGreaterThanOrEqual(8);
    const p = personajeVacio('x');
    p.caracteristicas = { metodo: 'tirada', ...t };
    expect(validarCaracteristicas(p, R)).toEqual([]);
    p.caracteristicas.valores = {
      ...t.valores,
      FUE: t.valores.FUE === 18 ? 17 : t.valores.FUE + 1,
    };
    expect(validarCaracteristicas(p, R).map((x) => x.codigo)).toContain('tirada-alterada');
  });
});

describe('fe, carga', () => {
  it('PF = Fe ÷ 5 redondeando hacia arriba', () => {
    expect(pfMaximos(73)).toBe(15); // ejemplo de Sor Recareda en «Fe»
    expect(pfMaximos(50)).toBe(10);
  });
  it('carga y estados de carga', () => {
    expect(
      cargaTotal([
        { car: 6, cantidad: 1, armaduraPuesta: true },
        { car: 2, cantidad: 2 },
        { car: 0, cantidad: 25 },
      ]),
    ).toBe(8);
    expect(estadoCarga(28, 14)).toBe('normal');
    expect(estadoCarga(29, 14)).toBe('cargado');
    expect(estadoCarga(43, 14)).toBe('sobrecargado');
    expect(estadoCarga(57, 14)).toBe('inmovil');
  });
});
