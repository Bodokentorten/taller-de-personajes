// Personajes de ejemplo calculados a mano a partir de las notas del vault (los usan los tests).
import type { Caracteristica } from '../datos/tipos';
import type { Tirada } from './dados';
import { personajeVacio, type Asignacion, type Fuente, type Personaje } from './personaje';

export const tirada = (expresion: string, dados: number[], modificador = 0): Tirada => ({
  expresion,
  dados,
  modificador,
  total: dados.reduce((a, b) => a + b, 0) + modificador,
});

export const de = (fuente: Fuente, puntos: Record<string, number>): Asignacion[] =>
  Object.entries(puntos).map(([clave, n]) => ({ clave, fuente, puntos: n }));

export function rodrigo(): Personaje {
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

export function mose(): Personaje {
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

export function joan(): Personaje {
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
