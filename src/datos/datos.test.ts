// Comprobaciones mínimas de los catálogos de jugador generados por el extractor.
// La validación completa (enlaces al vault, secretos…) la hace extractor/validar.py, que necesita el vault;
// estos tests corren también en CI, donde solo existe el repositorio.
import { describe, expect, it } from 'vitest';
import habilidades from './jugador/habilidades.json';
import culturas from './jugador/culturas.json';
import carreras from './jugador/carreras.json';
import pueblos from './jugador/pueblos.json';
import credos from './jugador/credos.json';
import meta from './jugador/meta.json';

const idsHabilidad = new Set(habilidades.map((h) => h.id));

describe('catálogos de jugador', () => {
  it('tienen los recuentos de meta.json', () => {
    expect(habilidades.length).toBe(meta.recuentos.habilidades);
    expect(carreras.length).toBe(meta.recuentos.carreras);
    expect(pueblos.length).toBe(meta.recuentos.pueblos);
  });

  it('las culturas y carreras solo citan habilidades conocidas', () => {
    for (const c of [...culturas, ...carreras]) {
      for (const it of [...c.estandar, ...c.profesionales]) {
        expect(idsHabilidad.has(it.habilidad), `${c.nombre}: ${it.habilidad}`).toBe(true);
      }
    }
  });

  it('cada pueblo tiene un credo del catálogo', () => {
    const idsCredo = new Set(credos.map((c) => c.id));
    for (const p of pueblos) expect(idsCredo.has(p.credo), p.nombre).toBe(true);
  });

  it('no contienen secretos ni la cadena centinela', () => {
    const texto = JSON.stringify([habilidades, culturas, carreras, pueblos, credos]);
    expect(texto).not.toMatch(/\[!secreto/i);
    expect(texto).not.toContain('CENTINELA-DJ');
  });
});
