// Magia Caótica (fuentes: «Magia espontánea», «Fuentes Místicas de los reinos», «Fórmulas, vis y rangos»,
// «Grimorios y aprendizaje de fórmulas», «Naturaleza y origen de los hechizos» y la Guía de Magia Caótica).
// La magia común del SRD no se usa.
import type { Catalogo } from '../datos/catalogo';
import type { Formula, Grimorio, Manipulacion, OrigenFuente, TipoFuente } from '../datos/tipos';
import { valorDe, valorEspecialidad, type ValorHabilidad } from './habilidades';
import type { FuenteMistica, Personaje } from './personaje';
import { caracteristicasActuales } from './personaje';
import { aviso, error, type Problema } from './resultado';
import { buscarUmbral } from './tablas';

/** Umbral de estudio de la Fuente para lanzar una fórmula de cada Rango. */
const ORDEN_RANGOS = ['I', 'II', 'III', 'IV', 'V'] as const;
type Rango = (typeof ORDEN_RANGOS)[number];

export const UMBRAL_RANGO = { I: 1, II: 21, III: 41, IV: 61, V: 81 } as const;

/** Conocimiento (Ocultismo) mínimo para empezar con fórmulas. */
export const OCULTISMO_MINIMO = 30;

export const TIPOS_FUENTE: { id: TipoFuente; nombre: string; detalle: string }[] = [
  { id: 'mixta', nombre: 'Mixta', detalle: 'teoría y recetas: improvisa y lanza fórmulas' },
  {
    id: 'filosofica',
    nombre: 'Filosófica',
    detalle: 'un sistema del mundo: improvisa, sin recetas',
  },
  { id: 'recetario', nombre: 'Recetario', detalle: 'sólo recetas: lanza fórmulas, no improvisa' },
];

export const ORIGENES_FUENTE: { id: OrigenFuente; nombre: string }[] = [
  { id: 'grimorio', nombre: 'Grimorio o tratado' },
  { id: 'maestro', nombre: 'Maestro o tradición oral' },
  { id: 'pacto', nombre: 'Pacto con una entidad' },
  { id: 'lugar', nombre: 'Objeto o lugar' },
  { id: 'linaje', nombre: 'Linaje o don' },
];

/** Grimorios que cambiaron de id: el personaje guardado se lleva al nuevo al cargarlo. */
export const GRIMORIOS_RENOMBRADOS: Record<string, string> = {
  'de-feits-lo-diable': 'de-feits-de-l-angel',
};

/** Rango más alto que alcanza un % (0 si no llega al I). */
export function rangoDe(valor: number): Rango | undefined {
  return [...ORDEN_RANGOS].reverse().find((r) => valor >= UMBRAL_RANGO[r]);
}

/** Número de Rangos alcanzados con un % (con 45%, tres: I, II y III). */
export function rangosAlcanzados(valor: number): number {
  const r = rangoDe(valor);
  return r ? ORDEN_RANGOS.indexOf(r) + 1 : 0;
}

/** ¿Es goética esta Fuente? (grimorio del catálogo, con su versión, o lo que diga una Fuente propia). */
export function fuenteEsGoetica(f: FuenteMistica, g?: Grimorio): boolean {
  if (!g) return Boolean(f.goetica);
  return g.fuente_goetica || (Boolean(g.variante_goetica) && Boolean(f.versionGoetica));
}

export interface FuenteEstado {
  clave: string;
  nombre: string;
  dominios: string[];
  valor: number;
  grimorio?: string;
  manipulacion?: Partial<Record<Manipulacion, number>>;
  /** Rango más alto que permite lanzar la Fuente (los grimorios lo indican; si no, el V). */
  rangoMaximo: Formula['rango'];
  origen: OrigenFuente;
  tipo: TipoFuente;
  goetica: boolean;
  /** Si permite la magia espontánea (filosófica o mixta). */
  improvisa: boolean;
  /** Techo de la magia espontánea: el menor entre el estudio y el Ocultismo (la Fuerza de voluntad en un linaje). */
  techo: number;
  /** De dónde sale el techo. */
  techoPor: 'Ocultismo' | 'Fuerza de voluntad';
}

export interface EstadoMagia {
  ocultismo: number;
  fuerzaVoluntad: number;
  /** Fórmulas iniciales fijas (o la tirada, si se eligió al azar). */
  formulasPermitidas: number;
  formulasAzar?: string;
  fuentes: FuenteEstado[];
  formulas: Formula[];
  conoceGoecia: boolean;
  /** Tiradas de Fuerza de voluntad contra la Corrupción al crear el personaje. */
  tiradasCorrupcion: { motivo: string; tiradas: number }[];
}

export function estadoMagia(
  p: Personaje,
  cat: Catalogo,
  hoja: readonly ValorHabilidad[],
): EstadoMagia {
  const ocultismo = valorEspecialidad(hoja, 'conocimiento', 'Ocultismo');
  const fuerzaVoluntad = valorDe(hoja, 'fuerza-de-voluntad');
  let formulasPermitidas = 0;
  let formulasAzar: string | undefined;
  if (ocultismo >= OCULTISMO_MINIMO) {
    formulasPermitidas = Number(buscarUmbral(cat.reglas.formulas_iniciales, ocultismo));
    formulasAzar = cat.reglas.formulas_iniciales.find(
      (f) => f.clave === undefined && ocultismo >= (f.min ?? 0) && ocultismo <= (f.max ?? Infinity),
    )?.azar;
  }
  const fuentes = p.magia.fuentes.map((f): FuenteEstado => {
    const g = f.grimorio ? cat.grimorios.find((x) => x.id === f.grimorio) : undefined;
    const origen: OrigenFuente = g ? 'grimorio' : (f.origen ?? 'maestro');
    const tipo: TipoFuente =
      origen === 'linaje' ? 'filosofica' : (g?.tipo_fuente ?? f.tipo) || 'mixta';
    const valor = valorDe(hoja, f.clave);
    const techoPor = origen === 'linaje' ? 'Fuerza de voluntad' : 'Ocultismo';
    return {
      clave: f.clave,
      nombre: g?.nombre ?? f.nombre,
      dominios: g?.dominios ?? f.dominios,
      valor,
      grimorio: f.grimorio,
      manipulacion: g?.manipulacion ?? f.manipulacion,
      rangoMaximo: g?.rango_maximo ?? ('V' as const),
      origen,
      tipo,
      goetica: fuenteEsGoetica(f, g),
      improvisa: tipo !== 'recetario',
      techo: Math.min(valor, techoPor === 'Ocultismo' ? ocultismo : fuerzaVoluntad),
      techoPor,
    };
  });
  const formulas = [...p.magia.formulas, ...(p.magia.formulasAprendidas ?? [])]
    .map((id) => cat.formulas.find((x) => x.id === id))
    .filter((x): x is Formula => Boolean(x));
  const tiradasCorrupcion = [
    ...fuentes
      .filter((s) => s.goetica && rangosAlcanzados(s.valor) > 0)
      .map((s) => ({
        motivo: `${s.nombre} (fuente goética, ${s.valor}%: un Rango por tirada)`,
        tiradas: rangosAlcanzados(s.valor),
      })),
    ...p.magia.formulas
      .map((id) => cat.formulas.find((x) => x.id === id))
      .filter((f): f is Formula => Boolean(f?.goecia))
      .map((f) => ({ motivo: `${f.nombre} (fórmula de goecia)`, tiradas: 1 })),
  ];
  return {
    ocultismo,
    fuerzaVoluntad,
    formulasPermitidas,
    formulasAzar,
    fuentes,
    formulas,
    // «Malditos por Dios»: conocer goecia o estudiar una fuente goética impide obrar rituales.
    conoceGoecia: formulas.some((f) => f.goecia) || fuentes.some((s) => s.goetica && s.valor > 0),
    tiradasCorrupcion,
  };
}

/** Total de tiradas de Corrupción al crear el personaje. */
export const totalTiradasCorrupcion = (e: EstadoMagia) =>
  e.tiradasCorrupcion.reduce((s, x) => s + x.tiradas, 0);

/** Fuentes del personaje que permiten lanzar la fórmula (todos sus dominios y estudio suficiente). */
export function fuentesPara(f: Formula, estado: EstadoMagia) {
  return estado.fuentes.filter(
    (s) =>
      f.dominios.every((d) => s.dominios.includes(d)) &&
      s.valor >= UMBRAL_RANGO[f.rango] &&
      ORDEN_RANGOS.indexOf(f.rango) <= ORDEN_RANGOS.indexOf(s.rangoMaximo),
  );
}

/**
 * Aviso de Corrupción al subir el estudio de una Fuente goética: si el % alcanza un Rango nuevo,
 * toca una tirada de Fuerza de voluntad («Naturaleza y origen de los hechizos», Corrupción).
 */
export function avisoEstudioGoetico(
  p: Personaje,
  cat: Catalogo,
  clave: string,
  antes: number,
  despues: number,
): string {
  const f = p.magia.fuentes.find((x) => x.clave === clave);
  if (!f) return '';
  const g = f.grimorio ? cat.grimorios.find((x) => x.id === f.grimorio) : undefined;
  if (!fuenteEsGoetica(f, g)) return '';
  const nuevos = rangosAlcanzados(despues) - rangosAlcanzados(antes);
  if (nuevos <= 0) return '';
  return ` · fuente goética: alcanza el Rango ${rangoDe(despues)} → ${nuevos > 1 ? `${nuevos} tiradas` : 'tirada'} de Fuerza de voluntad o +1 Corrupción`;
}

export function validarMagia(p: Personaje, cat: Catalogo, estado: EstadoMagia): Problema[] {
  const res: Problema[] = [];
  const carrera = cat.carreras.find((c) => c.id === p.carrera);
  const tieneMagia = p.magia.fuentes.length > 0 || p.magia.formulas.length > 0;
  if (!carrera?.magia) {
    if (tieneMagia)
      res.push(
        error(
          'magia',
          'magia-sin-carrera',
          `${carrera?.nombre ?? 'Esta carrera'} no empieza con Fuente Mística ni fórmulas.`,
        ),
      );
    return res;
  }
  const pod = caracteristicasActuales(p).POD;
  for (const id of p.magia.formulas) {
    if (!cat.formulas.some((f) => f.id === id))
      res.push(error('magia', 'formula-desconocida', `Fórmula desconocida «${id}».`));
  }
  for (const f of p.magia.fuentes) {
    if (!f.clave.startsWith('fuente-mistica:'))
      res.push(
        error(
          'magia',
          'fuente-clave',
          `La Fuente «${f.nombre}» no está asociada a la habilidad Fuente Mística.`,
        ),
      );
    const g = f.grimorio ? cat.grimorios.find((x) => x.id === f.grimorio) : undefined;
    if (f.grimorio && !g)
      res.push(error('magia', 'grimorio-desconocido', `Grimorio desconocido «${f.grimorio}».`));
    if (g && !g.estudiable)
      res.push(
        error(
          'magia',
          'grimorio-no-estudiable',
          `${g.nombre} no puede estudiarse como Fuente Mística.`,
        ),
      );
    const s = estado.fuentes.find((x) => x.clave === f.clave);
    const valor = s?.valor ?? 0;
    if (g && valor > g.estudio_maximo) {
      res.push(
        error(
          'magia',
          'fuente-tope',
          `${g.nombre} solo permite un estudio del ${g.estudio_maximo}% (tienes ${valor}%).`,
        ),
      );
    }
    if (!g && f.dominios.length === 0)
      res.push(error('magia', 'fuente-sin-dominios', `La Fuente «${f.nombre}» no tiene dominios.`));
    if (!g && f.origen === 'linaje') {
      if (valor > pod * 3)
        res.push(
          error(
            'magia',
            'linaje-tope',
            `Un linaje tiene un Estudio Máximo de POD × 3 (${pod * 3}%); «${f.nombre}» está al ${valor}%.`,
          ),
        );
      if (f.dominios.length > 2)
        res.push(error('magia', 'linaje-dominios', `Un linaje tiene uno o dos dominios.`));
      else if (f.dominios.length === 2)
        res.push(
          aviso(
            'magia',
            'linaje-dos-dominios',
            `«${f.nombre}»: un linaje con dos dominios necesita el permiso del DJ.`,
          ),
        );
    }
    if (s?.goetica)
      res.push(
        aviso(
          'magia',
          'fuente-goetica',
          `${s.nombre} es una fuente goética: todo lo que se lance con ella es goecia y condena el alma (Malditos por Dios). Al empezar, una tirada de Fuerza de voluntad contra la Corrupción por cada Rango alcanzado.`,
        ),
      );
    if (s && !s.improvisa)
      res.push(
        aviso(
          'magia',
          'fuente-recetario',
          `${s.nombre} es un recetario: sólo sirve para lanzar fórmulas, no para improvisar.`,
        ),
      );
  }
  if (p.magia.formulas.length) {
    if (estado.ocultismo < OCULTISMO_MINIMO) {
      res.push(
        error(
          'magia',
          'ocultismo-bajo',
          `Para empezar con fórmulas hace falta Conocimiento (Ocultismo) ${OCULTISMO_MINIMO}% (tienes ${estado.ocultismo}%).`,
        ),
      );
    } else if (!p.magia.formulasAlAzar && p.magia.formulas.length > estado.formulasPermitidas) {
      res.push(
        error(
          'magia',
          'demasiadas-formulas',
          `Con Ocultismo ${estado.ocultismo}% empieza con ${estado.formulasPermitidas} fórmulas (o ${estado.formulasAzar} al azar); has elegido ${p.magia.formulas.length}.`,
        ),
      );
    } else if (p.magia.formulasAlAzar) {
      res.push(
        aviso(
          'magia',
          'formulas-azar',
          `Fórmulas al azar (${estado.formulasAzar}): el DJ debe ver la tirada.`,
        ),
      );
    }
  }
  for (const f of estado.formulas) {
    if (fuentesPara(f, estado).length === 0) {
      res.push(
        error(
          'magia',
          'formula-sin-fuente',
          `«${f.nombre}» (Rango ${f.rango}, ${f.dominios.join(' + ')}) necesita una Fuente con esos dominios y al menos ${UMBRAL_RANGO[f.rango]}% de estudio.`,
        ),
      );
    }
    if (f.vis > 4)
      res.push(
        aviso(
          'magia',
          'vis-alta',
          `«${f.nombre}» es de vis alta: conviene no pasar de vis quarta al empezar.`,
        ),
      );
    if (f.goecia) {
      res.push(
        aviso(
          'magia',
          'goecia',
          `«${f.nombre}» es goecia: usarla condena el alma (Malditos por Dios). Conocerla pide una tirada de Fuerza de voluntad contra la Corrupción.`,
        ),
      );
    }
  }
  const total = totalTiradasCorrupcion(estado);
  const inicial = p.magia.corrupcionInicial ?? 0;
  if (inicial > total)
    res.push(
      error(
        'magia',
        'corrupcion-inicial',
        `Corrupción inicial ${inicial}: sólo hay ${total} tiradas de Corrupción.`,
      ),
    );
  if (p.magia.fuentes.length === 0) {
    res.push(
      aviso(
        'magia',
        'sin-fuente',
        `${carrera.nombre}: sin una Fuente Mística no podrá hacer magia.`,
      ),
    );
  }
  return res;
}
