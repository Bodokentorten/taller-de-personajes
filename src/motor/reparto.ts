// Reparto de puntos de habilidad: método estándar (Cultura 100 + Carrera 100 + adicionales por edad)
// y pirámide (fuente: «01 - Creación de Personajes (Índice)», culturas, carreras y
// «Experiencia, Pirámide de Habilidades y Niveles de Poder»).
import type { Catalogo } from '../datos/catalogo';
import type { Carrera, Cultura, ItemHabilidad } from '../datos/tipos';
import {
  calcularHabilidades,
  casa,
  especialidadSugerida,
  idiomasGratis,
  nombreHabilidad,
} from './habilidades';
import { partirClave, type Fuente, type Personaje } from './personaje';
import { aviso, error, type Problema } from './resultado';

function porFuente(p: Personaje, f: Fuente): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of p.asignaciones)
    if (a.fuente === f) m.set(a.clave, (m.get(a.clave) ?? 0) + a.puntos);
  return m;
}

const suma = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);

function tipoDe(cat: Catalogo, c: string) {
  return cat.habilidades.find((h) => h.id === partirClave(c).habilidad)?.tipo;
}

function comprobarSugerencias(
  items: ItemHabilidad[],
  c: string,
  cat: Catalogo,
  quien: string,
): Problema[] {
  const res: Problema[] = [];
  for (const it of items) {
    const s = casa(it, c, cat) ? especialidadSugerida(it, c, cat) : undefined;
    if (s && !items.some((o) => casa(o, c, cat) && !especialidadSugerida(o, c, cat))) {
      res.push(
        aviso(
          'habilidades',
          'especialidad-distinta',
          `${quien} propone ${nombreHabilidad(cat, it.habilidad)} (${s}); has elegido ${nombreHabilidad(cat, c)}.`,
        ),
      );
      break;
    }
  }
  return res;
}

// --------------------------------------------------------------------------- Cultura

export function validarCultura(p: Personaje, cultura: Cultura, cat: Catalogo): Problema[] {
  const res: Problema[] = [];
  const pts = porFuente(p, 'cultura');
  const total = suma(pts);
  if (total !== cultura.puntos) {
    res.push(
      error(
        'habilidades',
        'cultura-total',
        `Cultura: hay que repartir ${cultura.puntos} puntos (llevas ${total}).`,
      ),
    );
  }
  // Elecciones («y o bien Navegación fluvial o Montar»)
  const opciones = new Set(cultura.estandar_eleccion.flatMap((e) => e.opciones));
  const elegidas = p.eleccionesCultura.filter((e) => opciones.has(e));
  const debidas = cultura.estandar_eleccion.reduce((s, e) => s + e.n, 0);
  if (elegidas.length > debidas) {
    res.push(
      error(
        'habilidades',
        'cultura-eleccion',
        `${cultura.nombre}: solo puedes elegir ${debidas} entre ${[...opciones].map((o) => nombreHabilidad(cat, o)).join(', ')}.`,
      ),
    );
  }
  // Costumbres y Lengua materna (los +40 automáticos) también admiten puntos de cultura, como en Mythras.
  const estandar: ItemHabilidad[] = [
    ...cultura.estandar,
    ...cultura.automaticas.map((a) => ({ habilidad: a.habilidad })),
    ...elegidas.map((e) => ({ habilidad: e })),
  ];
  let profesionales = 0;
  let estilos = 0;
  for (const [c, n] of pts) {
    const nombre = nombreHabilidad(cat, c);
    const { habilidad, especialidad } = partirClave(c);
    if (n < cultura.min_por_habilidad || n > cultura.max_por_habilidad) {
      res.push(
        error(
          'habilidades',
          'cultura-rango',
          `Cultura: ${nombre} recibe ${n}; debe recibir entre +${cultura.min_por_habilidad} y +${cultura.max_por_habilidad}.`,
        ),
      );
    }
    if (habilidad === 'estilo-de-combate') {
      estilos++;
      if (!especialidad || !cultura.estilos.includes(especialidad)) {
        res.push(
          error(
            'habilidades',
            'cultura-estilo',
            `Cultura: ${nombre} no es un estilo cultural de ${cultura.nombre} (${cultura.estilos.map((e) => nombreHabilidad(cat, 'estilo-de-combate:' + e)).join(', ')}).`,
          ),
        );
      }
    } else if (estandar.some((it) => casa(it, c, cat))) {
      res.push(...comprobarSugerencias(estandar, c, cat, cultura.nombre));
    } else if (cultura.profesionales.some((it) => casa(it, c, cat))) {
      profesionales++;
      res.push(...comprobarSugerencias(cultura.profesionales, c, cat, cultura.nombre));
    } else {
      res.push(
        error(
          'habilidades',
          'cultura-fuera',
          `Cultura: ${nombre} no está entre las habilidades de ${cultura.nombre}.`,
        ),
      );
    }
  }
  if (profesionales > cultura.n_profesionales) {
    res.push(
      error(
        'habilidades',
        'cultura-profesionales',
        `Cultura: como mucho ${cultura.n_profesionales} habilidades profesionales (llevas ${profesionales}).`,
      ),
    );
  }
  if (estilos > 1)
    res.push(
      error(
        'habilidades',
        'cultura-estilos',
        'Cultura: solo se puede elegir un Estilo de combate cultural.',
      ),
    );
  return res;
}

// --------------------------------------------------------------------------- Carrera

export function validarReparteCarrera(p: Personaje, carrera: Carrera, cat: Catalogo): Problema[] {
  const res: Problema[] = [];
  const pts = porFuente(p, 'carrera');
  const total = suma(pts);
  if (total !== carrera.puntos) {
    res.push(
      error(
        'habilidades',
        'carrera-total',
        `Carrera: hay que repartir ${carrera.puntos} puntos (llevas ${total}).`,
      ),
    );
  }
  let profesionales = 0;
  for (const [c, n] of pts) {
    const nombre = nombreHabilidad(cat, c);
    if (n < 1 || n > carrera.max_por_habilidad) {
      res.push(
        error(
          'habilidades',
          'carrera-rango',
          `Carrera: ${nombre} recibe ${n}; como mucho +${carrera.max_por_habilidad}.`,
        ),
      );
    }
    if (carrera.estandar.some((it) => casa(it, c, cat))) {
      res.push(...comprobarSugerencias(carrera.estandar, c, cat, carrera.nombre));
    } else if (carrera.profesionales.some((it) => casa(it, c, cat))) {
      profesionales++;
      res.push(...comprobarSugerencias(carrera.profesionales, c, cat, carrera.nombre));
    } else {
      res.push(
        error(
          'habilidades',
          'carrera-fuera',
          `Carrera: ${nombre} no está entre las habilidades de ${carrera.nombre}.`,
        ),
      );
    }
  }
  if (profesionales > carrera.max_profesionales) {
    res.push(
      error(
        'habilidades',
        'carrera-profesionales',
        `Carrera: como mucho ${carrera.max_profesionales} habilidades profesionales (llevas ${profesionales}).`,
      ),
    );
  }
  return res;
}

// --------------------------------------------------------------------------- Puntos adicionales (Paso 7)

export function validarAdicionales(p: Personaje, cat: Catalogo): Problema[] {
  const res: Problema[] = [];
  const edad = cat.reglas.edades.find((e) => e.id === p.categoriaEdad);
  if (!edad)
    return [error('habilidades', 'edad', `Categoría de edad desconocida «${p.categoriaEdad}».`)];
  const pts = porFuente(p, 'adicional');
  const total = suma(pts);
  if (total !== edad.puntos) {
    res.push(
      error(
        'habilidades',
        'adicional-total',
        `Puntos adicionales (${edad.categoria}): hay que repartir ${edad.puntos} (llevas ${total}).`,
      ),
    );
  }
  const pueblo = cat.pueblos.find((x) => x.id === p.origen.pueblo);
  const conocidas = new Set([
    ...p.asignaciones
      .filter((a) => a.fuente === 'cultura' || a.fuente === 'carrera')
      .map((a) => a.clave),
    ...idiomasGratis(pueblo, p.lenguaMaterna).map((i) => i.clave),
  ]);
  for (const [c, n] of pts) {
    const nombre = nombreHabilidad(cat, c);
    if (n > edad.max_incremento) {
      res.push(
        error(
          'habilidades',
          'adicional-tope',
          `Puntos adicionales: ${nombre} recibe ${n}; el tope para un personaje ${edad.categoria.toLowerCase()} es +${edad.max_incremento}.`,
        ),
      );
    }
    const tipo = tipoDe(cat, c);
    const { habilidad } = partirClave(c);
    if (tipo === 'profesional' && !conocidas.has(c)) {
      res.push(
        error(
          'habilidades',
          'adicional-profesional',
          `Puntos adicionales: ${nombre} es profesional y no la da ni la cultura ni la carrera.`,
        ),
      );
    } else if (habilidad === 'estilo-de-combate' && !conocidas.has(c)) {
      res.push(
        aviso(
          'habilidades',
          'adicional-estilo-nuevo',
          `Puntos adicionales: ${nombre} es un estilo que no da ni la cultura ni la carrera; pide permiso al DJ.`,
        ),
      );
    }
  }
  return res;
}

// --------------------------------------------------------------------------- Pirámide

export function fichasUsadas(p: Personaje): number[] {
  return [
    ...p.asignaciones.filter((a) => a.fuente === 'piramide').map((a) => a.puntos),
    ...p.pasiones.filter((x) => x.extra).map((x) => x.extra!),
  ];
}

/** Fichas de la pirámide que quedan por colocar (con repetición). */
export function fichasLibres(p: Personaje, cat: Catalogo): number[] {
  const libres = [...cat.reglas.fichas_piramide.valores];
  for (const f of fichasUsadas(p)) {
    const i = libres.indexOf(f);
    if (i >= 0) libres.splice(i, 1);
  }
  return libres;
}

export function validarPiramide(p: Personaje, cat: Catalogo): Problema[] {
  const res: Problema[] = [];
  const reglas = cat.reglas.fichas_piramide;
  const usadas = fichasUsadas(p);
  // Multiconjunto: cada ficha se usa una vez y todas deben usarse
  const quedan = [...reglas.valores];
  const sobran: number[] = [];
  for (const f of usadas) {
    const i = quedan.indexOf(f);
    if (i >= 0) quedan.splice(i, 1);
    else sobran.push(f);
  }
  if (sobran.length)
    res.push(
      error(
        'habilidades',
        'piramide-sobran',
        `Pirámide: fichas que no existen o repetidas de más: ${sobran.join(', ')}.`,
      ),
    );
  if (quedan.length)
    res.push(
      error(
        'habilidades',
        'piramide-faltan',
        `Pirámide: faltan por asignar las fichas ${quedan.join(', ')}.`,
      ),
    );

  const asign = p.asignaciones.filter((a) => a.fuente === 'piramide');
  const vistas = new Set<string>();
  for (const a of asign) {
    if (vistas.has(a.clave))
      res.push(
        error(
          'habilidades',
          'piramide-doble',
          `Pirámide: ${nombreHabilidad(cat, a.clave)} recibe más de una ficha.`,
        ),
      );
    vistas.add(a.clave);
  }
  const hoja = calcularHabilidades(p, cat);
  for (const a of asign) {
    const h = hoja.find((x) => x.clave === a.clave);
    if (h && h.total > reglas.tope) {
      res.push(
        error(
          'habilidades',
          'piramide-tope',
          `Pirámide: ${h.nombre} llegaría al ${h.total}%; ninguna asignación puede pasar del ${reglas.tope}%.`,
        ),
      );
    }
  }
  const profesionales = asign.filter((a) => tipoDe(cat, a.clave) === 'profesional').length;
  if (profesionales < reglas.min_profesionales) {
    res.push(
      error(
        'habilidades',
        'piramide-profesionales',
        `Pirámide: al menos ${reglas.min_profesionales} fichas deben ir a habilidades profesionales (llevas ${profesionales}).`,
      ),
    );
  }
  if (reglas.recomendado_estilo && !asign.some((a) => a.clave.startsWith('estilo-de-combate:'))) {
    res.push(
      aviso(
        'habilidades',
        'piramide-sin-estilo',
        'Pirámide: se recomienda asignar al menos una ficha a un Estilo de combate.',
      ),
    );
  }
  const otras = p.asignaciones.filter((a) =>
    ['cultura', 'carrera', 'adicional'].includes(a.fuente),
  );
  if (otras.length)
    res.push(
      error(
        'habilidades',
        'piramide-mezcla',
        'Con la pirámide no se reparten puntos de cultura, carrera ni adicionales.',
      ),
    );
  return res;
}

// --------------------------------------------------------------------------- Entrada única

export function validarReparto(p: Personaje, cat: Catalogo): Problema[] {
  const res: Problema[] = [];
  for (const a of p.asignaciones) {
    const { habilidad } = partirClave(a.clave);
    if (!cat.habilidades.some((h) => h.id === habilidad)) {
      res.push(
        error('habilidades', 'habilidad-desconocida', `Habilidad desconocida «${a.clave}».`),
      );
    }
    if (!Number.isInteger(a.puntos) || a.puntos < 0) {
      res.push(
        error(
          'habilidades',
          'puntos-invalidos',
          `${nombreHabilidad(cat, a.clave)}: los puntos deben ser un entero positivo.`,
        ),
      );
    }
  }
  if (p.metodoHabilidades === 'piramide') return [...res, ...validarPiramide(p, cat)];
  const cultura = cat.culturas.find((c) => c.id === p.origen.cultura);
  const carrera = cat.carreras.find((c) => c.id === p.carrera);
  if (cultura) res.push(...validarCultura(p, cultura, cat));
  if (carrera) res.push(...validarReparteCarrera(p, carrera, cat));
  res.push(...validarAdicionales(p, cat));
  if (p.asignaciones.some((a) => a.fuente === 'piramide')) {
    res.push(
      error(
        'habilidades',
        'estandar-mezcla',
        'Con el método estándar no se usan fichas de la pirámide.',
      ),
    );
  }
  return res;
}
