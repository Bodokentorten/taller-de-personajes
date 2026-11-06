// Tiradas de trasfondo (fuente: «Comunidad, Familia, Clase Social y Eventos de Trasfondo»).
import type { Catalogo } from '../datos/catalogo';
import type { FilaD100 } from '../datos/tipos';
import { tirar, type Aleatorio } from './dados';
import type { ResultadoTrasfondo, TablaTrasfondo } from './personaje';

export const TABLAS_TRASFONDO: { id: TablaTrasfondo | 'eventos'; nombre: string }[] = [
  { id: 'padres', nombre: 'Padres' },
  { id: 'hermanos', nombre: 'Hermanos' },
  { id: 'familia_extendida', nombre: 'Familia extendida' },
  { id: 'reputacion', nombre: 'Reputación de la familia' },
  { id: 'conexiones', nombre: 'Conexiones' },
  { id: 'eventos', nombre: 'Evento de trasfondo' },
];

/** Texto de una fila: une sus columnas de texto («Abuelos: … · Tíos: …»). */
export function textoFila(tabla: TablaTrasfondo | 'eventos', f: FilaD100): string {
  if (tabla === 'familia_extendida') {
    return `Abuelos: ${f.abuelos} · Tíos y tías: ${f.tios} · Primos: ${f.primos}`;
  }
  const partes = [f.texto, f.vinculos].filter((x) => typeof x === 'string' && x && x !== '—');
  return partes.join(' · ');
}

export function filaPara(
  cat: Catalogo,
  tabla: TablaTrasfondo | 'eventos',
  d100: number,
): FilaD100 | undefined {
  return cat.trasfondo[tabla].find((f) => d100 >= f.min && d100 <= f.max);
}

export function tirarTrasfondo(
  cat: Catalogo,
  tabla: TablaTrasfondo | 'eventos',
  azar?: Aleatorio,
): ResultadoTrasfondo {
  const t = tirar('1d100', azar).total;
  const f = filaPara(cat, tabla, t);
  if (!f) return { tirada: t, texto: '' };
  const detalle = tabla === 'eventos' ? '' : subtiradas(tabla, f, azar);
  return { tirada: t, texto: textoFila(tabla, f), ...(detalle ? { detalle } : {}) };
}

// --------------------------------------------------------------------------- Subtiradas

/** Tira la primera expresión de dados de un texto («1d4 hermanos», «1d3-1»); un número suelto vale tal cual. */
function cantidad(texto: string, azar?: Aleatorio): number {
  const m = /(\d+d\d+(?:\s*[+-]\s*\d+)?)/i.exec(texto);
  if (m) return Math.max(0, tirar(m[1]!.replace(/\s+/g, ''), azar).total);
  const n = /^(\d+)/.exec(texto.trim());
  return n ? Number(n[1]) : 0;
}

const d = (caras: number, azar?: Aleatorio) => tirar(`1d${caras}`, azar).total;

/** «2 tíos y 1 tía» (con los números en letra cuando es uno). */
function contar(n: number, singular: string, plural: string): string {
  return n === 1 ? `un${singular.endsWith('a') ? 'a' : ''} ${singular}` : `${n} ${plural}`;
}

function unirY(partes: string[]): string {
  return partes.length <= 1
    ? (partes[0] ?? '')
    : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

type Lado = 'padre' | 'madre';

/** Resultado de las subtiradas de una fila (cadena vacía si la fila no pide ninguna). */
export function subtiradas(tabla: TablaTrasfondo, f: FilaD100, azar?: Aleatorio): string {
  if (tabla === 'padres') {
    if (!String(f.texto).includes('padrastro')) return '';
    return d(2, azar) === 1
      ? 'Vive su padre, que volvió a casarse: tiene madrastra.'
      : 'Vive su madre, que volvió a casarse: tiene padrastro.';
  }

  if (tabla === 'hermanos') {
    const n = cantidad(String(f.texto), azar);
    if (!n) return '';
    const grupos = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const sexo = d(2, azar) === 1 ? 'hermano' : 'hermana';
      const edad = d(2, azar) === 1 ? 'mayor' : 'menor';
      const k = `${sexo}|${edad}`;
      grupos.set(k, (grupos.get(k) ?? 0) + 1);
    }
    const orden = ['hermano|mayor', 'hermana|mayor', 'hermano|menor', 'hermana|menor'];
    const partes = orden
      .filter((k) => grupos.get(k))
      .map((k) => {
        const [s, e] = k.split('|') as [string, string];
        const m = grupos.get(k)!;
        return m === 1
          ? `un${s === 'hermana' ? 'a' : ''} ${s} ${e}`
          : `${m} ${s}s ${e === 'mayor' ? 'mayores' : 'menores'}`;
      });
    return `${n} ${n === 1 ? 'hermano' : 'hermanos'}: ${unirY(partes)}.`;
  }

  if (tabla === 'familia_extendida') {
    const lado = () => (d(2, azar) === 1 ? 'padre' : 'madre') as Lado;
    // Abuelos: como mucho un abuelo y una abuela por cada lado.
    const abuelos: Record<Lado, string[]> = { padre: [], madre: [] };
    const nAbuelos = Math.min(4, cantidad(String(f.abuelos), azar));
    for (let i = 0; i < nAbuelos; i++) {
      let l = lado();
      if (abuelos[l].length >= 2) l = l === 'padre' ? 'madre' : 'padre';
      const libres = ['abuelo', 'abuela'].filter((x) => !abuelos[l].includes(x));
      abuelos[l].push(libres.length === 1 ? libres[0]! : d(2, azar) === 1 ? 'abuelo' : 'abuela');
    }
    const tios: Record<Lado, { tio: number; tia: number }> = {
      padre: { tio: 0, tia: 0 },
      madre: { tio: 0, tia: 0 },
    };
    const nTios = cantidad(String(f.tios), azar);
    for (let i = 0; i < nTios; i++) tios[lado()][d(2, azar) === 1 ? 'tio' : 'tia'] += 1;
    const primos: Record<Lado, number> = { padre: 0, madre: 0 };
    const nPrimos = cantidad(String(f.primos), azar);
    for (let i = 0; i < nPrimos; i++) primos[lado()] += 1;

    const porLado = (l: Lado) => {
      const p = [
        unirY(abuelos[l].sort().map((x) => (x === 'abuelo' ? 'el abuelo' : 'la abuela'))),
        unirY(
          [
            tios[l].tio ? contar(tios[l].tio, 'tío', 'tíos') : '',
            tios[l].tia ? contar(tios[l].tia, 'tía', 'tías') : '',
          ].filter(Boolean),
        ),
        primos[l] ? contar(primos[l], 'primo', 'primos') : '',
      ].filter(Boolean);
      return p.length ? `por parte de ${l}, ${p.join('; ')}` : '';
    };
    const texto = [porLado('padre'), porLado('madre')].filter(Boolean);
    if (!texto.length) return 'Sin abuelos, tíos ni primos vivos.';
    const s = texto.join(' · ');
    return `${s[0]!.toUpperCase()}${s.slice(1)}.`;
  }

  // Reputación y conexiones: aliados, contactos, enemigos y rivales
  const vinculos = String(f.vinculos ?? '');
  if (!vinculos || vinculos === '—' || vinculos === 'Ninguno') return '';
  const cuenta = new Map<string, number>();
  const sumar = (k: string) => cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
  if (tabla === 'conexiones') {
    // «Tira 1d4» una vez; «dos veces (2d4)», tres o cuatro
    const veces = /cuatro/.test(vinculos)
      ? 4
      : /tres/.test(vinculos)
        ? 3
        : /dos/.test(vinculos)
          ? 2
          : 1;
    for (let i = 0; i < veces; i++)
      sumar(['aliado', 'contacto', 'enemigo', 'rival'][d(4, azar) - 1]!);
  } else {
    const n = cantidad(vinculos, azar);
    const [a, b] = /Enemigo/.test(vinculos) ? ['enemigo', 'rival'] : ['contacto', 'aliado'];
    for (let i = 0; i < n; i++) sumar(d(2, azar) === 1 ? a! : b!);
  }
  const PLURAL: Record<string, string> = {
    aliado: 'aliados',
    contacto: 'contactos',
    enemigo: 'enemigos',
    rival: 'rivales',
  };
  const partes = ['aliado', 'contacto', 'rival', 'enemigo']
    .filter((k) => cuenta.get(k))
    .map((k) => contar(cuenta.get(k)!, k, PLURAL[k]!));
  const s = unirY(partes);
  return `${s[0]!.toUpperCase()}${s.slice(1)}.`;
}
