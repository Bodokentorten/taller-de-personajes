// Personajes de ejemplo calculados a mano a partir de las notas del vault.
// Cada número esperado se explica en el comentario de al lado.
import { describe, expect, it } from 'vitest';
import { catalogo as cat } from '../datos/catalogo';
import type { Caracteristica } from '../datos/tipos';
import type { Tirada } from './dados';
import { valorDe } from './habilidades';
import { calcularHoja } from './hoja';
import {
  CAMPAÑA_POR_DEFECTO,
  personajeVacio,
  type Asignacion,
  type Fuente,
  type Personaje,
} from './personaje';
import { fichasLibres } from './reparto';

const tirada = (expresion: string, dados: number[], modificador = 0): Tirada => ({
  expresion,
  dados,
  modificador,
  total: dados.reduce((a, b) => a + b, 0) + modificador,
});

const de = (fuente: Fuente, puntos: Record<string, number>): Asignacion[] =>
  Object.entries(puntos).map(([clave, n]) => ({ clave, fuente, puntos: n }));

const codigos = (p: Personaje, campaña = CAMPAÑA_POR_DEFECTO) =>
  calcularHoja(p, cat, campaña).problemas.map((x) => `${x.gravedad}:${x.codigo}`);

// ------------------------------------------------------------------ 1. Rodrigo, guerrero castellano (estándar)

function rodrigo(): Personaje {
  const p = personajeVacio('rodrigo');
  Object.assign(p, {
    nombre: 'Rodrigo Pérez',
    sexo: 'varon',
    concepto: 'Ballestero de la milicia de Burgos',
    categoriaEdad: 'adulto',
    caracteristicas: {
      metodo: 'compra',
      valores: { FUE: 14, CON: 13, TAM: 13, DES: 13, INT: 11, POD: 9, CAR: 7 },
    },
    origen: {
      cultura: 'civilizado',
      reino: 'corona-de-castilla',
      pueblo: 'castellanos',
      credo: 'cristiano',
      clase: 'pechero-acomodado',
    },
    carrera: 'guerrero',
    lenguaMaterna: 'Castellano',
    asignaciones: [
      // Cultura (Civilizado): 100, entre +5 y +15 cada una, 3 profesionales y un estilo cultural
      ...de('cultura', {
        influencia: 10,
        perspicacia: 10,
        entorno: 10,
        'fuerza-de-voluntad': 10,
        engano: 5,
        ocultar: 5,
        conducir: 5,
        'estilo-de-combate:milicia-de-concejo': 15,
        comercio: 10,
        'artesania:Herrería': 10,
        'conocimiento-callejero': 10,
      }),
      // Carrera (Guerrero): 100, como mucho +15 y 3 profesionales
      ...de('carrera', {
        atletismo: 15,
        musculatura: 10,
        resistencia: 15,
        esquivar: 15,
        'combate-sin-armas': 10,
        'estilo-de-combate:milicia-de-concejo': 15,
        'conocimiento:Historia militar': 10,
        supervivencia: 10,
      }),
      // Adicionales (Adulto): 150, como mucho +15
      ...de('adicional', {
        'estilo-de-combate:milicia-de-concejo': 15,
        atletismo: 15,
        esquivar: 15,
        resistencia: 15,
        percepcion: 15,
        perspicacia: 15,
        influencia: 15,
        sigilo: 15,
        montar: 15,
        'combate-sin-armas': 15,
      }),
    ],
    pasiones: [
      { nombre: 'Fe (cristiana)', tipo: 3, orden: 1, fe: true }, // POD+INT 20 +40 = 60
      { nombre: 'Lealtad (el concejo de Burgos)', tipo: 3, orden: 2 }, // 20 +30 = 50
      { nombre: 'Odio (los moros de Granada)', tipo: 4, orden: 3 }, // POD×2 18 +20 = 38
    ],
    dinero: { tirada: tirada('4d6', [3, 4, 3, 4]), total: 2100 }, // 14 × 75 mrs × 2 (pechero acomodado)
  } satisfies Partial<Personaje>);
  return p;
}

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

function mose(): Personaje {
  const p = personajeVacio('mose');
  const valores = { FUE: 10, CON: 12, TAM: 11, DES: 12, INT: 16, POD: 14, CAR: 13 };
  const tiradas = Object.fromEntries(
    Object.entries(valores).map(([c, v]) => [
      c,
      c === 'TAM' || c === 'INT'
        ? tirada('2d6+6', [v - 6 - 1, 1], 6)
        : tirada('3d6', [v - 2, 1, 1]),
    ]),
  ) as Record<Caracteristica, Tirada>;
  Object.assign(p, {
    nombre: 'Mosé ha-Leví',
    sexo: 'varon',
    categoriaEdad: 'adulto',
    caracteristicas: { metodo: 'tirada', valores, tiradas },
    origen: {
      cultura: 'civilizado',
      reino: 'corona-de-castilla',
      pueblo: 'judios',
      credo: 'judio',
      clase: 'burgues-ciudadano-honrado',
      tiradaClase: 90,
    },
    carrera: 'rabino',
    metodoHabilidades: 'piramide',
    lenguaMaterna: 'Castellano', // por eso no recibe el Castellano +20 gratuito
    asignaciones: de('piramide', {
      'fuerza-de-voluntad': 50, // POD×2 28 + 50 = 78
      'conocimiento:Teología y Talmud': 40, // INT×2 32 + 40 = 72
      'alfabetizacion:Hebrea': 40, // 32 + 40 = 72
      'idioma:Hebreo (litúrgico)': 30, // INT+CAR 29 + 10 gratis + 30 = 69
      oratoria: 30, // POD+CAR 27 + 30 = 57
      ensenar: 30, // INT+CAR 29 + 30 = 59
      perspicacia: 20,
      influencia: 20,
      percepcion: 20,
      entorno: 20,
      'conocimiento:Astrología': 10,
      'estilo-de-combate:guardia-de-aljama': 10,
      'primeros-auxilios': 10,
      sigilo: 10,
    }),
    pasiones: [
      { nombre: 'Fe (la Ley de Moisés)', tipo: 3, orden: 1, fe: true, extra: 10 }, // POD+INT 30 + 40 + 10 = 80
      { nombre: 'Amor (su esposa Jamila)', tipo: 0, orden: 2, sujeto: { POD: 12, CAR: 14 } }, // 26 + 30 = 56
      { nombre: 'Temer (los predicadores)', tipo: 3, orden: 3 }, // 30 + 20 = 50
    ],
    dinero: { tirada: tirada('4d6', [2, 3, 4, 3]), total: 2700 }, // 12 × 75 × 3
  } satisfies Partial<Personaje>);
  return p;
}

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

function joan(): Personaje {
  const p = personajeVacio('joan');
  Object.assign(p, {
    nombre: 'Joan de Sant Climent',
    sexo: 'varon',
    categoriaEdad: 'adulto',
    caracteristicas: {
      metodo: 'compra',
      valores: { FUE: 9, CON: 11, TAM: 12, DES: 11, INT: 15, POD: 13, CAR: 9 },
    },
    origen: {
      cultura: 'civilizado',
      reino: 'corona-de-aragon',
      pueblo: 'catalanes',
      credo: 'cristiano',
      clase: 'ciudadano-honrado',
    },
    carrera: 'mago',
    lenguaMaterna: 'Catalán',
    asignaciones: [
      ...de('cultura', {
        influencia: 10,
        perspicacia: 10,
        entorno: 10,
        'fuerza-de-voluntad': 15,
        engano: 10,
        ocultar: 5,
        conducir: 5,
        'conocimiento:Ocultismo': 15,
        'idioma:Latín': 10,
        'arte:Caligrafía': 10,
      }),
      ...de('carrera', {
        costumbres: 10,
        engano: 10,
        influencia: 10,
        perspicacia: 10,
        'fuerza-de-voluntad': 15,
        percepcion: 15,
        'fuente-mistica:picatrix': 15,
        'conocimiento:Ocultismo': 15,
      }),
      ...de('adicional', {
        'fuente-mistica:picatrix': 15,
        'conocimiento:Ocultismo': 15,
        'idioma:Latín': 15,
        'fuerza-de-voluntad': 15,
        perspicacia: 15,
        percepcion: 15,
        entorno: 15,
        sigilo: 15,
        esquivar: 15,
        influencia: 15,
      }),
    ],
    pasiones: [{ nombre: 'Fe (cristiana)', tipo: 3, orden: 3, fe: true }], // 28 + 20 = 48
    magia: {
      fuentes: [
        {
          clave: 'fuente-mistica:picatrix',
          grimorio: 'picatrix',
          nombre: 'Picatrix',
          dominios: [],
        },
      ],
      formulas: [
        'bebedizo-de-suenos',
        'leche-de-sapiencia',
        'filtro-de-memoria',
        'infusion-de-serenidad',
      ],
    },
    dinero: { tirada: tirada('4d6', [5, 5, 5, 5]), total: 4500 }, // 20 × 75 × 3
  } satisfies Partial<Personaje>);
  return p;
}

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
