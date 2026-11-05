import { describe, expect, it } from 'vitest';
import { catalogo as cat } from '../datos/catalogo';
import { azarConSemilla, type Aleatorio } from './dados';
import { mose, rodrigo } from './ejemplos';
import {
  aplicarPifias,
  aprenderFormula,
  aprenderHabilidad,
  costeCaracteristica,
  dadosEntrenamiento,
  entrenar,
  filaEntrenamiento,
  mejorarCaracteristica,
  mejorarHabilidad,
  mejorarPasion,
  nuevaPasion,
  otorgarTiradas,
  tiradaMejora,
} from './experiencia';
import { valorDe } from './habilidades';
import { calcularHoja } from './hoja';
import { grado, nivelHerida, tirarPanico, valorConDificultad } from './juego';

/** Azar que devuelve los d100 indicados, en orden (para tiradas exactas). */
const dados = (...valores: number[]): Aleatorio => {
  let i = 0;
  return () => (valores[i++ % valores.length]! - 1) / 100 + 0.0001;
};

describe('tiradas de habilidad', () => {
  it('grados de éxito', () => {
    expect(grado(4, 33)).toBe('critico'); // ⌈33/10⌉ = 4
    expect(grado(5, 33)).toBe('exito');
    expect(grado(33, 33)).toBe('exito');
    expect(grado(34, 33)).toBe('fallo');
    expect(grado(3, 1)).toBe('exito'); // 01–05 siempre éxito
    expect(grado(97, 120)).toBe('fallo'); // 96–00 siempre fallo
    expect(grado(99, 80)).toBe('pifia');
    expect(grado(99, 120)).toBe('fallo'); // por encima de 100 solo pifia el 00
    expect(grado(100, 120)).toBe('pifia');
  });
  it('grados de dificultad', () => {
    expect(valorConDificultad(33, 'muy-facil')).toBe(66);
    expect(valorConDificultad(33, 'dificil')).toBe(22);
    expect(valorConDificultad(33, 'formidable')).toBe(17);
    expect(valorConDificultad(33, 'herculeo')).toBe(7);
  });
  it('heridas y pánico', () => {
    expect(nivelHerida(5, 5)).toBe('ilesa');
    expect(nivelHerida(2, 5)).toBe('leve');
    expect(nivelHerida(0, 5)).toBe('grave');
    expect(nivelHerida(-5, 5)).toBe('mayor');
    const p = tirarPanico(10, azarConSemilla(1));
    expect(p.total).toBe(p.d20 + 10);
    expect(p.aterrorizado).toBe(p.total >= 13);
  });
});

describe('experiencia', () => {
  it('1d100 + INT contra el valor', () => {
    expect(tiradaMejora(60, 11, dados(50, 1))).toMatchObject({ total: 61, exito: true });
    expect(tiradaMejora(60, 11, dados(48))).toMatchObject({ total: 59, exito: false, delta: 1 });
  });

  it('otorga tiradas, sube una habilidad una vez por entrega y anota el historial', () => {
    const p = rodrigo();
    otorgarTiradas(p, 3, true, 0);
    expect(p.experiencia!.tiradas).toBe(3);
    const antes = valorDe(calcularHoja(p, cat).habilidades, 'atletismo');
    const r = mejorarHabilidad(p, cat, 'atletismo', dados(10));
    expect(r.ok).toBe(true);
    expect(valorDe(calcularHoja(p, cat).habilidades, 'atletismo')).toBe(antes + 1); // 10 + 11 < 57 → +1
    expect(mejorarHabilidad(p, cat, 'atletismo').ok).toBe(false);
    expect(p.experiencia!.tiradas).toBe(2);
    expect(p.experiencia!.historial.map((c) => c.tipo)).toEqual(['otorgadas', 'habilidad']);
    // La experiencia no rompe la validación de la creación
    expect(calcularHoja(p, cat).valido).toBe(true);
  });

  it('pifias, Pasiones, habilidades nuevas y características', () => {
    const p = rodrigo();
    otorgarTiradas(p, 20, false, 0);
    aplicarPifias(p, cat, ['nadar', 'nadar']);
    expect(valorDe(calcularHoja(p, cat).habilidades, 'nadar')).toBe(28);
    expect(mejorarPasion(p, cat, 0, dados(95, 1)).ok).toBe(true); // 95 + 11 ≥ 60 → +1d4+1
    expect(calcularHoja(p, cat).pasiones[0]!.valor).toBeGreaterThanOrEqual(62);
    expect(nuevaPasion(p, 'Amor (Doña Elvira)', 3).ok).toBe(true);
    expect(calcularHoja(p, cat).pasiones[3]!.valor).toBe(20); // POD+INT sin bono
    expect(aprenderHabilidad(p, cat, 'idioma:Árabe andalusí').ok).toBe(true);
    expect(valorDe(calcularHoja(p, cat).habilidades, 'idioma:Árabe andalusí')).toBe(18); // INT+CAR
    expect(costeCaracteristica(p, cat, 'DES')).toBe(11); // 1 + 13 − 3
    expect(costeCaracteristica(p, cat, 'TAM')).toBeUndefined();
    expect(mejorarCaracteristica(p, cat, 'CAR').ok).toBe(true); // 1 + 7 − 3 = 5
    expect(calcularHoja(p, cat).atributos.modExperiencia).toBe(0);
    expect(p.experiencia!.tiradas).toBe(20 - 1 - 1 - 3 - 5);
    expect(calcularHoja(p, cat).valido).toBe(true);
  });

  it('entrenamiento con maestro', () => {
    expect(filaEntrenamiento(20, 'ninguno')).toBeUndefined();
    expect(dadosEntrenamiento(filaEntrenamiento(48, 'ninguno')!)).toBe('1d4');
    expect(dadosEntrenamiento(filaEntrenamiento(48, 'critico')!)).toBe('1d6+1'); // el ejemplo del vault
    expect(filaEntrenamiento(25, 'pifia')).toBeUndefined();
    expect(dadosEntrenamiento(filaEntrenamiento(105, 'ninguno')!)).toBe('1d6+5');
    const p = rodrigo();
    expect(entrenar(p, cat, 'atletismo', 70, 'ninguno').ok).toBe(false); // 70 − 57 = 13
    expect(entrenar(p, cat, 'atletismo', 90, 'exito').ok).toBe(true);
    expect(entrenar(p, cat, 'atletismo', 95, 'exito').ok).toBe(false); // ya entrenada
  });

  it('fórmulas y ordos aprendidos en juego', () => {
    const p = mose();
    const h0 = calcularHoja(p, cat);
    otorgarTiradas(p, 2, false, 0, h0.fe.ordoMaximo);
    expect(p.experiencia!.ordo).toBe(3);
    expect(aprenderFormula(p, cat, 'leche-de-sapiencia', 'con un maestro').ok).toBe(true);
    // Las fórmulas aprendidas en juego no cuentan para el límite de la creación
    expect(calcularHoja(p, cat).problemas.map((x) => x.codigo)).not.toContain(
      'demasiadas-formulas',
    );
  });
});
