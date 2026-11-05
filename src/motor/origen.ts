// Origen (cultura, reino, pueblo, credo), clase social y carrera: restricciones de la ambientación
// (fuentes: notas de «Orígenes», «Comunidad, Familia, Clase Social…» y «Profesiones de Aquelarre»).
import type { Catalogo } from '../datos/catalogo';
import type { Carrera, ClaseSocial, Pueblo } from '../datos/tipos';
import { tirar, type Aleatorio } from './dados';
import type { Campaña, Personaje } from './personaje';
import { aviso, error, type Problema } from './resultado';

/** Tabla de clases que corresponde: la del credo si tiene propia (judíos; musulmanes granadinos), si no la de la cultura. */
export function tablaClases(p: Personaje, cat: Catalogo): { origen: string; tabla: ClaseSocial[] } {
  const credo = cat.credos.find((c) => c.id === p.origen.credo);
  const propia = credo && cat.trasfondo.clases_credo[credo.id];
  const aplica = credo?.clases_condicion
    ? credo.clases_condicion.pueblos.includes(p.origen.pueblo)
    : true;
  if (credo && propia && aplica) return { origen: credo.nombre, tabla: propia };
  return { origen: p.origen.cultura, tabla: cat.trasfondo.clases[p.origen.cultura] ?? [] };
}

export function claseSocial(p: Personaje, cat: Catalogo): ClaseSocial | undefined {
  return tablaClases(p, cat).tabla.find((c) => c.id === p.origen.clase);
}

export function tirarClase(
  p: Personaje,
  cat: Catalogo,
  azar?: Aleatorio,
): { tirada: number; clase: ClaseSocial | undefined } {
  const t = tirar('1d100', azar).total;
  return { tirada: t, clase: tablaClases(p, cat).tabla.find((c) => t >= c.min && t <= c.max) };
}

export function validarOrigen(p: Personaje, cat: Catalogo, campaña: Campaña): Problema[] {
  const res: Problema[] = [];
  const o = p.origen;
  const cultura = cat.culturas.find((c) => c.id === o.cultura);
  const pueblo = cat.pueblos.find((x) => x.id === o.pueblo);
  const reino = cat.reinos.find((r) => r.id === o.reino);
  const credo = cat.credos.find((c) => c.id === o.credo);
  if (!cultura) res.push(error('origen', 'sin-cultura', 'Elige la cultura.'));
  if (!pueblo) res.push(error('origen', 'sin-pueblo', 'Elige el pueblo.'));
  if (!reino) res.push(error('origen', 'sin-reino', 'Elige el reino.'));
  if (!credo) res.push(error('origen', 'sin-credo', 'Elige el credo.'));
  if (!cultura || !pueblo || !reino || !credo) return res;

  if (!pueblo.reinos.includes(reino.nombre)) {
    res.push(
      error(
        'origen',
        'reino-pueblo',
        `Los ${pueblo.nombre.toLowerCase()} no viven en ${reino.nombre} (sí en ${pueblo.reinos.join(', ')}).`,
      ),
    );
  }
  if (pueblo.credo !== credo.id) {
    res.push(
      aviso(
        'origen',
        'credo-pueblo',
        `Los ${pueblo.nombre.toLowerCase()} son de credo ${cat.credos.find((c) => c.id === pueblo.credo)?.nombre ?? pueblo.credo}: ¿es un converso? Consúltalo con el DJ.`,
      ),
    );
  }
  if (!pueblo.culturas_habituales.includes(cultura.id)) {
    res.push(
      aviso(
        'origen',
        'cultura-rara',
        `Cultura poco habitual para los ${pueblo.nombre.toLowerCase()}: ${pueblo.culturas_texto}.`,
      ),
    );
  }
  if (pueblo.raro)
    res.push(
      aviso(
        'origen',
        'pueblo-raro',
        `Los ${pueblo.nombre.toLowerCase()} son raros en el siglo XIV: consúltalo con el DJ.`,
      ),
    );
  if (!p.lenguaMaterna.trim())
    res.push(error('origen', 'sin-lengua', `Indica la lengua materna (${pueblo.lengua_materna}).`));

  // Clase social
  const { tabla, origen } = tablaClases(p, cat);
  const clase = tabla.find((c) => c.id === o.clase);
  if (!clase) {
    res.push(
      error('trasfondo', 'sin-clase', `Elige o tira la clase social en la tabla de ${origen}.`),
    );
  } else {
    const req = pueblo.requisitos;
    if (req.estamentos_prohibidos?.includes(clase.estamento)) {
      res.push(error('trasfondo', 'clase-prohibida', `${pueblo.nombre}: ${pueblo.restricciones}`));
    }
    const hidalguia = req.opcion_campaña === 'hidalguia_vasca' && campaña.hidalguiaVasca;
    if (
      req.estamentos_permitidos &&
      !hidalguia &&
      !req.estamentos_permitidos.includes(clase.estamento)
    ) {
      res.push(
        error('trasfondo', 'clase-no-permitida', `${pueblo.nombre}: ${pueblo.restricciones}`),
      );
    }
    if (o.tiradaClase !== undefined && (o.tiradaClase < clase.min || o.tiradaClase > clase.max)) {
      res.push(
        error(
          'trasfondo',
          'clase-tirada',
          `La clase «${clase.clase}» no corresponde a la tirada ${o.tiradaClase}.`,
        ),
      );
    }
  }
  return res;
}

function nombrePueblo(p: Pueblo) {
  return p.nombre.toLowerCase();
}

export function validarCarrera(p: Personaje, cat: Catalogo, campaña: Campaña): Problema[] {
  const res: Problema[] = [];
  const carrera = cat.carreras.find((c) => c.id === p.carrera);
  if (!carrera) return [error('carrera', 'sin-carrera', 'Elige la carrera.')];
  const pueblo = cat.pueblos.find((x) => x.id === p.origen.pueblo);
  const reino = cat.reinos.find((r) => r.id === p.origen.reino);
  const clase = claseSocial(p, cat);
  const req = carrera.requisitos;
  const quien = carrera.restriccion || carrera.nombre;

  if (req.credos && !req.credos.includes(p.origen.credo)) {
    res.push(error('carrera', 'carrera-credo', `${carrera.nombre}: ${quien}.`));
  }
  if (req.sexo && p.sexo && p.sexo !== req.sexo) {
    const m = `${carrera.nombre}: ${quien} (restricción de sexo opcional, se acuerda en la Sesión 0).`;
    res.push(
      campaña.restriccionesSexo
        ? error('carrera', 'carrera-sexo', m)
        : aviso('carrera', 'carrera-sexo', m),
    );
  }
  if (req.estamentos && clase && !req.estamentos.includes(clase.estamento)) {
    res.push(
      error(
        'carrera',
        'carrera-clase',
        `${carrera.nombre}: ${quien}; tu clase es «${clase.clase}».`,
      ),
    );
  }
  if (
    req.reinos &&
    reino &&
    !req.reinos.includes(reino.nombre) &&
    !(pueblo && req.pueblos_extra?.includes(pueblo.id))
  ) {
    res.push(error('carrera', 'carrera-reino', `${carrera.nombre}: ${quien}.`));
  }
  if (pueblo?.requisitos.carreras_prohibidas?.includes(carrera.nombre)) {
    res.push(
      error(
        'carrera',
        'carrera-pueblo',
        `Los ${nombrePueblo(pueblo)} no pueden empezar como ${carrera.nombre.toLowerCase()}: ${pueblo.restricciones}`,
      ),
    );
  }
  const avisoPueblo = pueblo?.requisitos.avisos_carrera?.[carrera.nombre];
  if (avisoPueblo) res.push(aviso('carrera', 'carrera-aviso-pueblo', avisoPueblo));
  if (carrera.magia && !campaña.permitirMagia) {
    res.push(
      error(
        'carrera',
        'carrera-magia',
        `La campaña no permite personajes con magia (${carrera.nombre}).`,
      ),
    );
  }
  if (carrera.aviso)
    res.push(aviso('carrera', 'carrera-aviso', `${carrera.nombre}: ${carrera.aviso}`));
  if (carrera.magia && p.origen.credo === 'cristiano') {
    res.push(
      aviso(
        'carrera',
        'inquisicion',
        'Un practicante de la magia en tierra cristiana se arriesga a la Inquisición.',
      ),
    );
  }
  const cultura = p.origen.cultura;
  if (
    cultura &&
    carrera.culturas_habituales.length &&
    !carrera.culturas_habituales.includes(cultura)
  ) {
    res.push(
      aviso(
        'carrera',
        'carrera-cultura',
        `${carrera.nombre} no es una carrera habitual en esa cultura.`,
      ),
    );
  }
  return res;
}

export function carrerasPermitidas(p: Personaje, cat: Catalogo, campaña: Campaña): Carrera[] {
  return cat.carreras.filter(
    (c) =>
      !validarCarrera({ ...p, carrera: c.id }, cat, campaña).some((x) => x.gravedad === 'error'),
  );
}
