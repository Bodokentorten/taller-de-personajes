import { describe, expect, it } from 'vitest';
import { azarConSemilla, tirar } from './dados';

describe('tirar', () => {
  it('respeta los límites de 3d6', () => {
    const azar = azarConSemilla(1);
    for (let i = 0; i < 2000; i++) {
      const t = tirar('3d6', azar);
      expect(t.dados).toHaveLength(3);
      expect(t.total).toBeGreaterThanOrEqual(3);
      expect(t.total).toBeLessThanOrEqual(18);
    }
  });

  it('aplica el modificador de 2d6+6', () => {
    const t = tirar('2d6+6', () => 0); // todos los dados sacan 1
    expect(t.total).toBe(8);
    expect(t.modificador).toBe(6);
  });

  it('entiende «d100» y los extremos', () => {
    expect(tirar('d100', () => 0).total).toBe(1);
    expect(tirar('d100', () => 0.999999).total).toBe(100);
  });

  it('es reproducible con semilla', () => {
    const a = tirar('5d10', azarConSemilla(42));
    const b = tirar('5d10', azarConSemilla(42));
    expect(a).toEqual(b);
  });

  it('rechaza expresiones mal formadas', () => {
    expect(() => tirar('tres dados')).toThrow();
    expect(() => tirar('0d6')).toThrow();
    expect(() => tirar('2d1')).toThrow();
  });
});
