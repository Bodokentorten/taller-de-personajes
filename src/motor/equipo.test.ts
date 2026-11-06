import { describe, expect, it } from 'vitest';
import { catalogo as cat } from '../datos/catalogo';
import { rodrigo } from './ejemplos';
import { calcularHoja } from './hoja';
import { resumenEquipo, soltarContenedor, soltarTodo } from './equipo';

function cargado() {
  const p = rodrigo(); // FUE 14: hasta 28 de CAR sin penalización
  p.equipo = [
    { id: 'armadura:gambeson', cantidad: 1, puesto: true }, // CAR 6 puesto → 3
    { id: 'equipo:morral', cantidad: 1 }, // CAR 1
    { id: 'equipo:arcon', cantidad: 3, en: 'equipo:morral' }, // 15 dentro del morral
    { id: 'equipo:mula', cantidad: 1 },
    { id: 'equipo:alforjas', cantidad: 1 },
    { id: 'equipo:arcon', cantidad: 1, en: 'equipo:alforjas' }, // no cuenta: va en la mula
  ];
  return p;
}

describe('contenedores', () => {
  it('lo que va en un contenedor pesa; lo de la montura y los animales, no', () => {
    // Dos entradas con el mismo id: el arcón del morral y el de las alforjas se resuelven por separado
    const r = resumenEquipo(cargado(), cat);
    expect(r.car).toBe(3 + 1 + 15);
    expect(r.carFuera).toBe(5);
    expect(r.objetos.find((o) => o.id === 'equipo:mula')!.ubicacion).toBe('fuera');
    expect(r.objetos.find((o) => o.id === 'equipo:morral')!.contenedor).toMatchObject({
      capacidad: 20,
      dentro: 15,
    });
  });

  it('soltar el morral quita su peso y el de su contenido', () => {
    const p = cargado();
    soltarContenedor(p, 'equipo:morral', true);
    const r = resumenEquipo(p, cat);
    expect(r.car).toBe(3);
    expect(r.objetos.filter((o) => o.ubicacion === 'soltado').map((o) => o.id)).toEqual([
      'equipo:morral',
      'equipo:arcon',
    ]);
    soltarContenedor(p, 'equipo:morral', false);
    expect(resumenEquipo(p, cat).car).toBe(19);
    soltarTodo(p);
    expect(resumenEquipo(p, cat).car).toBe(3);
    // Las alforjas no se «sueltan»: van en la montura
    expect(p.equipo.find((e) => e.id === 'equipo:alforjas')!.soltado).toBeUndefined();
  });

  it('avisa si un contenedor va desbordado', () => {
    const p = cargado();
    p.equipo.push({ id: 'equipo:arcon', cantidad: 2, en: 'equipo:morral' });
    expect(calcularHoja(p, cat).problemas.map((x) => x.codigo)).toContain('contenedor-lleno');
  });
});
