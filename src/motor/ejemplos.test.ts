// Personajes de ejemplo calculados a mano a partir de las notas del vault.
// Cada número esperado se explica en el comentario de al lado.
import { describe, expect, it } from 'vitest';
import { catalogo as cat } from '../datos/catalogo';
import { valorDe } from './habilidades';
import { calcularHoja } from './hoja';
import { CAMPAÑA_POR_DEFECTO, type Personaje } from './personaje';
import { fichasLibres } from './reparto';
import { joan, mose, rodrigo } from './ejemplos';

const codigos = (p: Personaje, campaña = CAMPAÑA_POR_DEFECTO) =>
  calcularHoja(p, cat, campaña).problemas.map((x) => `${x.gravedad}:${x.codigo}`);

// ------------------------------------------------------------------ 1. Rodrigo, guerrero castellano (estándar)

describe('1. Rodrigo, guerrero castellano (método estándar)', () => {
  const h = calcularHoja(rodrigo(), cat);

  it('es válido y solo tiene avisos esperables', () => {
    expect(h.problemas.filter((x) => x.gravedad === 'error')).toEqual([]);
    expect(h.valido).toBe(true);
  });

  it('calcula las habilidades', () => {
    const v = (c: string) => valorDe(h.habilidades, c);
    expect(v('estilo-de-combate:milicia-de-concejo')).toBe(72); // FUE+DES 27 + 15 + 15 + 15
    expect(v('atletismo')).toBe(57); // 27 + 15 + 15
    expect(v('esquivar')).toBe(56); // DES×2 26 + 15 + 15
    expect(v('resistencia')).toBe(56); // CON×2 26 + 15 + 15
    expect(v('influencia')).toBe(39); // CAR×2 14 + 10 + 15
    expect(v('costumbres')).toBe(62); // INT×2 22 + 40
    expect(v('lengua-materna')).toBe(58); // INT+CAR 18 + 40
    expect(v('comercio')).toBe(28); // INT+CAR 18 + 10
    expect(v('artesania:Herrería')).toBe(34); // DES+INT 24 + 10
    expect(v('nadar')).toBe(27); // FUE+CON, sin puntos
  });

  it('calcula las Pasiones y la Fe', () => {
    expect(h.pasiones.map((x) => x.valor)).toEqual([60, 50, 38]);
    expect(h.fe.fe).toBe(60);
    expect(h.fe.puedeObrar).toBe(false); // un guerrero no está ordenado
  });

  it('detecta los errores de reparto', () => {
    const p = rodrigo();
    p.asignaciones.push({ clave: 'navegacion', fuente: 'cultura', puntos: 5 }); // no es de Civilizado y pasa de 100
    p.asignaciones.push({ clave: 'atletismo', fuente: 'adicional', puntos: 1 }); // pasa de +15 y de 150
    expect(codigos(p)).toEqual(
      expect.arrayContaining([
        'error:cultura-total',
        'error:cultura-fuera',
        'error:adicional-total',
        'error:adicional-tope',
      ]),
    );
  });
});

// ------------------------------------------------------------------ 2. Mosé, rabino de Toledo (pirámide)

describe('2. Mosé, rabino de Toledo (pirámide)', () => {
  const p = mose();
  const h = calcularHoja(p, cat);

  it('es válido y ha usado las 15 fichas', () => {
    expect(h.problemas.filter((x) => x.gravedad === 'error')).toEqual([]);
    expect(fichasLibres(p, cat)).toEqual([]);
  });

  it('aplica los idiomas gratuitos del pueblo', () => {
    expect(valorDe(h.habilidades, 'idioma:Hebreo (litúrgico)')).toBe(69);
    expect(h.habilidades.some((x) => x.clave === 'idioma:Castellano')).toBe(false);
    expect(valorDe(h.habilidades, 'fuerza-de-voluntad')).toBe(78);
  });

  it('calcula Fe, PF, ordo y rituales', () => {
    expect(h.pasiones.map((x) => x.valor)).toEqual([80, 56, 50]);
    expect(h.fe).toMatchObject({ fe: 80, pf: 16, teologia: 72, puedeObrar: true, ordoMaximo: 3 }); // 18 PF para el quartus
    expect(h.fe.rituales.every((r) => r.ordo <= 3)).toBe(true);
    expect(h.fe.rituales.length).toBe(cat.rituales.filter((r) => r.ordo <= 3).length);
  });

  it('el tope del 80% y las fichas repetidas son errores', () => {
    const q = mose();
    q.asignaciones = q.asignaciones.map((a) =>
      a.clave === 'perspicacia' ? { ...a, clave: 'costumbres' } : a,
    ); // 72 + 20 = 92
    q.asignaciones.push({ clave: 'nadar', fuente: 'piramide', puntos: 10 });
    expect(codigos(q)).toEqual(
      expect.arrayContaining(['error:piramide-tope', 'error:piramide-sobran']),
    );
  });
});

// ------------------------------------------------------------------ 3. Joan, mago de Barcelona (fórmulas)

describe('3. Joan, mago de Barcelona (Magia Caótica)', () => {
  const h = calcularHoja(joan(), cat);

  it('es válido, con los avisos de su carrera', () => {
    expect(h.problemas.filter((x) => x.gravedad === 'error')).toEqual([]);
    expect(codigos(joan())).toEqual(
      expect.arrayContaining(['aviso:carrera-aviso', 'aviso:inquisicion']),
    );
  });

  it('calcula Fuente, Ocultismo y fórmulas iniciales', () => {
    expect(valorDe(h.habilidades, 'idioma:Castellano')).toBe(44); // INT+CAR 24 + 20 gratis
    expect(h.magia.fuentes).toEqual([
      {
        clave: 'fuente-mistica:picatrix',
        nombre: 'Picatrix',
        dominios: ['Espíritu', 'Mente'],
        valor: 30,
      },
    ]);
    expect(h.magia.ocultismo).toBe(75); // INT×2 30 + 15 + 15 + 15
    expect(h.magia.formulasPermitidas).toBe(5); // 71–80% → 5 fijas
    expect(h.magia.conoceGoecia).toBe(false);
  });

  it('una fórmula sin dominio o de Rango alto no se puede lanzar', () => {
    const p = joan();
    p.magia.formulas.push('cerradura-maldita'); // Tierra: el Picatrix no la tiene
    expect(codigos(p)).toEqual(
      expect.arrayContaining(['error:formula-sin-fuente', 'aviso:goecia']),
    );
    p.magia.formulas.push('amor', 'discordia');
    expect(codigos(p)).toContain('error:demasiadas-formulas');
  });

  it('un guerrero no puede empezar con fórmulas', () => {
    const p = rodrigo();
    p.magia.formulas = ['amor'];
    expect(codigos(p)).toContain('error:magia-sin-carrera');
  });
});

// ------------------------------------------------------------------ 4. Restricciones de origen y carrera

describe('4. Restricciones de la ambientación', () => {
  it('un judío no puede ser caballero de una orden militar ni noble', () => {
    const p = mose();
    p.carrera = 'caballero-de-orden-militar';
    p.origen.clase = 'pechero-acomodado';
    p.origen.tiradaClase = 60;
    expect(codigos(p)).toEqual(
      expect.arrayContaining([
        'error:carrera-credo',
        'error:carrera-clase',
        'error:carrera-pueblo',
      ]),
    );
  });

  it('un vasco solo es villano, salvo con la hidalguía universal', () => {
    const p = rodrigo();
    p.origen = { ...p.origen, pueblo: 'vascos', clase: 'baja-nobleza' };
    p.lenguaMaterna = 'Euskera';
    expect(codigos(p)).toContain('error:clase-no-permitida');
    expect(codigos(p, { ...CAMPAÑA_POR_DEFECTO, hidalguiaVasca: true })).not.toContain(
      'error:clase-no-permitida',
    );
  });

  it('un castellano no empieza como esclavo; un granadino tira en la tabla de su credo', () => {
    const p = rodrigo();
    p.origen.clase = 'esclavo-o-cautivo';
    expect(codigos(p)).toContain('error:clase-prohibida');
    const g = rodrigo();
    g.origen = {
      cultura: 'civilizado',
      reino: 'reino-de-granada',
      pueblo: 'arabes-granadinos',
      credo: 'musulman',
      clase: 'mercader',
    };
    expect(codigos(g)).not.toContain('error:sin-clase');
  });

  it('la restricción de sexo es un aviso salvo que la campaña la active', () => {
    const p = mose();
    p.sexo = 'mujer';
    expect(codigos(p)).toContain('aviso:carrera-sexo');
    expect(codigos(p, { ...CAMPAÑA_POR_DEFECTO, restriccionesSexo: true })).toContain(
      'error:carrera-sexo',
    );
  });

  it('el pardo es de Castilla o Granada; el reino debe ser del pueblo', () => {
    const p = joan();
    p.carrera = 'pardo';
    expect(codigos(p)).toContain('error:carrera-reino');
    const q = rodrigo();
    q.origen.reino = 'reino-de-portugal';
    expect(codigos(q)).toContain('error:reino-pueblo');
  });
});

// ------------------------------------------------------------------ 5. Fe y rituales

describe('5. Fe y rituales', () => {
  it('no puede conocer rituales por encima de su ordo', () => {
    const p = mose();
    const quintus = cat.rituales.find((r) => r.ordo === 5)!;
    p.rituales = [quintus.id];
    expect(codigos(p)).toContain('error:ritual-no-accesible');
  });

  it('quien conoce goecia no obra rituales', () => {
    const p = mose();
    p.magia.formulas = ['amor'];
    const h = calcularHoja(p, cat);
    expect(h.fe.puedeObrar).toBe(false);
    expect(h.problemas.map((x) => x.codigo)).toEqual(
      expect.arrayContaining(['goecia-y-fe', 'magia-sin-carrera']),
    );
  });

  it('sin Pasión Fe hay un aviso; un clérigo sin Fe, un error', () => {
    const p = rodrigo();
    p.pasiones = p.pasiones.filter((x) => !x.fe);
    expect(codigos(p)).toContain('aviso:sin-fe');
    const q = mose();
    q.pasiones = q.pasiones.filter((x) => !x.fe);
    expect(codigos(q)).toContain('error:clerigo-sin-fe');
  });
});

// ------------------------------------------------------------------ 6. Personajes limpios y avisos de pueblo

describe('6. Avisos', () => {
  it('Rodrigo y Mosé no tienen ni un aviso', () => {
    expect(codigos(rodrigo())).toEqual([]);
    expect(codigos(mose())).toEqual([]);
  });

  it('un mudéjar guerrero recibe el aviso de su pueblo', () => {
    const p = rodrigo();
    p.origen = { ...p.origen, pueblo: 'mudejares', credo: 'musulman', reino: 'corona-de-castilla' };
    expect(codigos(p)).toContain('aviso:carrera-aviso-pueblo');
  });
});

describe('7. Archivo de campaña', () => {
  it('limita carreras y pueblos', () => {
    const c = {
      ...CAMPAÑA_POR_DEFECTO,
      carrerasPermitidas: ['medico'],
      pueblosPermitidos: ['judios'],
    };
    expect(codigos(rodrigo(), c)).toEqual(
      expect.arrayContaining(['error:carrera-campaña', 'error:pueblo-campaña']),
    );
    expect(
      codigos(mose(), { ...CAMPAÑA_POR_DEFECTO, pueblosPermitidos: ['judios'] }),
    ).not.toContain('error:pueblo-campaña');
  });
});
