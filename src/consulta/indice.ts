// Índice de consulta de reglas sobre los catálogos de jugador (sin conexión, sin dependencias).
// Cada entrada es una «ficha de lectura» con campos y enlaces cruzados a otras entradas.
import type { Catalogo } from '../datos/catalogo';
import type { ItemHabilidad } from '../datos/tipos';
import { nombreHabilidad } from '../motor/habilidades';
import { TIPOS_FUENTE } from '../motor/magia';

export type TipoEntrada =
  | 'habilidad'
  | 'cultura'
  | 'pueblo'
  | 'credo'
  | 'carrera'
  | 'estilo'
  | 'arma'
  | 'armadura'
  | 'equipo'
  | 'formula'
  | 'ritual'
  | 'grimorio';

export const TIPOS: { id: TipoEntrada; nombre: string; plural: string; magia?: boolean }[] = [
  { id: 'habilidad', nombre: 'Habilidad', plural: 'Habilidades' },
  { id: 'cultura', nombre: 'Cultura', plural: 'Culturas' },
  { id: 'pueblo', nombre: 'Pueblo', plural: 'Pueblos' },
  { id: 'credo', nombre: 'Credo', plural: 'Credos' },
  { id: 'carrera', nombre: 'Carrera', plural: 'Carreras' },
  { id: 'estilo', nombre: 'Estilo de combate', plural: 'Estilos' },
  { id: 'arma', nombre: 'Arma', plural: 'Armas' },
  { id: 'armadura', nombre: 'Armadura', plural: 'Armaduras' },
  { id: 'equipo', nombre: 'Equipo', plural: 'Equipo' },
  { id: 'formula', nombre: 'Fórmula', plural: 'Fórmulas', magia: true },
  { id: 'ritual', nombre: 'Ritual', plural: 'Rituales', magia: true },
  { id: 'grimorio', nombre: 'Grimorio', plural: 'Grimorios', magia: true },
];

export interface Ref {
  tipo: TipoEntrada;
  id: string;
  nombre: string;
}

export interface Campo {
  etiqueta: string;
  texto?: string;
  refs?: Ref[];
}

export interface EntradaConsulta {
  tipo: TipoEntrada;
  id: string;
  titulo: string;
  subtitulo: string;
  resumen: string;
  campos: Campo[];
  nota?: string;
  /** Texto normalizado para buscar (título con más peso). */
  busqueda: string;
  tituloNormal: string;
}

export const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const clave = (tipo: TipoEntrada, id: string) => `${tipo}/${id}`;

export function construirIndice(cat: Catalogo): EntradaConsulta[] {
  const res: EntradaConsulta[] = [];
  const ref = (tipo: TipoEntrada, id: string, nombre: string): Ref => ({ tipo, id, nombre });
  const refHab = (it: ItemHabilidad): Ref => ({
    tipo: 'habilidad',
    id: it.habilidad,
    nombre:
      nombreHabilidad(cat, it.habilidad) +
      (it.especialidad
        ? ` (${it.especialidad})`
        : it.cualquiera
          ? ' (cualquiera)'
          : it.aclaracion
            ? ` (${it.aclaracion})`
            : ''),
  });
  const porNombre = <T extends { id: string; nombre: string }>(
    lista: T[],
    tipo: TipoEntrada,
    ids: string[],
  ) =>
    ids.flatMap((id) => {
      const x = lista.find((y) => y.id === id);
      return x ? [ref(tipo, x.id, x.nombre)] : [];
    });
  const add = (e: Omit<EntradaConsulta, 'busqueda' | 'tituloNormal'>) => {
    const texto = [
      e.titulo,
      e.subtitulo,
      e.resumen,
      ...e.campos.map((c) => `${c.texto ?? ''} ${(c.refs ?? []).map((r) => r.nombre).join(' ')}`),
    ].join(' ');
    res.push({ ...e, busqueda: normalizar(texto), tituloNormal: normalizar(e.titulo) });
  };

  for (const h of cat.habilidades) {
    add({
      tipo: 'habilidad',
      id: h.id,
      titulo: h.nombre,
      nota: h.nota,
      subtitulo: `${h.tipo === 'estandar' ? 'Estándar' : 'Profesional'} · ${h.formula}`,
      resumen: h.resumen ?? '',
      campos: [
        { etiqueta: 'Porcentaje básico', texto: h.formula },
        ...(h.especialidades
          ? [
              {
                etiqueta: 'Especialidades',
                texto: h.ejemplos_especialidad.join(', ') || 'Una por cada especialidad',
              },
            ]
          : []),
        {
          etiqueta: 'La ofrecen las culturas',
          refs: porNombre(cat.culturas, 'cultura', h.culturas),
        },
        {
          etiqueta: 'La ofrecen las carreras',
          refs: porNombre(cat.carreras, 'carrera', h.carreras),
        },
      ],
    });
  }

  for (const c of cat.culturas) {
    add({
      tipo: 'cultura',
      id: c.id,
      titulo: c.nombre,
      nota: c.nota,
      subtitulo: 'Cultura',
      resumen: c.resumen ?? '',
      campos: [
        { etiqueta: 'Habilidades estándar', refs: c.estandar.map(refHab) },
        ...c.estandar_eleccion.map((el) => ({
          etiqueta: `Elige ${el.n === 1 ? 'una' : el.n} de`,
          refs: el.opciones.map((o) => refHab({ habilidad: o })),
        })),
        {
          etiqueta: `Profesionales (elige ${c.n_profesionales})`,
          refs: c.profesionales.map(refHab),
        },
        { etiqueta: 'Estilos de combate', refs: porNombre(cat.estilos, 'estilo', c.estilos) },
        { etiqueta: 'Dinero inicial', texto: `${c.dinero.dados} × ${c.dinero.multiplicador} mrs` },
        { etiqueta: 'Pasiones sugeridas', texto: c.pasiones_sugeridas.join(' · ') },
      ],
    });
  }

  for (const p of cat.pueblos) {
    const credo = cat.credos.find((c) => c.id === p.credo);
    add({
      tipo: 'pueblo',
      id: p.id,
      titulo: p.nombre,
      nota: p.nota,
      subtitulo: `Pueblo · ${p.reinos.join(', ')}`,
      resumen: p.resumen ?? '',
      campos: [
        { etiqueta: 'Credo', refs: credo ? [ref('credo', credo.id, credo.nombre)] : [] },
        {
          etiqueta: 'Culturas habituales',
          texto: p.culturas_texto,
          refs: porNombre(cat.culturas, 'cultura', p.culturas_habituales),
        },
        { etiqueta: 'Lengua materna', texto: p.lengua_materna },
        {
          etiqueta: 'Idiomas gratuitos',
          texto:
            p.idiomas_gratis
              .map((i) => `${i.idioma} +${i.bono}%${i.condicion ? ` (${i.condicion})` : ''}`)
              .join(', ') || '—',
        },
        { etiqueta: 'Costumbres', texto: p.costumbres },
        { etiqueta: 'Restricciones', texto: p.restricciones },
        { etiqueta: 'Estilos habituales', texto: p.estilos_habituales.join(', ') },
        { etiqueta: 'Pasiones sugeridas', texto: p.pasiones_sugeridas.join(' · ') },
      ],
    });
  }

  for (const c of cat.credos) {
    add({
      tipo: 'credo',
      id: c.id,
      titulo: c.nombre,
      nota: c.nota,
      subtitulo: `Credo · Pasión ${c.pasion_fe}`,
      resumen: c.resumen ?? '',
      campos: [
        {
          etiqueta: 'Pueblos',
          refs: cat.pueblos
            .filter((p) => p.credo === c.id)
            .map((p) => ref('pueblo', p.id, p.nombre)),
        },
        { etiqueta: 'En la creación', texto: c.notas.join(' · ') },
        {
          etiqueta: 'Carreras de este credo',
          refs: cat.carreras
            .filter((k) => k.requisitos.credos?.includes(c.id))
            .map((k) => ref('carrera', k.id, k.nombre)),
        },
      ],
    });
  }

  for (const c of cat.carreras) {
    add({
      tipo: 'carrera',
      id: c.id,
      titulo: c.nombre,
      nota: c.nota,
      subtitulo: [
        c.origen === 'aquelarre' ? 'Carrera de Aquelarre' : 'Carrera',
        c.magia && 'magia',
        c.fe && 'rituales',
      ]
        .filter(Boolean)
        .join(' · '),
      resumen: c.resumen ?? '',
      campos: [
        { etiqueta: 'Arquetipos', texto: c.arquetipos },
        ...(c.restriccion ? [{ etiqueta: 'Quién puede', texto: c.restriccion }] : []),
        { etiqueta: 'Habilidades estándar', refs: c.estandar.map(refHab) },
        {
          etiqueta: `Profesionales (hasta ${c.max_profesionales})`,
          refs: c.profesionales.map(refHab),
        },
        {
          etiqueta: 'Culturas habituales',
          refs: porNombre(cat.culturas, 'cultura', c.culturas_habituales),
        },
        ...(c.aviso ? [{ etiqueta: 'Aviso', texto: c.aviso }] : []),
      ],
    });
  }

  for (const e of cat.estilos) {
    add({
      tipo: 'estilo',
      id: e.id,
      titulo: e.nombre,
      subtitulo: `Estilo ${e.tipo}`,
      resumen: e.contexto,
      campos: [
        { etiqueta: 'Armas', texto: e.armas.join(', ') },
        { etiqueta: 'Rasgo', texto: e.rasgos.join(e.rasgos_alternativos ? ' o ' : ', ') },
        { etiqueta: 'Culturas', refs: porNombre(cat.culturas, 'cultura', e.culturas) },
      ],
    });
  }

  const a = cat.armas;
  for (const w of [...a.cuerpo_a_cuerpo, ...a.distancia, ...a.escudos]) {
    const distancia = a.distancia.includes(w);
    // Mismos prefijos que el mercado: «hacha» es cuerpo a cuerpo y también arrojadiza.
    const prefijo = distancia ? 'distancia' : a.escudos.includes(w) ? 'escudo' : 'arma';
    add({
      tipo: 'arma',
      id: `${prefijo}:${w.id}`,
      titulo: w.nombre + (w.aclaracion ? ` (${w.aclaracion})` : ''),
      subtitulo: distancia
        ? 'Arma a distancia'
        : a.escudos.includes(w)
          ? 'Escudo'
          : `Arma · ${w.grupo ?? 'cuerpo a cuerpo'}`,
      resumen: w.notas ?? '',
      campos: [
        {
          etiqueta: 'Daño',
          texto: `${w.dano}${distancia && !w.suma_md ? ' (sin Mod. de Daño)' : ''}`,
        },
        {
          etiqueta: distancia ? 'Potencia · alcance · recarga' : 'Tamaño · alcance',
          texto: distancia
            ? `${w.potencia} · ${w.alcance} m · ${w.recarga}`
            : `${w.tam} · ${w.alcance}`,
        },
        { etiqueta: 'PA / PG · CAR', texto: `${w.pa}/${w.pg} · ${w.car}` },
        { etiqueta: 'Efectos especiales', texto: w.efectos.join(', ') },
        ...(w.rasgos?.length ? [{ etiqueta: 'Rasgos', texto: w.rasgos.join(', ') }] : []),
        { etiqueta: 'Condición', texto: w.condicion.join(', ') },
        { etiqueta: 'Precio', texto: w.precio_texto },
        {
          etiqueta: 'Estilos que la incluyen',
          refs: cat.estilos
            .filter((e) =>
              e.armas.some(
                (x) =>
                  normalizar(w.nombre).includes(normalizar(x)) ||
                  normalizar(x).includes(normalizar(w.nombre)),
              ),
            )
            .map((e) => ref('estilo', e.id, e.nombre)),
        },
      ],
    });
  }

  for (const r of [...a.armaduras, ...a.cascos]) {
    add({
      tipo: 'armadura',
      id: `${a.cascos.includes(r) ? 'casco' : 'armadura'}:${r.id}`,
      titulo: r.nombre,
      subtitulo: a.cascos.includes(r) ? 'Casco' : 'Armadura',
      resumen: '',
      campos: [
        { etiqueta: 'PA', texto: String(r.pa) },
        { etiqueta: 'Cubre', texto: r.cubre.join(', ') },
        { etiqueta: 'CAR', texto: String(r.car) },
        { etiqueta: 'Precio', texto: r.precio_texto },
      ],
    });
  }

  for (const o of cat.equipo) {
    add({
      tipo: 'equipo',
      id: o.id,
      titulo: o.nombre,
      subtitulo: o.categoria,
      resumen: (o as { descripcion?: string }).descripcion ?? '',
      campos: [
        { etiqueta: 'Precio', texto: o.precio_texto },
        ...(o.car != null ? [{ etiqueta: 'CAR', texto: String(o.car) }] : []),
      ],
    });
  }

  for (const f of cat.formulas) {
    add({
      tipo: 'formula',
      id: f.id,
      titulo: f.nombre,
      nota: f.nota,
      subtitulo: `${f.forma} · vis ${f.vis} · Rango ${f.rango}${f.goecia ? ' · goecia' : ''}`,
      resumen: f.resumen ?? '',
      campos: [
        { etiqueta: 'Naturaleza y origen', texto: `${f.naturaleza} · ${f.origen}` },
        { etiqueta: 'Dominios', texto: f.dominios.join(' + ') },
        {
          etiqueta: 'Grimorios con esos dominios',
          refs: cat.grimorios
            .filter((g) => f.dominios.every((d) => g.dominios.includes(d)))
            .map((g) => ref('grimorio', g.id, g.nombre)),
        },
        ...(f.goecia
          ? [
              {
                etiqueta: 'Aviso',
                texto:
                  'Goecia: usarla condena el alma (Malditos por Dios). Aprenderla pide una tirada de Fuerza de voluntad contra la Corrupción.',
              },
            ]
          : []),
      ],
    });
  }

  for (const r of cat.rituales) {
    add({
      tipo: 'ritual',
      id: r.id,
      titulo: r.nombre,
      nota: r.nota,
      subtitulo: `${r.ordo_nombre}${r.sacramento ? ' · sacramento' : ''}${r.estado_gracia ? ' · exige estado de gracia' : ''}`,
      resumen: r.resumen ?? '',
      campos: [
        { etiqueta: 'PF requeridos', texto: String(r.pf_requeridos) },
        { etiqueta: 'Penalizador', texto: r.penalizador ? `−${r.penalizador}` : '—' },
        { etiqueta: 'Credos', refs: porNombre(cat.credos, 'credo', r.credos) },
      ],
    });
  }

  for (const g of cat.grimorios) {
    add({
      tipo: 'grimorio',
      id: g.id,
      titulo: g.nombre,
      nota: g.nota,
      subtitulo: `${g.idioma} · ${g.autor}`,
      resumen: g.resumen ?? '',
      campos: [
        { etiqueta: 'Dominios', texto: g.dominios.join(', ') },
        { etiqueta: 'Estudio máximo · Enseñar', texto: `${g.estudio_maximo}% · ${g.ensenar}%` },
        ...(g.tipo_fuente
          ? [
              {
                etiqueta: 'Tipo de fuente',
                texto:
                  TIPOS_FUENTE.find((x) => x.id === g.tipo_fuente)!.nombre +
                  ': ' +
                  TIPOS_FUENTE.find((x) => x.id === g.tipo_fuente)!.detalle,
              },
            ]
          : []),
        {
          etiqueta: '¿Goética?',
          texto: g.fuente_goetica
            ? 'Sí: todo lo que se lance con ella es goecia y estudiarla corrompe.'
            : g.variante_goetica
              ? `Sólo la ${g.variante_goetica}.`
              : 'No.',
        },
        {
          etiqueta: 'Fórmulas de sus dominios',
          refs: cat.formulas
            .filter((f) => f.dominios.every((d) => g.dominios.includes(d)))
            .map((f) => ref('formula', f.id, f.nombre)),
        },
      ],
    });
  }

  return res;
}

export function buscarEntrada(
  indice: readonly EntradaConsulta[],
  tipo: TipoEntrada,
  id: string,
): EntradaConsulta | undefined {
  return indice.find((e) => e.tipo === tipo && e.id === id);
}

/**
 * Busca por palabras (sin tildes ni mayúsculas). Todas las palabras deben aparecer (al menos como
 * prefijo de una palabra del texto). Puntúa más las que están en el título y los títulos que empiezan igual.
 */
export function buscar(
  indice: readonly EntradaConsulta[],
  consulta: string,
  tipos?: ReadonlySet<TipoEntrada>,
  limite = 60,
): EntradaConsulta[] {
  const palabras = normalizar(consulta)
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean);
  const candidatas = tipos?.size ? indice.filter((e) => tipos.has(e.tipo)) : indice;
  if (!palabras.length) return [];
  const prefijo = (texto: string, p: string) =>
    new RegExp(`(^|[^a-z0-9ñ])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(texto);
  const puntuadas: { e: EntradaConsulta; puntos: number }[] = [];
  for (const e of candidatas) {
    let puntos = 0;
    let todas = true;
    for (const p of palabras) {
      if (prefijo(e.tituloNormal, p)) puntos += 10;
      else if (prefijo(e.busqueda, p)) puntos += 1;
      else {
        todas = false;
        break;
      }
    }
    if (!todas) continue;
    if (e.tituloNormal === palabras.join(' ')) puntos += 50;
    else if (e.tituloNormal.startsWith(palabras.join(' '))) puntos += 20;
    puntuadas.push({ e, puntos });
  }
  return puntuadas
    .sort((a, b) => b.puntos - a.puntos || a.e.titulo.localeCompare(b.e.titulo, 'es'))
    .slice(0, limite)
    .map((x) => x.e);
}

export const claveEntrada = (e: { tipo: TipoEntrada; id: string }) => clave(e.tipo, e.id);
