import { describe, expect, it } from 'vitest';
import { catalogo as cat } from '../datos/catalogo';
import { azarConSemilla } from './dados';
import { filaPara, subtiradas, tirarTrasfondo } from './trasfondo';

const fila = (tabla: Parameters<typeof filaPara>[1], d100: number) => filaPara(cat, tabla, d100)!;

describe('subtiradas de familia', () => {
  it('padrastro o madrastra', () => {
    const textos = new Set(
      Array.from({ length: 20 }, (_, s) =>
        subtiradas('padres', fila('padres', 50), azarConSemilla(s)),
      ),
    );
    expect([...textos].sort()).toEqual([
      'Vive su madre, que volvió a casarse: tiene padrastro.',
      'Vive su padre, que volvió a casarse: tiene madrastra.',
    ]);
    expect(subtiradas('padres', fila('padres', 10))).toBe('');
  });

  it('hermanos: cuántos, de qué sexo y si son mayores o menores', () => {
    expect(subtiradas('hermanos', fila('hermanos', 5))).toBe('');
    for (let s = 1; s <= 30; s++) {
      const t = subtiradas('hermanos', fila('hermanos', 95), azarConSemilla(s)); // 1d10
      const n = Number(/^(\d+)/.exec(t)![1]);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
      expect(t).toMatch(/herman[oa]s? (mayor|menor)/);
    }
  });

  it('familia extendida repartida por parte de padre y de madre', () => {
    expect(subtiradas('familia_extendida', fila('familia_extendida', 5))).toBe(
      'Sin abuelos, tíos ni primos vivos.',
    );
    for (let s = 1; s <= 30; s++) {
      const t = subtiradas('familia_extendida', fila('familia_extendida', 95), azarConSemilla(s)); // 1d3+1 abuelos, 1d6 tíos, 1d8 primos
      expect(t).toMatch(/por parte de (padre|madre)/i);
      expect(t).toMatch(/abuel/);
      // como mucho un abuelo y una abuela por cada lado
      for (const lado of t.split(' · '))
        expect((lado.match(/abuelo\b/g) ?? []).length).toBeLessThanOrEqual(1);
    }
  });

  it('reputación y conexiones dan aliados, contactos, rivales o enemigos', () => {
    for (let s = 1; s <= 20; s++) {
      expect(subtiradas('reputacion', fila('reputacion', 5), azarConSemilla(s))).toMatch(
        /(enemigo|rival)/i,
      );
      expect(subtiradas('reputacion', fila('reputacion', 90), azarConSemilla(s))).toMatch(
        /(contacto|aliado)/i,
      );
      const c = subtiradas('conexiones', fila('conexiones', 98), azarConSemilla(s)); // tira cuatro veces
      const total = [...c.matchAll(/(\d+|una?) (aliad|contact|enemig|rival)/gi)].reduce(
        (n, m) => n + (/^\d+$/.test(m[1]!) ? Number(m[1]) : 1),
        0,
      );
      expect(total).toBe(4);
    }
    expect(subtiradas('reputacion', fila('reputacion', 50))).toBe('');
    expect(subtiradas('conexiones', fila('conexiones', 10))).toBe('');
  });

  it('tirarTrasfondo incluye el detalle', () => {
    const r = tirarTrasfondo(cat, 'hermanos', azarConSemilla(4));
    if (r.tirada > 10) expect(r.detalle).toBeTruthy();
    expect(tirarTrasfondo(cat, 'eventos', azarConSemilla(4)).detalle).toBeUndefined();
  });
});
