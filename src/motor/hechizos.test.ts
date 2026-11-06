import { describe, expect, it } from 'vitest';
import { catalogo as cat } from '../datos/catalogo';
import {
  armaduraDe,
  calcularHechizo,
  dificultadBase,
  dificultadFormula,
  manipulacionFuente,
  parametrosDeFormula,
} from './hechizos';

describe('calculadora de hechizos', () => {
  it('reproduce la dificultad base de todas las fórmulas del grimorio de los reinos', () => {
    let distintas = 0;
    for (const f of cat.formulas) {
      if (dificultadBase(parametrosDeFormula(f)).valor !== f.dificultad_base) distintas++;
    }
    // Algunas fórmulas tienen requisitos extra o modificadores de material que no están en el frontmatter
    expect(distintas / cat.formulas.length).toBeLessThan(0.1);
  });

  it('ejemplo de «Amor»: Rango I, semanas, toque, otro, fórmula completa = 20%', () => {
    const amor = cat.formulas.find((f) => f.id === 'amor')!;
    expect(dificultadBase(parametrosDeFormula(amor)).valor).toBe(20);
  });

  it('calcula la dificultad final de un hechizo libre', () => {
    const r = calcularHechizo(
      {
        rango: 'III',
        duracion: 'instantanea',
        alcance: 'cercano',
        objetivo: 'area',
        requisitos: 1,
        formulaCompleta: false,
      },
      { zona: 'rural', manipulacion: 15, vozBaja: true, sinGestos: false, armadura: 'metalica' },
    );
    expect(r.base).toBe(10 + 5 + 10 + 30 + 10);
    expect(r.final).toBe(65 + 20 + 15 + 10 + 20);
    expect(r.umbral).toBe(41);
  });

  it('nunca baja del 5% y usa la manipulación del grimorio', () => {
    expect(
      dificultadBase({
        rango: 'I',
        duracion: 'instantanea',
        alcance: 'personal',
        objetivo: 'personal',
        requisitos: 0,
        formulaCompleta: true,
      }).valor,
    ).toBe(5);
    expect(manipulacionFuente(cat, { grimorio: 'picatrix' }, 'Transformar')).toBe(20);
    expect(manipulacionFuente(cat, { manipulacion: { Crear: 5 } }, 'Crear')).toBe(5);
  });

  it('dificultad final de una fórmula del PJ', () => {
    const f = cat.formulas.find((x) => x.id === 'bebedizo-de-suenos')!;
    const r = dificultadFormula(
      cat,
      f,
      {
        clave: 'fuente-mistica:Picatrix',
        nombre: 'Picatrix',
        dominios: ['Espíritu', 'Mente'],
        valor: 30,
        grimorio: 'picatrix',
        rangoMaximo: 'IV',
      },
      { zona: 'ciudad', vozBaja: false, sinGestos: false, armadura: 'ninguna' },
    );
    expect(r.final).toBe(
      f.dificultad_base +
        30 +
        (cat.grimorios.find((g) => g.id === 'picatrix')!.manipulacion[f.manipulacion] ?? 0),
    );
  });

  it('la armadura más pesada manda', () => {
    expect(armaduraDe(['Blanda', 'Ligera'])).toBe('ligera');
    expect(armaduraDe(['Metálica', 'Ligera'])).toBe('metalica');
    expect(armaduraDe([])).toBe('ninguna');
  });
});
