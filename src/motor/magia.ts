// Magia Caótica (fuentes: «Fórmulas, vis y rangos», «Grimorios y aprendizaje de fórmulas»,
// «Naturaleza y origen de los hechizos» y la Guía de Magia Caótica). La magia común del SRD no se usa.
import type { Catalogo } from '../datos/catalogo';
import type { Formula, Manipulacion } from '../datos/tipos';
import { valorDe, valorEspecialidad, type ValorHabilidad } from './habilidades';
import type { Personaje } from './personaje';
import { aviso, error, type Problema } from './resultado';
import { buscarUmbral } from './tablas';

/** Umbral de estudio de la Fuente para lanzar una fórmula de cada Rango. */
const ORDEN_RANGOS = ['I', 'II', 'III', 'IV', 'V'];

export const UMBRAL_RANGO = { I: 1, II: 21, III: 41, IV: 61, V: 81 } as const;

/** Conocimiento (Ocultismo) mínimo para empezar con fórmulas. */
export const OCULTISMO_MINIMO = 30;

export interface EstadoMagia {
  ocultismo: number;
  /** Fórmulas iniciales fijas (o la tirada, si se eligió al azar). */
  formulasPermitidas: number;
  formulasAzar?: string;
  fuentes: {
    clave: string;
    nombre: string;
    dominios: string[];
    valor: number;
    grimorio?: string;
    manipulacion?: Partial<Record<Manipulacion, number>>;
    /** Rango más alto que permite lanzar la Fuente (los grimorios lo indican; si no, el V). */
    rangoMaximo: Formula['rango'];
  }[];
  formulas: Formula[];
  conoceGoecia: boolean;
}

export function estadoMagia(
  p: Personaje,
  cat: Catalogo,
  hoja: readonly ValorHabilidad[],
): EstadoMagia {
  const ocultismo = valorEspecialidad(hoja, 'conocimiento', 'Ocultismo');
  let formulasPermitidas = 0;
  let formulasAzar: string | undefined;
  if (ocultismo >= OCULTISMO_MINIMO) {
    formulasPermitidas = Number(buscarUmbral(cat.reglas.formulas_iniciales, ocultismo));
    formulasAzar = cat.reglas.formulas_iniciales.find(
      (f) => f.clave === undefined && ocultismo >= (f.min ?? 0) && ocultismo <= (f.max ?? Infinity),
    )?.azar;
  }
  const fuentes = p.magia.fuentes.map((f) => {
    const g = f.grimorio ? cat.grimorios.find((x) => x.id === f.grimorio) : undefined;
    return {
      clave: f.clave,
      nombre: g?.nombre ?? f.nombre,
      dominios: g?.dominios ?? f.dominios,
      valor: valorDe(hoja, f.clave),
      grimorio: f.grimorio,
      manipulacion: g?.manipulacion ?? f.manipulacion,
      rangoMaximo: g?.rango_maximo ?? ('V' as const),
    };
  });
  const formulas = [...p.magia.formulas, ...(p.magia.formulasAprendidas ?? [])]
    .map((id) => cat.formulas.find((x) => x.id === id))
    .filter((x): x is Formula => Boolean(x));
  return {
    ocultismo,
    formulasPermitidas,
    formulasAzar,
    fuentes,
    formulas,
    conoceGoecia: formulas.some((f) => f.goecia),
  };
}

/** Fuentes del personaje que permiten lanzar la fórmula (todos sus dominios y estudio suficiente). */
export function fuentesPara(f: Formula, estado: EstadoMagia) {
  return estado.fuentes.filter(
    (s) =>
      f.dominios.every((d) => s.dominios.includes(d)) &&
      s.valor >= UMBRAL_RANGO[f.rango] &&
      ORDEN_RANGOS.indexOf(f.rango) <= ORDEN_RANGOS.indexOf(s.rangoMaximo),
  );
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
    const valor = estado.fuentes.find((s) => s.clave === f.clave)?.valor ?? 0;
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
          `«${f.nombre}» es goecia: usarla condena el alma (Malditos por Dios) y la primera vez da 1 punto de Corrupción.`,
        ),
      );
    }
  }
  if (p.magia.fuentes.length === 0) {
    res.push(
      aviso(
        'magia',
        'sin-fuente',
        `${carrera.nombre}: sin una Fuente Mística no podrá lanzar fórmulas.`,
      ),
    );
  }
  return res;
}
