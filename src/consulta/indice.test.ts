import { describe, expect, it } from 'vitest';
import { catalogo } from '../datos/catalogo';
import { buscar, buscarEntrada, claveEntrada, construirIndice, type TipoEntrada } from './indice';

const indice = construirIndice(catalogo);

describe('consulta de reglas', () => {
  it('indexa todos los catálogos con claves únicas', () => {
    const claves = indice.map(claveEntrada);
    expect(claves.length).toBe(new Set(claves).size);
    expect(indice.filter((e) => e.tipo === 'carrera').length).toBe(catalogo.carreras.length);
    expect(indice.filter((e) => e.tipo === 'formula').length).toBe(catalogo.formulas.length);
  });

  it('busca sin tildes y prioriza el título', () => {
    expect(buscar(indice, 'almogavar')[0]?.titulo).toBe('Almogávar');
    expect(buscar(indice, 'Medico')[0]?.titulo).toBe('Médico');
    expect(buscar(indice, 'espada bast').some((e) => e.titulo.startsWith('Espada bastarda'))).toBe(
      true,
    );
  });

  it('todas las palabras deben aparecer', () => {
    const r = buscar(indice, 'ballesta galera');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((e) => e.busqueda.includes('ballest') && e.busqueda.includes('galera'))).toBe(
      true,
    );
    expect(buscar(indice, 'zzzzzz')).toEqual([]);
  });

  it('filtra por tipo', () => {
    const tipos = new Set<TipoEntrada>(['ritual']);
    expect(buscar(indice, 'bendicion', tipos).every((e) => e.tipo === 'ritual')).toBe(true);
  });

  it('los enlaces cruzados apuntan a entradas existentes', () => {
    for (const e of indice) {
      for (const c of e.campos) {
        for (const r of c.refs ?? [])
          expect(buscarEntrada(indice, r.tipo, r.id), `${e.titulo} → ${r.nombre}`).toBeDefined();
      }
    }
  });
});
