// Exportación a Markdown con la estructura de «99 - Plantillas/Plantilla - Personaje (PJ o PNJ)».
// Solo enlaza ([[…]]) notas que existen en el vault: las de los catálogos (campo `nota`) y las fijas de
// la plantilla. El extractor/validar_md.py comprueba un archivo exportado contra el vault.
import type { Catalogo } from '../datos/catalogo';
import { CARACTERISTICAS, type Arma } from '../datos/tipos';
import { LOCALIZACIONES } from '../motor/atributos';
import { armaduraPorLocalizacion } from '../motor/equipo';
import { normal, type ValorHabilidad } from '../motor/habilidades';
import { calcularHoja, type Hoja } from '../motor/hoja';
import { BONO_PASION } from '../motor/pasiones';
import {
  CAMPAÑA_POR_DEFECTO,
  caracteristicasActuales,
  type Campaña,
  type Personaje,
} from '../motor/personaje';
import { claseSocial } from '../motor/origen';

/** Enlace de Obsidian, con alias si difiere del título. */
export function enlace(nota: string, alias?: string, ancla?: string): string {
  const destino = ancla ? `${nota}#${ancla}` : nota;
  return alias && alias !== nota ? `[[${destino}|${alias}]]` : `[[${destino}]]`;
}

/** Igual que `enlace`, pero dentro de una celda de tabla (la barra del alias se escapa). */
const enlaceCelda = (nota: string, alias?: string, ancla?: string) =>
  enlace(nota, alias, ancla).replace('|', '\\|');

/** Texto seguro para una celda de tabla. */
const celda = (t: string | number | undefined | null) =>
  String(t ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n+/g, ' ');

const formula = (f: string) => f.replace(/\s+/g, '');

/** Orden de la plantilla: dos columnas de habilidades estándar. */
const ESTANDAR_IZQ = [
  'atletismo',
  'cantar',
  'combate-sin-armas',
  'conducir',
  'costumbres',
  'danza',
  'engano',
  'entorno',
  'esquivar',
  'fuerza-de-voluntad',
  'resistencia',
];
const ESTANDAR_DER = [
  'influencia',
  'lengua-materna',
  'montar',
  'musculatura',
  'nadar',
  'navegacion-fluvial',
  'ocultar',
  'percepcion',
  'perspicacia',
  'primeros-auxilios',
  'sigilo',
];

/** Orden de la plantilla para las localizaciones (de 1–3 a 19–20). */
const ORDEN_LOC = [
  'pierna-der',
  'pierna-izq',
  'abdomen',
  'pecho',
  'brazo-der',
  'brazo-izq',
  'cabeza',
];

const CARRERAS_SOLDADO = [
  'guerrero',
  'almogavar',
  'pardo',
  'caballero-de-orden-militar',
  'ghazi',
  'infanzon',
];

function condicionArmas(p: Personaje, cat: Catalogo): string {
  const e = claseSocial(p, cat)?.estamento;
  if (e === 'baja-nobleza' || e === 'alta-nobleza') return 'noble';
  if (CARRERAS_SOLDADO.includes(p.carrera)) return 'soldado';
  return 'villano';
}

function filaEstandar(h: ValorHabilidad | undefined): string[] {
  if (!h) return ['', '', '', '', '', ''];
  const d = h.desglose;
  const bono = (d.adicional ?? 0) + (d.piramide ?? 0) + (d.experiencia ?? 0) + (d.origen ?? 0);
  return [
    `${enlace(h.habilidad.nota)} (\`${formula(h.habilidad.formula)}\`)`,
    String(h.base),
    d.cultura ? String(d.cultura) : '',
    d.carrera ? String(d.carrera) : '',
    bono ? String(bono) : '',
    `**${h.total}%**`,
  ];
}

/** Estilo de combate con más % que incluye el arma (por nombre), para la tabla de armas. */
function habilidadArma(arma: Arma, hoja: Hoja, cat: Catalogo): number | undefined {
  const nombre = normal(arma.nombre);
  let mejor: number | undefined;
  for (const h of hoja.habilidades) {
    if (h.habilidad.id !== 'estilo-de-combate' || !h.especialidad) continue;
    const estilo = cat.estilos.find((e) => e.id === h.especialidad);
    if (estilo?.armas.some((a) => nombre.includes(normal(a)) || normal(a).includes(nombre))) {
      mejor = Math.max(mejor ?? 0, h.total);
    }
  }
  return mejor;
}

function armasDelPersonaje(p: Personaje, cat: Catalogo): Arma[] {
  const res: Arma[] = [];
  for (const e of p.equipo) {
    const [tipo, id] = e.id.split(':');
    const lista =
      tipo === 'arma'
        ? cat.armas.cuerpo_a_cuerpo
        : tipo === 'distancia'
          ? cat.armas.distancia
          : tipo === 'escudo'
            ? cat.armas.escudos
            : undefined;
    const a = lista?.find((x) => x.id === id);
    if (a) res.push(a);
  }
  return res;
}

export function exportarMarkdown(
  p: Personaje,
  cat: Catalogo,
  campaña: Campaña = CAMPAÑA_POR_DEFECTO,
): string {
  const hoja = calcularHoja(p, cat, campaña);
  const a = hoja.atributos;
  const v = caracteristicasActuales(p);
  const cultura = cat.culturas.find((x) => x.id === p.origen.cultura);
  const reino = cat.reinos.find((x) => x.id === p.origen.reino);
  const pueblo = cat.pueblos.find((x) => x.id === p.origen.pueblo);
  const credo = cat.credos.find((x) => x.id === p.origen.credo);
  const carrera = cat.carreras.find((x) => x.id === p.carrera);
  const clase = claseSocial(p, cat);
  const edad = cat.reglas.edades.find((e) => e.id === p.categoriaEdad);
  const credoCorto = credo?.nombre.replace(/^Credo /, '') ?? '';
  const md: string[] = [];
  const l = (...x: string[]) => md.push(...x);

  // ---------------------------------------------------------------- frontmatter
  const yaml = (t: string | undefined) => `"${(t ?? '').replace(/"/g, '\\"')}"`;
  l(
    '---',
    'tipo: "personaje"',
    'subtipo: "pj"',
    `partida: ${yaml(p.partida)}`,
    `jugador: ${yaml(p.jugador)}`,
    `cultura: ${yaml(cultura?.nombre)}`,
    `reino: ${yaml(reino?.nombre)}`,
    `pueblo: ${yaml(pueblo?.nombre)}`,
    `credo: ${yaml(credoCorto)}`,
    `clase_social: ${yaml(clase?.clase)}`,
    `carrera: ${yaml(carrera?.nombre)}`,
    'nivel_poder: "Estándar"',
    `año: ${p.año ?? ''}`,
    'estado: "vivo"',
    'tags:',
    '  - mythras/pj',
    '---',
    '',
    `# ${p.nombre || 'Sin nombre'}`,
    '',
  );

  // ---------------------------------------------------------------- cabecera
  const sep = '  ·  ';
  l(
    `- **Concepto:** ${p.concepto}`,
    `- **Partida:** ${p.partida ? enlace(p.partida) : ''}${sep}**Jugador:** ${p.jugador ?? ''}`,
    `- **Cultura:** ${cultura ? enlace(cultura.nota) : ''}${sep}**Reino y pueblo:** ${[reino && enlace(reino.nota), pueblo && enlace(pueblo.nota)].filter(Boolean).join(', ')}${sep}**Credo:** ${credo ? enlace(credo.nota, credoCorto) : ''}`,
    `- **Clase social:** ${clase?.clase ?? ''} (${enlace('Comunidad, Familia, Clase Social y Eventos de Trasfondo', 'clase social')})${sep}**Condición de armas:** ${condicionArmas(p, cat)}`,
    `- **Carrera:** ${carrera ? enlace(carrera.nota) : ''}`,
    `- **Edad:** ${p.edad ?? ''}${edad ? ` (${edad.categoria.toLowerCase()})` : ''}${sep}**Lengua materna:** ${p.lenguaMaterna}${sep}**Nivel de poder:** Estándar`,
  );
  if (p.aspecto) l(`- **Aspecto y carácter:** ${p.aspecto.replace(/\n+/g, ' ')}`);
  l('', '---', '');

  // ---------------------------------------------------------------- 1. características
  const signo = (n: number) => (n >= 0 ? `+${n}` : String(n));
  const penal = hoja.equipo.carArmadura ? Math.ceil(hoja.equipo.carArmadura / 5) : 0;
  l(
    `## 1. Características y Atributos (${enlace('Características y Atributos')})`,
    '',
    `| ${CARACTERISTICAS.join(' | ')} |`,
    `| ${CARACTERISTICAS.map(() => ':-:').join(' | ')} |`,
    `| ${CARACTERISTICAS.map((c) => v[c]).join(' | ')} |`,
    '',
    '| Atributo | Valor | Cálculo / Referencia |',
    '| :-- | :-: | :-- |',
    `| **Puntos de Acción (PA)** | \`${a.puntosAccion}\` | Estándar: 2 |`,
    `| **Modificador de Daño (MD)** | \`${a.modDano}\` | \`FUE + TAM\` = ${v.FUE + v.TAM} |`,
    `| **Modificador de Experiencia** | \`${signo(a.modExperiencia)}\` | Basado en \`CAR\` |`,
    `| **Tasa de Curación** | \`${a.curacion}\` | Basado en \`CON\` |`,
    `| **Modificador de Iniciativa** | \`${signo(a.iniciativa - penal)}\` | \`(DES + INT) / 2\` (redondeando arriba)${penal ? `, −${penal} por la armadura` : ''} |`,
    `| **${enlace('Puntos de Suerte')}** | \`${a.suerte} / ${a.suerte}\` | Basado en \`POD\` |`,
    `| **Puntos de Magia / Poder** | \`${a.puntosMagia} / ${a.puntosMagia}\` | Igual a \`POD\` |`,
    `| **Tasa de Movimiento** | \`${a.movimiento} m\` | Caminar \`${a.movimiento}m\` · Correr \`${a.movimiento * 3}m\` (x3) · Sprint \`${a.movimiento * 5}m\` (x5) |`,
    `| **Nivel de ${enlace('Fatiga')}** | \`Fresco\` | *Fresco → Agitado → Cansado → Fatigado → Exhausto...* |`,
    '',
    '---',
    '',
  );

  // ---------------------------------------------------------------- 2. localizaciones
  const pa = armaduraPorLocalizacion(hoja.equipo);
  const piezas = (loc: string) =>
    hoja.equipo.objetos
      .filter((o) => o.puesto && o.cubre?.includes(loc))
      .map((o) => o.nombre)
      .join(', ');
  l(
    `## 2. Ubicaciones de Impacto y Armadura (${enlace('Ubicaciones de Impacto')})`,
    '',
    '| 1d20 | Ubicación | Armadura Equipada | PA | PG Actual / Máx. | Heridas / Notas |',
    '| :-: | :-- | :-- | :-: | :-: | :-- |',
  );
  for (const id of ORDEN_LOC) {
    const loc = LOCALIZACIONES.find((x) => x.id === id)!;
    const pg = a.pg[loc.id];
    l(
      `| **${loc.d20[0]}–${loc.d20[1]}** | ${loc.nombre.replace(/ (\w)/, (_, c: string) => ` ${c.toUpperCase()}`)} | ${celda(piezas(id))} | ${pa[id] ?? 0} | ${pg} / ${pg} | |`,
    );
  }
  l('', '---', '');

  // ---------------------------------------------------------------- 3. estándar
  const por = (id: string) => hoja.habilidades.find((h) => h.clave === id);
  l(
    `## 3. Habilidades Estándar (${enlace('02 - Habilidades (Índice)')})`,
    '',
    '| Habilidad | Base | Cultura | Carrera | Bono | **Total %** | Habilidad | Base | Cultura | Carrera | Bono | **Total %** |',
    '| :-- | :-: | :-: | :-: | :-: | :-: | :-- | :-: | :-: | :-: | :-: | :-: |',
  );
  for (let i = 0; i < ESTANDAR_IZQ.length; i++) {
    l(
      `| ${[...filaEstandar(por(ESTANDAR_IZQ[i]!)), ...filaEstandar(por(ESTANDAR_DER[i]!))].join(' | ')} |`,
    );
  }
  l('', '---', '');

  // ---------------------------------------------------------------- 4. profesionales y estilos
  l(
    `## 4. Habilidades Profesionales y ${enlace('Estilos de Combate')}`,
    '',
    '| Habilidad Profesional / Estilo | Fórmula Base | Armas / Especialidad / Rasgo de Estilo | **Total %** |',
    '| :-- | :-: | :-- | :-: |',
  );
  const estilos = hoja.habilidades.filter((h) => h.habilidad.id === 'estilo-de-combate');
  for (const h of estilos) {
    const e = cat.estilos.find((x) => x.id === h.especialidad);
    l(
      `| ${enlace('Estilo de combate')}: ${celda(e?.nombre ?? h.especialidad)} | \`${formula(h.habilidad.formula)}\` | *Armas:* ${celda(e?.armas.join(', '))} <br>*Rasgo:* ${celda(e?.rasgos.join(e.rasgos_alternativos ? ' o ' : ', '))} | **${h.total}%** |`,
    );
  }
  if (!estilos.length)
    l(`| ${enlace('Estilo de combate')}: | \`FUE+DES\` | *Armas:* <br>*Rasgo:* | **%** |`);
  const profesionales = hoja.habilidades.filter((h) => h.habilidad.tipo === 'profesional');
  for (const h of profesionales) {
    const nombre =
      h.habilidad.id === 'fuente-mistica'
        ? enlaceCelda(h.habilidad.nota, 'Fuente Mística', h.habilidad.ancla)
        : enlaceCelda(h.habilidad.nota);
    l(
      `| ${nombre} | \`${formula(h.habilidad.formula)}\` | ${celda(h.especialidad ?? '')} | **${h.total}%** |`,
    );
  }
  l('', '---', '');

  // ---------------------------------------------------------------- 5. armas
  l(
    `## 5. Armas y Ataques (${enlace('Armas, Armaduras y Escudos de los Reinos Hispánicos')})`,
    '',
    '| Arma | Habilidad % | Daño (+MD) | TAM / Potencia | Alcance | Recarga | PA / PG | Efectos Especiales / Notas |',
    '| :-- | :-: | :-: | :-: | :-: | :-: | :-: | :-- |',
  );
  const armas = armasDelPersonaje(p, cat);
  for (const w of armas) {
    const pct = habilidadArma(w, hoja, cat);
    const suma = w.suma_md !== false && a.modDano !== '+0';
    const dano = `${w.dano}${suma ? ` ${a.modDano}` : ''}`;
    l(
      `| ${celda(w.nombre)} | ${pct ? `${pct}%` : ''} | \`${dano}\` | ${celda(w.tam ?? w.potencia)} | ${celda(w.alcance)} | ${celda(w.recarga)} | ${w.pa ?? ''}/${w.pg ?? ''} | ${w.efectos.map((x) => enlaceCelda(x)).join(', ')} |`,
    );
  }
  if (!armas.length) l('| | | | | | | | |');
  l('', '---', '');

  // ---------------------------------------------------------------- 6. pasiones, fe, magia, equipo
  l(
    `## 6. ${enlace('Pasiones y Equipo Inicial', 'Pasiones')}, Poderes y Equipo`,
    '',
    '### Pasiones',
  );
  const pasiones = [...p.pasiones]
    .map((x, i) => ({ x, valor: hoja.pasiones[i]?.valor }))
    .sort((m, n) => m.x.orden - n.x.orden);
  pasiones.forEach(({ x, valor }, i) =>
    l(
      `${i + 1}. **Pasión ${x.orden} (+${BONO_PASION[x.orden]}%):** \`${x.nombre}\` — **${valor ?? '?'}%**`,
    ),
  );
  if (!pasiones.length) l('1. **Pasión 1 (+40%):** `` — **%**');

  l('', `### Fe, Magia y Milagros (${enlace('05 - Magia y Fe (Índice)')})`);
  const fe = hoja.fe;
  const textoFe = !hoja.pasiones.some((x) => x.fe)
    ? ''
    : `${enlace('Fe')} ${fe.fe}%${fe.puedeObrar ? ` · ${fe.pf} PF · ${fe.ordoMaximo ? `conoce los ${enlace('Rituales de fe', 'rituales')} hasta el ${cat.rituales.find((r) => r.ordo === fe.ordoMaximo)?.ordo_nombre}: ${fe.rituales.map((r) => enlace(r.nota)).join(', ')}` : 'aún no conoce ningún ordo'}` : ''}`;
  l(`- **Fe:** ${textoFe}`);
  const m = hoja.magia;
  const textoMagia = [
    m.fuentes
      .map((f) => `Fuente Mística ${f.nombre} ${f.valor}% (${f.dominios.join(', ')})`)
      .join('; '),
    m.formulas.length ? `fórmulas: ${m.formulas.map((f) => enlace(f.nota)).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  l(`- **Magia:** ${textoMagia}`);

  l('', '### Equipo y Posesiones');
  for (const o of hoja.equipo.objetos)
    l(`- ${o.cantidad > 1 ? `${o.cantidad} × ` : ''}${o.nombre}${o.puesto ? ' (puesto)' : ''}`);
  const inicial = clase
    ? cat.trasfondo.equipo_inicial.find((e) => e.estamentos.includes(clase.estamento))
    : undefined;
  if (inicial)
    l(`- *Propio de su estamento:* ${inicial.ropa} ${inicial.armas} ${inicial.transporte}`);
  if (!hoja.equipo.objetos.length && !inicial) l('-');
  l(`- **Dinero:** ${hoja.equipo.restante ?? ''} mrs`, '', '---', '');

  // ---------------------------------------------------------------- 7. mente
  l(
    `## 7. Mente y Horror (${enlace('Informe de Integración - Horror, Estrés y Pánico', 'Horror, Estrés y Pánico')})`,
    `- **Puntos de Estrés:** ${hoja.estres} / *(umbral según el informe)*`,
    '- **Cicatrices mentales:** ',
    `- **Corrupción:** ${hoja.corrupcion}`,
    '',
    '---',
    '',
  );

  // ---------------------------------------------------------------- 8. trasfondo
  const t = p.trasfondo;
  const unir = (...x: (string | undefined)[]) => x.filter(Boolean).join(' · ');
  l(
    '## 8. Trasfondo',
    `- **Familia:** ${unir(t.padres?.texto, t.hermanos?.texto, t.familia_extendida?.texto)}`,
    `- **Aliados y contactos:** ${unir(t.reputacion && `Reputación: ${t.reputacion.texto}`, t.conexiones && `Conexiones: ${t.conexiones.texto}`)}`,
    '- **Rivales y enemigos:** ',
    `- **Evento de trasfondo:** ${(t.eventos ?? []).map((e) => e.texto).join(' / ')}`,
  );
  if (p.notas) l(`- **Notas:** ${p.notas.replace(/\n+/g, ' ')}`);
  l('', '> [!secreto]- Secretos del personaje (sólo DJ y jugador)', '>', '');
  return md.join('\n');
}
