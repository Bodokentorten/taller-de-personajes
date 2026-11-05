import { describe, expect, it } from 'vitest';
import { personajeVacio } from '../motor/personaje';
import { leerArchivo, migrar, serializar } from './archivo';

describe('archivos JSON', () => {
  it('un personaje exportado se vuelve a importar sin perder datos', () => {
    const p = personajeVacio('abc');
    p.nombre = 'Leonor';
    p.asignaciones = [{ clave: 'idioma:Latín', fuente: 'cultura', puntos: 10 }];
    p.trasfondo = { padres: { tirada: 42, texto: 'Ambos vivos' } };
    expect(leerArchivo(serializar([p]))).toEqual([p]);
  });

  it('acepta un personaje suelto y rellena los campos que falten', () => {
    const viejo = { id: 'x1', nombre: 'Pero', version: 1, caracteristicas: { metodo: 'manual' } };
    const [p] = leerArchivo(JSON.stringify(viejo));
    expect(p!.nombre).toBe('Pero');
    expect(p!.caracteristicas.metodo).toBe('manual');
    expect(p!.caracteristicas.valores.FUE).toBe(11);
    expect(p!.trasfondo).toEqual({});
  });

  it('rechaza lo que no es un personaje', () => {
    expect(() => leerArchivo('no es json')).toThrow('JSON');
    expect(() => migrar({ nombre: 'sin id' })).toThrow('id');
    expect(() => migrar({ id: 'x', version: 99 })).toThrow('versión');
  });
});
