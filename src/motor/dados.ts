/** Generador de números aleatorios en [0, 1). Inyectable para los tests. */
export type Aleatorio = () => number;

export interface Tirada {
  expresion: string;
  dados: number[];
  modificador: number;
  total: number;
}

const PATRON = /^\s*(\d*)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/i;

/** Tira una expresión del tipo «3d6», «2d6+6», «d100» o «1d4-1». */
export function tirar(expresion: string, azar: Aleatorio = Math.random): Tirada {
  const m = PATRON.exec(expresion);
  if (!m) throw new Error(`Expresión de dados no válida: «${expresion}»`);
  const cantidad = m[1] ? Number(m[1]) : 1;
  const caras = Number(m[2]);
  if (cantidad < 1 || caras < 2) throw new Error(`Expresión de dados no válida: «${expresion}»`);
  const signo = m[3] === '-' ? -1 : 1;
  const modificador = m[4] ? signo * Number(m[4]) : 0;
  const dados = Array.from({ length: cantidad }, () => 1 + Math.floor(azar() * caras));
  const total = dados.reduce((a, b) => a + b, 0) + modificador;
  return { expresion: expresion.replace(/\s+/g, ''), dados, modificador, total };
}

/** Generador determinista (mulberry32) para tests y tiradas reproducibles. */
export function azarConSemilla(semilla: number): Aleatorio {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
