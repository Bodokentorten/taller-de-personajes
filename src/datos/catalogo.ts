// Catálogos de jugador ya tipados. Es el único sitio que importa los JSON.
import type {
  Carrera, CatalogoArmas, Credo, Cultura, EstiloCombate, Formula, Grimorio, GrupoNomina, Habilidad,
  ObjetoEquipo, Pueblo, Reglas, Reino, Ritual, Trasfondo,
} from './tipos';
import habilidadesJ from './jugador/habilidades.json';
import culturasJ from './jugador/culturas.json';
import carrerasJ from './jugador/carreras.json';
import pueblosJ from './jugador/pueblos.json';
import credosJ from './jugador/credos.json';
import reinosJ from './jugador/reinos.json';
import trasfondoJ from './jugador/trasfondo.json';
import reglasJ from './jugador/reglas.json';
import armasJ from './jugador/armas.json';
import equipoJ from './jugador/equipo.json';
import estilosJ from './jugador/estilos.json';
import nominaJ from './jugador/nomina.json';
import formulasJ from './jugador/formulas.json';
import ritualesJ from './jugador/rituales.json';
import grimoriosJ from './jugador/grimorios.json';

export interface Catalogo {
  habilidades: Habilidad[];
  culturas: Cultura[];
  carreras: Carrera[];
  pueblos: Pueblo[];
  credos: Credo[];
  reinos: Reino[];
  trasfondo: Trasfondo;
  reglas: Reglas;
  armas: CatalogoArmas;
  equipo: ObjetoEquipo[];
  estilos: EstiloCombate[];
  nomina: GrupoNomina[];
  formulas: Formula[];
  rituales: Ritual[];
  grimorios: Grimorio[];
}

export const catalogo: Catalogo = {
  habilidades: habilidadesJ as Habilidad[],
  culturas: culturasJ as unknown as Cultura[],
  carreras: carrerasJ as unknown as Carrera[],
  pueblos: pueblosJ as unknown as Pueblo[],
  credos: credosJ as unknown as Credo[],
  reinos: reinosJ as Reino[],
  trasfondo: trasfondoJ as unknown as Trasfondo,
  reglas: reglasJ as unknown as Reglas,
  armas: armasJ as unknown as CatalogoArmas,
  equipo: equipoJ as unknown as ObjetoEquipo[],
  estilos: estilosJ.estilos as unknown as EstiloCombate[],
  nomina: nominaJ as GrupoNomina[],
  formulas: formulasJ as unknown as Formula[],
  rituales: ritualesJ as Ritual[],
  grimorios: grimoriosJ as Grimorio[],
};

/** Busca por id y lanza un error claro si no existe (fallo de datos o de programación). */
export function porId<T extends { id: string }>(lista: readonly T[], id: string, que = 'entrada'): T {
  const e = lista.find((x) => x.id === id);
  if (!e) throw new Error(`No existe ${que} «${id}»`);
  return e;
}

export function buscar<T extends { id: string }>(lista: readonly T[], id: string | undefined): T | undefined {
  return id === undefined ? undefined : lista.find((x) => x.id === id);
}
