import { describe, expect, it } from 'vitest';
import { catalogo as cat } from '../datos/catalogo';
import { azarConSemilla } from '../motor/dados';
import { ARQUETIPOS, NIVELES } from './arquetipos';
import { datosDJ } from './datos';
import { exportarPNJ, generarPNJ, sociedadesPosibles, type OpcionesPNJ } from './pnj';

const base: OpcionesPNJ = {
  arquetipo: 'azar',
  nivel: 'curtido',
  reino: 'azar',
  año: 1360,
  sexo: 'azar',
  sociedad: 'ninguna',
};
const haySociedades = datosDJ.sociedades.length > 0;

describe('arquetipos', () => {
  it('solo citan carreras, estilos y habilidades del catálogo', () => {
    for (const a of ARQUETIPOS) {
      expect(
        cat.carreras.some((c) => c.id === a.carrera),
        a.id,
      ).toBe(true);
      for (const e of a.estilos ?? [])
        expect(
          cat.estilos.some((x) => x.id === e),
          `${a.id}: ${e}`,
        ).toBe(true);
      for (const c of a.claves.filter((x) => x !== 'estilo')) {
        expect(
          cat.habilidades.some((h) => h.id === c.split(':')[0]),
          `${a.id}: ${c}`,
        ).toBe(true);
      }
    }
  });
});

describe('generador de PNJ', () => {
  it('genera todos los arquetipos en todos los niveles sin errores', () => {
    let semilla = 1;
    for (const a of ARQUETIPOS) {
      for (const n of NIVELES) {
        const x = generarPNJ(
          { ...base, arquetipo: a.id, nivel: n.id },
          cat,
          [],
          azarConSemilla(semilla++),
        );
        expect(x.carrera.id).toBe(a.carrera);
        expect(x.habilidades.length).toBeGreaterThan(3);
        expect(x.nombre).not.toBe('Sin nombre');
        if (a.credos)
          expect(
            a.credos.map((c) => cat.credos.find((k) => k.id === c)!.nombre.replace('Credo ', '')),
          ).toContain(x.credo);
        if (a.sexo) expect(x.sexo).toBe(a.sexo);
      }
    }
  });

  it('respeta los requisitos de la carrera y del reino', () => {
    for (let s = 1; s <= 30; s++) {
      const rabino = generarPNJ({ ...base, arquetipo: 'rabino' }, cat, [], azarConSemilla(s));
      expect(rabino.credo).toBe('judío');
      expect(rabino.sexo).toBe('varon');
      const caballero = generarPNJ(
        { ...base, arquetipo: 'caballero', reino: 'corona-de-castilla' },
        cat,
        [],
        azarConSemilla(s),
      );
      expect(['Baja Nobleza', 'Alta Nobleza', 'Hidalgo Rural', 'Pariente Mayor']).toContain(
        caballero.clase,
      );
      const alfaqui = generarPNJ(
        { ...base, arquetipo: 'alfaqui', reino: 'reino-de-granada' },
        cat,
        [],
        azarConSemilla(s),
      );
      expect(alfaqui.reino).toBe('Reino de Granada');
    }
  });

  it('el nivel sube las habilidades clave', () => {
    const media = (nivel: OpcionesPNJ['nivel']) => {
      let suma = 0;
      for (let s = 1; s <= 20; s++) {
        const x = generarPNJ({ ...base, arquetipo: 'soldado', nivel }, cat, [], azarConSemilla(s));
        suma += x.estilo!.valor;
      }
      return suma / 20;
    };
    expect(media('novato')).toBeLessThan(media('curtido'));
    expect(media('veterano')).toBeLessThan(media('maestro'));
  });

  it('exporta con la plantilla de PNJ y el secreto plegado', () => {
    const md = exportarPNJ(
      generarPNJ({ ...base, arquetipo: 'bruja', nivel: 'veterano' }, cat, [], azarConSemilla(9)),
      'La sombra del Temple',
    );
    expect(md).toMatch(/^---\ntipo: "pnj"\npartida: "\[\[La sombra del Temple\]\]"/);
    expect(md).toContain('> [!secreto]- Secretos (sólo DJ)');
    expect(md).toContain('[[Brujo]]');
    expect(md).toContain('- **Fórmulas:** [[');
  });
});

describe.skipIf(!haySociedades)('sociedades secretas (datos del DJ)', () => {
  it('respeta el año de fundación', () => {
    // La más reciente, sin nombrarla: el código del DJ está en el repositorio público y los datos no.
    const reciente = [...datosDJ.sociedades].sort((a, b) => b.desde - a.desde)[0]!;
    const antes = reciente.desde - 1;
    expect(sociedadesPosibles(datosDJ.sociedades, antes).map((s) => s.id)).not.toContain(
      reciente.id,
    );
    expect(sociedadesPosibles(datosDJ.sociedades, reciente.desde).map((s) => s.id)).toContain(
      reciente.id,
    );
    const x = generarPNJ(
      { ...base, año: antes, sociedad: reciente.id },
      cat,
      datosDJ.sociedades,
      azarConSemilla(3),
    );
    expect(x.sociedad).toBeUndefined();
    expect(x.avisos.join(' ')).toContain('no existe aún');
  });

  it('cada miembro tiene una carrera de su sociedad y la afiliación va en el secreto', () => {
    let s = 1;
    for (const soc of datosDJ.sociedades) {
      const x = generarPNJ(
        { ...base, año: 1380, sociedad: soc.id },
        cat,
        datosDJ.sociedades,
        azarConSemilla(s++),
      );
      expect(x.sociedad?.id).toBe(soc.id);
      expect(soc.carreras).toContain(x.carrera.id);
      if (soc.credos)
        expect(
          soc.credos.map((c) => cat.credos.find((k) => k.id === c)!.nombre.replace('Credo ', '')),
        ).toContain(x.credo);
      const md = exportarPNJ(x);
      const secreto = md.slice(md.indexOf('> [!secreto]-'));
      expect(secreto).toContain(soc.nombre);
      expect(md.slice(0, md.indexOf('> [!secreto]-'))).not.toContain(soc.nombre);
    }
  });
});
