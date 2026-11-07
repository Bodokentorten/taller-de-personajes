// Exportación a Markdown: se compara con archivos de referencia («golden files»). Si un cambio en el
// formato es intencionado, se regeneran con `npx vitest run -u` y se revisa el diff.
import { describe, expect, it } from 'vitest';
import { catalogo } from '../datos/catalogo';
import { joan, mose, rodrigo } from '../motor/ejemplos';
import type { Personaje } from '../motor/personaje';
import { enlace, exportarMarkdown } from './markdown';

function rodrigoEquipado(): Personaje {
  const p = rodrigo();
  p.partida = 'La sombra del Temple';
  p.edad = 24;
  p.equipo = [
    { id: 'distancia:ballesta', cantidad: 1 },
    { id: 'arma:bracamante', cantidad: 1 },
    { id: 'escudo:broquel', cantidad: 1 },
    { id: 'armadura:gambeson', cantidad: 1, puesto: true },
    { id: 'casco:capacete', cantidad: 1, puesto: true },
    { id: 'equipo:antorchas-3', cantidad: 2 },
  ];
  p.trasfondo = {
    padres: { tirada: 7, texto: 'Ambos padres vivos' },
    eventos: [{ tirada: 42, texto: 'Salvó a un mercader de unos salteadores.' }],
  };
  return p;
}

describe('exportación a Markdown', () => {
  it('Rodrigo (estándar, con equipo)', async () => {
    await expect(exportarMarkdown(rodrigoEquipado(), catalogo)).toMatchFileSnapshot(
      './__golden__/rodrigo.md',
    );
  });
  it('Mosé (pirámide, fe)', async () => {
    await expect(exportarMarkdown(mose(), catalogo)).toMatchFileSnapshot('./__golden__/mose.md');
  });
  it('Joan (magia)', async () => {
    await expect(exportarMarkdown(joan(), catalogo)).toMatchFileSnapshot('./__golden__/joan.md');
  });

  it('solo enlaza notas de los catálogos o de la plantilla', () => {
    const conocidas = new Set<string>([
      ...[
        catalogo.habilidades,
        catalogo.culturas,
        catalogo.carreras,
        catalogo.pueblos,
        catalogo.credos,
        catalogo.reinos,
        catalogo.formulas,
        catalogo.rituales,
      ].flatMap((l) => l.map((x) => x.nota)),
      ...[
        ...catalogo.armas.cuerpo_a_cuerpo,
        ...catalogo.armas.distancia,
        ...catalogo.armas.escudos,
      ].flatMap((a) => a.efectos),
      // Notas fijas de la plantilla
      'Comunidad, Familia, Clase Social y Eventos de Trasfondo',
      'Características y Atributos',
      'Puntos de Suerte',
      'Fatiga',
      'Ubicaciones de Impacto',
      '02 - Habilidades (Índice)',
      'Estilos de Combate',
      'Estilo de combate',
      'Armas, Armaduras y Escudos de los Reinos Hispánicos',
      'Pasiones y Equipo Inicial',
      '05 - Magia y Fe (Índice)',
      'Fe',
      'Rituales de fe',
      'Informe de Integración - Horror, Estrés y Pánico',
      'Escalera de miedo',
      'La sombra del Temple',
    ]);
    for (const p of [rodrigoEquipado(), mose(), joan()]) {
      const md = exportarMarkdown(p, catalogo);
      for (const m of md.matchAll(/\[\[([^\]|#\\]+)/g))
        expect(conocidas, m[1]).toContain(m[1]!.trim());
    }
  });

  it('escapa el alias dentro de las tablas', () => {
    expect(enlace('Credo cristiano', 'cristiano')).toBe('[[Credo cristiano|cristiano]]');
    const md = exportarMarkdown(joan(), catalogo);
    expect(md).toContain('[[Fuentes Místicas de los reinos\\|Fuente Mística]]');
  });
});
