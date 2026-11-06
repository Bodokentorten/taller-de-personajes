// Generador de PNJ (edición del DJ). Elige un origen coherente con el reino, el año y la carrera, y
// calcula características, atributos, habilidades clave y Pasiones con las reglas del motor.
import type { Catalogo } from '../datos/catalogo';
import { CARACTERISTICAS, type Caracteristica, type Pueblo, type Sexo } from '../datos/tipos';
import { calcularAtributos, type Atributos } from '../motor/atributos';
import { tirarCaracteristicas } from '../motor/caracteristicas';
import { tirar, type Aleatorio } from '../motor/dados';
import { evaluar } from '../motor/formulas';
import { base, nombreHabilidad } from '../motor/habilidades';
import { tablaClases, validarCarrera, validarOrigen } from '../motor/origen';
import {
  CAMPAÑA_POR_DEFECTO,
  clave as hacerClave,
  partirClave,
  personajeVacio,
  type Personaje,
} from '../motor/personaje';
import {
  ARQUETIPOS,
  ASPECTO,
  GANCHOS,
  MOTIVACION,
  NIVELES,
  PERSONALIDAD,
  PESO_REINO,
  SECRETOS,
  VILLAS,
  type Arquetipo,
  type Nivel,
} from './arquetipos';
import type { Sociedad } from './datos';

export interface OpcionesPNJ {
  arquetipo: string; // id o 'azar'
  nivel: Nivel;
  reino: string; // id o 'azar'
  año: number;
  sexo: Sexo | 'azar';
  /** 'ninguna', 'azar' (una de cada cuatro veces) o el id de una sociedad. */
  sociedad: string;
}

export interface PNJ {
  nombre: string;
  sexo: Sexo;
  edad: number;
  arquetipo: string;
  nivel: string;
  reino: string;
  pueblo: string;
  credo: string;
  cultura: string;
  clase: string;
  carrera: { id: string; nombre: string; nota: string };
  caracteristicas: Record<Caracteristica, number>;
  atributos: Atributos;
  habilidades: { clave: string; nombre: string; valor: number }[];
  estilo?: { id: string; nombre: string; valor: number; armas: string[]; rasgos: string[] };
  pasiones: { nombre: string; valor: number }[];
  formulas: { id: string; nombre: string; nota: string }[];
  equipo: string;
  armadura: string;
  aspecto: string;
  personalidad: string;
  motivacion: string;
  actitud: string;
  secreto: string;
  gancho: string;
  sociedad?: { id: string; nombre: string; nota: string; rol: string };
  avisos: string[];
}

const elegir = <T>(lista: readonly T[], azar: Aleatorio): T =>
  lista[Math.floor(azar() * lista.length)]!;

function elegirPeso<T>(lista: readonly T[], peso: (x: T) => number, azar: Aleatorio): T {
  const total = lista.reduce((s, x) => s + peso(x), 0);
  let r = azar() * total;
  for (const x of lista) {
    r -= peso(x);
    if (r < 0) return x;
  }
  return lista[lista.length - 1]!;
}

/** Sociedades a las que puede pertenecer: existen en ese año y admiten su credo. */
export function sociedadesPosibles(
  sociedades: readonly Sociedad[],
  año: number,
  credo?: string,
): Sociedad[] {
  return sociedades.filter(
    (s) => s.desde <= año && (!credo || !s.credos || s.credos.includes(credo)),
  );
}

export function generarPNJ(
  op: OpcionesPNJ,
  cat: Catalogo,
  sociedades: readonly Sociedad[],
  azar: Aleatorio = Math.random,
): PNJ {
  const avisos: string[] = [];
  const nivel = NIVELES.find((n) => n.id === op.nivel) ?? NIVELES[1];
  let arq: Arquetipo =
    op.arquetipo === 'azar'
      ? elegir(ARQUETIPOS, azar)
      : (ARQUETIPOS.find((a) => a.id === op.arquetipo) ?? ARQUETIPOS[0]!);

  // ── Sociedad secreta ──
  let sociedad: Sociedad | undefined;
  const credosArq = arq.credos;
  if (op.sociedad === 'azar' ? azar() < 0.25 : op.sociedad !== 'ninguna') {
    const posibles = sociedadesPosibles(sociedades, op.año).filter(
      (s) => op.sociedad === 'azar' || s.id === op.sociedad,
    );
    sociedad = posibles.length ? elegir(posibles, azar) : undefined;
    if (!sociedad && op.sociedad !== 'azar')
      avisos.push(`La sociedad elegida no existe aún en ${op.año} o no hay datos del DJ.`);
  }
  let carreraId = arq.carrera;
  if (sociedad && !sociedad.carreras.includes(carreraId)) {
    // La carrera la decide la sociedad; el resto del arquetipo se conserva si encaja.
    carreraId = elegir(sociedad.carreras, azar);
    arq = ARQUETIPOS.find((a) => a.carrera === carreraId) ?? {
      ...arq,
      carrera: carreraId,
      credos: undefined,
      sexo: undefined,
      estilos: undefined,
    };
  }
  const carrera = cat.carreras.find((c) => c.id === carreraId)!;
  const credosPermitidos = sociedad?.credos ?? arq.credos ?? credosArq;

  // ── Origen ──
  const reinoId =
    op.reino === 'azar'
      ? elegirPeso(Object.keys(PESO_REINO), (r) => PESO_REINO[r]!, azar)
      : op.reino;
  const reino = cat.reinos.find((r) => r.id === reinoId) ?? cat.reinos[0]!;
  const sexo: Sexo =
    op.sexo !== 'azar'
      ? op.sexo
      : (arq.sexo ?? carrera.requisitos.sexo ?? (azar() < 0.5 ? 'varon' : 'mujer'));
  if (sociedad?.estamentos && !carrera.requisitos.estamentos)
    avisos.push('Su sociedad exige nobleza.');

  const p: Personaje = personajeVacio('pnj');
  p.sexo = sexo;
  p.carrera = carrera.id;
  p.origen.reino = reino.id;
  const minoria = arq.minoria ?? 0.05;
  const pueblos = cat.pueblos.filter(
    (x) =>
      x.reinos.includes(reino.nombre) &&
      !x.raro &&
      (!credosPermitidos || credosPermitidos.includes(x.credo)),
  );
  /** El pueblo admite la carrera con alguna cultura y alguna clase social (los vascos no son infanzones). */
  const admite = (x: Pueblo) =>
    cat.culturas.some((cu) =>
      tablaClases(
        { ...p, origen: { ...p.origen, pueblo: x.id, credo: x.credo, cultura: cu.id } },
        cat,
      ).tabla.some((cl) => {
        const q = {
          ...p,
          origen: { ...p.origen, pueblo: x.id, credo: x.credo, cultura: cu.id, clase: cl.id },
        };
        const errores = [
          ...validarCarrera(q, cat, CAMPAÑA_POR_DEFECTO),
          ...validarOrigen(q, cat, CAMPAÑA_POR_DEFECTO),
        ];
        return (
          !errores.some(
            (e) => e.gravedad === 'error' && (e.paso === 'carrera' || e.codigo.startsWith('clase')),
          ) &&
          (!sociedad?.estamentos || sociedad.estamentos.includes(cl.estamento))
        );
      }),
    );
  const candidatos = pueblos.filter(admite);
  if (!candidatos.length)
    avisos.push(
      `Ningún pueblo de ${reino.nombre} encaja con la carrera ${carrera.nombre}: se ignora el reino.`,
    );
  const lista = candidatos.length
    ? candidatos
    : cat.pueblos.filter(
        (x) => !x.raro && (!credosPermitidos || credosPermitidos.includes(x.credo)),
      );
  const dominante = (x: Pueblo) =>
    reino.id === 'reino-de-granada' ? x.credo === 'musulman' : x.credo === 'cristiano';
  const pueblo = elegirPeso(
    lista,
    (x) =>
      (dominante(x) ? (1 - minoria) * 10 : minoria * 10) /
      Math.max(1, lista.filter((y) => dominante(y) === dominante(x)).length),
    azar,
  );
  p.origen.pueblo = pueblo.id;
  p.origen.credo = pueblo.credo;
  if (!pueblo.reinos.includes(reino.nombre))
    p.origen.reino = cat.reinos.find((r) => r.nombre === pueblo.reinos[0])?.id ?? reino.id;
  p.lenguaMaterna = pueblo.lengua_materna;

  // ¿Encaja esta clase social con la carrera y el pueblo (y, si hay sociedad, con su estamento)?
  const valida = (id: string) => {
    const q = { ...p, origen: { ...p.origen, clase: id } };
    const e = tablaClases(q, cat).tabla.find((c) => c.id === id)?.estamento;
    if (!e) return false;
    return (
      ![
        ...validarOrigen(q, cat, CAMPAÑA_POR_DEFECTO),
        ...validarCarrera(q, cat, CAMPAÑA_POR_DEFECTO),
      ].some(
        (x) =>
          x.gravedad === 'error' && (x.codigo.startsWith('clase') || x.codigo === 'carrera-clase'),
      ) &&
      (!sociedad?.estamentos || sociedad.estamentos.includes(e))
    );
  };
  // Cultura: habitual del pueblo y de la carrera, y con alguna clase social válida en su tabla
  // (un infanzón no puede ser nómada: los pastores no tienen nobleza).
  const conClase = (cultura: string) => {
    p.origen.cultura = cultura;
    return tablaClases(p, cat).tabla.some((c) => valida(c.id));
  };
  const habituales = pueblo.culturas_habituales.filter((c) =>
    carrera.culturas_habituales.includes(c),
  );
  const opciones =
    [habituales, pueblo.culturas_habituales, cat.culturas.map((c) => c.id)]
      .map((l) => l.filter(conClase))
      .find((l) => l.length) ?? pueblo.culturas_habituales;
  p.origen.cultura = elegir(opciones, azar);

  // Clase social: se tira hasta que encaje.
  const tabla = tablaClases(p, cat).tabla;
  let clase = tabla.find((c) => c.id === p.origen.clase);
  for (let i = 0; i < 40 && !clase; i++) {
    const t = tirar('1d100', azar).total;
    const c = tabla.find((x) => t >= x.min && t <= x.max);
    if (c && valida(c.id)) clase = c;
  }
  clase ??= tabla.find((c) => valida(c.id)) ?? tabla[0];
  p.origen.clase = clase?.id ?? '';

  // ── Características y atributos ──
  const { valores } = tirarCaracteristicas(cat.reglas, azar);
  const atributos = calcularAtributos(valores, cat.reglas);

  // ── Habilidades ──
  const objetivo = (b: number) => Math.max(b, nivel.objetivo + tirar('1d10', azar).total - 5);
  const estilos = [...(sociedad?.estilos ?? []), ...(arq.estilos ?? [])].filter((e) =>
    cat.estilos.some((x) => x.id === e),
  );
  const estiloId = estilos.length ? elegir(estilos, azar) : undefined;
  const claves = [
    ...arq.claves,
    ...(sociedad?.habilidades ?? []).flatMap((it) =>
      it.especialidad
        ? it.especialidad.split(/,\s*/).map((e) => hacerClave(it.habilidad, e))
        : [it.habilidad],
    ),
  ];
  const vistas = new Set<string>();
  const habilidades: PNJ['habilidades'] = [];
  let estilo: PNJ['estilo'];
  for (const c of claves) {
    if (c === 'estilo') {
      const e = cat.estilos.find((x) => x.id === estiloId);
      const h = cat.habilidades.find((x) => x.id === 'estilo-de-combate')!;
      if (e)
        estilo = {
          id: e.id,
          nombre: e.nombre,
          valor: objetivo(base(h, valores)),
          armas: e.armas,
          rasgos: e.rasgos,
        };
      continue;
    }
    if (vistas.has(c)) continue;
    vistas.add(c);
    const h = cat.habilidades.find((x) => x.id === partirClave(c).habilidad);
    if (!h) {
      avisos.push(`Habilidad desconocida en el arquetipo: ${c}.`);
      continue;
    }
    habilidades.push({
      clave: c,
      nombre: nombreHabilidad(cat, c),
      valor: objetivo(base(h, valores)),
    });
  }
  if (!estilo && estiloId) {
    const e = cat.estilos.find((x) => x.id === estiloId)!;
    const h = cat.habilidades.find((x) => x.id === 'estilo-de-combate')!;
    estilo = {
      id: e.id,
      nombre: e.nombre,
      valor: base(h, valores) + nivel.secundaria * 2,
      armas: e.armas,
      rasgos: e.rasgos,
    };
  }
  // Secundarias: las estándar de la carrera que no son clave, con menos puntos.
  for (const it of carrera.estandar) {
    if (it.habilidad === 'estilo-de-combate' || vistas.has(it.habilidad)) continue;
    const h = cat.habilidades.find((x) => x.id === it.habilidad);
    if (!h || h.especialidades) continue;
    vistas.add(h.id);
    habilidades.push({ clave: h.id, nombre: h.nombre, valor: base(h, valores) + nivel.secundaria });
  }

  // ── Pasiones ──
  const credo = cat.credos.find((c) => c.id === pueblo.credo);
  const nombresPasion = [...new Set([...(sociedad?.pasiones ?? []), ...arq.pasiones])].map((x) =>
    x === 'Fe' || x.startsWith('Fe (') ? (credo?.pasion_fe ?? x) : x,
  );
  // Quien odia a Dios o a la Iglesia no tiene Fe (salvo que su sociedad o su arquetipo la den).
  const descreido = nombresPasion.some((x) => /^Odio \((Dios|la Iglesia)/.test(x));
  if (credo && !descreido && !nombresPasion.some((x) => x.startsWith('Fe')) && azar() < 0.7)
    nombresPasion.push(credo.pasion_fe);
  const pasiones = [...new Set(nombresPasion)].slice(0, 4).map((nombre) => ({
    nombre,
    valor: evaluar('POD+INT', valores) + nivel.pasion + tirar('1d10', azar).total - 5,
  }));

  // ── Magia ──
  let formulas: PNJ['formulas'] = [];
  if (carrera.magia) {
    const propias = (sociedad?.formulas ?? [])
      .map((id) => cat.formulas.find((f) => f.id === id))
      .filter((f) => f !== undefined);
    const maxVis = { novato: 1, curtido: 2, veterano: 4, maestro: 5 }[nivel.id];
    const otras = cat.formulas.filter((f) => f.vis <= maxVis && !propias.includes(f));
    const n = { novato: 1, curtido: 2, veterano: 4, maestro: 6 }[nivel.id];
    const elegidas = [...propias];
    while (elegidas.length < n + propias.length && otras.length)
      elegidas.push(otras.splice(Math.floor(azar() * otras.length), 1)[0]!);
    formulas = elegidas.map((f) => ({ id: f.id, nombre: f.nombre, nota: f.nota }));
  }

  // ── Nombre, edad y rasgos ──
  const grupo = cat.nomina.find((g) => g.id === pueblo.nomina);
  const nombrePila = grupo
    ? elegir(sexo === 'mujer' ? grupo.mujeres : grupo.varones, azar)
    : 'Sin nombre';
  const villa = elegir(VILLAS[p.origen.reino] ?? VILLAS['corona-de-castilla']!, azar);
  const gancho =
    sociedad?.ganchos.length && azar() < 0.6
      ? elegir(sociedad.ganchos, azar)
      : elegir(GANCHOS, azar);
  const secreto = sociedad
    ? `Es ${sociedad.rol} en secreto (${sociedad.nombre}). Además: ${elegir(SECRETOS, azar).toLowerCase()}.`
    : elegir(SECRETOS, azar);

  return {
    nombre: `${nombrePila} de ${villa}`,
    sexo,
    edad: tirar(nivel.edad, azar).total,
    arquetipo: sociedad ? `${arq.nombre} · ${sociedad.rol}` : arq.nombre,
    nivel: nivel.nombre,
    reino: cat.reinos.find((r) => r.id === p.origen.reino)?.nombre ?? '',
    pueblo: pueblo.nombre,
    credo: credo?.nombre.replace('Credo ', '') ?? '',
    cultura: cat.culturas.find((c) => c.id === p.origen.cultura)?.nombre ?? '',
    clase: clase?.clase ?? '',
    carrera: { id: carrera.id, nombre: carrera.nombre, nota: carrera.nota },
    caracteristicas: valores,
    atributos,
    habilidades,
    estilo,
    pasiones,
    formulas,
    equipo: arq.equipo,
    armadura: arq.armadura,
    aspecto: elegir(ASPECTO, azar),
    personalidad: elegir(PERSONALIDAD, azar),
    motivacion: elegir(MOTIVACION, azar),
    actitud: arq.actitud ?? 'neutral',
    secreto,
    gancho,
    sociedad: sociedad
      ? { id: sociedad.id, nombre: sociedad.nombre, nota: sociedad.nota, rol: sociedad.rol }
      : undefined,
    avisos,
  };
}

/** PNJ en Markdown con «99 - Plantillas/Plantilla - PNJ»; el secreto va en el callout [!secreto]- plegado. */
export function exportarPNJ(x: PNJ, partida = ''): string {
  const c = x.caracteristicas;
  const yaml = (t: string) => `"${t.replace(/"/g, '\\"')}"`;
  const hab = x.habilidades.map((h) => `${h.nombre} ${h.valor}%`).join(', ');
  return [
    '---',
    'tipo: "pnj"',
    `partida: ${partida ? yaml(`[[${partida}]]`) : '"[[]]"'}`,
    `rol: ${yaml(x.arquetipo.split(' · ')[0]!)}`,
    'lugar: ""',
    `actitud: ${yaml(x.actitud)}`,
    `reino: ${yaml(x.reino)}`,
    `credo: ${yaml(x.credo)}`,
    `clase_social: ${yaml(x.clase)}`,
    'estado: "vivo"',
    'tags:',
    '  - pnj',
    '---',
    '',
    `# ${x.nombre}`,
    '',
    `- **Rol:** ${x.arquetipo.split(' · ')[0]} (${x.nivel.toLowerCase()})  ·  **Dónde se le encuentra:** `,
    `- **Clase social:** ${x.clase}  ·  **Credo:** ${x.credo}  ·  **Carrera:** [[${x.carrera.nota}]]`,
    `- **Origen:** ${x.pueblo} (${x.reino}), ${x.cultura.toLowerCase()} · ${x.sexo === 'mujer' ? 'mujer' : 'varón'} de ${x.edad} años`,
    `- **Aspecto:** ${x.aspecto}. ${x.personalidad}.`,
    `- **Actitud hacia los PJ:** ${x.actitud}`,
    `- **Lo que quiere:** ${x.motivacion}`,
    '',
    '## Estadísticas rápidas',
    '| FUE | CON | TAM | DES | INT | POD | CAR | PA | MD | Iniciativa |',
    '| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |',
    `| ${CARACTERISTICAS.map((k) => c[k]).join(' | ')} | ${x.atributos.puntosAccion} | ${x.atributos.modDano} | ${x.atributos.iniciativa} |`,
    '',
    `- **Habilidades clave:** ${hab}`,
    `- **Estilo de combate:** ${x.estilo ? `${x.estilo.nombre} ${x.estilo.valor}% *(${x.estilo.armas.join(', ')}; ${x.estilo.rasgos.join(', ')})*` : '—'}`,
    `- **Armadura:** ${x.armadura}`,
    `- **Equipo:** ${x.equipo}`,
    `- **Pasiones:** ${x.pasiones.map((p) => `${p.nombre} ${p.valor}%`).join(', ')}`,
    ...(x.formulas.length
      ? [`- **Fórmulas:** ${x.formulas.map((f) => `[[${f.nota}]]`).join(', ')}`]
      : []),
    `- **PG:** cabeza ${x.atributos.pg.cabeza}, pecho ${x.atributos.pg.pecho}, abdomen ${x.atributos.pg.abdomen}, brazos ${x.atributos.pg['brazo-der']}, piernas ${x.atributos.pg['pierna-der']}`,
    '',
    '> [!secreto]- Secretos (sólo DJ)',
    `> ${x.secreto}`,
    ...(x.sociedad ? [`> Sociedad: [[${x.sociedad.nota}]]`] : []),
    `> **Gancho:** ${x.gancho}`,
    '',
  ].join('\n');
}
