// La «hoja»: todo lo que se calcula de un personaje, lista para mostrar o exportar, y el validador global.
import type { Catalogo } from '../datos/catalogo';
import { calcularAtributos, type Atributos } from './atributos';
import { validarCaracteristicas } from './caracteristicas';
import { validarDinero } from './economia';
import { resumenEquipo, type ResumenEquipo } from './equipo';
import { estadoFe, validarFe, type EstadoFe } from './fe';
import { calcularHabilidades, type ValorHabilidad } from './habilidades';
import { estadoMagia, validarMagia, type EstadoMagia } from './magia';
import { claseSocial, validarCarrera, validarOrigen } from './origen';
import { validarPasiones, valorPasion } from './pasiones';
import {
  CAMPAÑA_POR_DEFECTO,
  caracteristicasActuales,
  type Campaña,
  type Personaje,
} from './personaje';
import { validarReparto } from './reparto';
import { aviso, error, type Problema } from './resultado';

export interface Hoja {
  atributos: Atributos;
  habilidades: ValorHabilidad[];
  pasiones: { nombre: string; valor: number | undefined; fe: boolean }[];
  fe: EstadoFe;
  magia: EstadoMagia;
  equipo: ResumenEquipo;
  clase?: string;
  /** Estrés y Corrupción al empezar: 0 («Horror, Estrés y Pánico»: el Estrés comienza en 0). */
  estres: number;
  corrupcion: number;
  problemas: Problema[];
  valido: boolean;
}

export function validarConcepto(p: Personaje, campaña: Campaña): Problema[] {
  const res: Problema[] = [];
  if (!p.nombre.trim())
    res.push(aviso('concepto', 'sin-nombre', 'El personaje aún no tiene nombre.'));
  if (!p.sexo)
    res.push(
      aviso('concepto', 'sin-sexo', 'Indica el sexo: algunas carreras y la Nomina dependen de él.'),
    );
  if (!campaña.metodosHabilidades.includes(p.metodoHabilidades)) {
    res.push(
      error(
        'habilidades',
        'metodo-no-permitido',
        `La campaña no permite el método «${p.metodoHabilidades}».`,
      ),
    );
  }
  if (!campaña.metodosCaracteristicas.includes(p.caracteristicas.metodo)) {
    res.push(
      error(
        'caracteristicas',
        'metodo-no-permitido',
        `La campaña no permite el método «${p.caracteristicas.metodo}».`,
      ),
    );
  }
  return res;
}

export function calcularHoja(
  p: Personaje,
  cat: Catalogo,
  campaña: Campaña = CAMPAÑA_POR_DEFECTO,
): Hoja {
  const habilidades = calcularHabilidades(p, cat);
  const magia = estadoMagia(p, cat, habilidades);
  const fe = estadoFe(p, cat, habilidades, magia.conoceGoecia);
  const problemas = [
    ...validarConcepto(p, campaña),
    ...validarCaracteristicas(p, cat.reglas),
    ...validarOrigen(p, cat, campaña),
    ...validarCarrera(p, cat, campaña),
    ...validarReparto(p, cat),
    ...validarPasiones(p, cat),
    ...validarFe(p, cat, fe, magia.conoceGoecia),
    ...validarMagia(p, cat, magia),
    ...validarDinero(p, cat),
  ];
  const equipo = resumenEquipo(p, cat);
  if (equipo.restante !== undefined && equipo.restante < 0) {
    problemas.push(
      error(
        'equipo',
        'sin-dinero-suficiente',
        `El equipo cuesta ${equipo.coste} mrs y solo tiene ${equipo.dinero}.`,
      ),
    );
  }
  if (equipo.estado !== 'normal') {
    problemas.push(
      aviso(
        'equipo',
        'carga',
        `Lleva ${equipo.car} de CAR: va ${equipo.estado} (FUE×2 = ${caracteristicasActuales(p).FUE * 2}).`,
      ),
    );
  }
  return {
    atributos: calcularAtributos(caracteristicasActuales(p), cat.reglas),
    habilidades,
    pasiones: p.pasiones.map((x) => ({
      nombre: x.nombre,
      valor: valorPasion(x, p, cat),
      fe: Boolean(x.fe),
    })),
    fe,
    magia,
    equipo,
    clase: claseSocial(p, cat)?.clase,
    estres: p.juego?.estres ?? 0,
    corrupcion: p.juego?.corrupcion ?? 0,
    problemas,
    valido: !problemas.some((x) => x.gravedad === 'error'),
  };
}
