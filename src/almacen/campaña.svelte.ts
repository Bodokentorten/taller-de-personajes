// Campaña activa en este navegador.
import { CAMPAÑA_POR_DEFECTO, type Campaña } from '../motor/personaje';
import { normalizarCampaña } from './campaña';

const CLAVE = 'taller.campaña';

function leer(): Campaña {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? normalizarCampaña(JSON.parse(crudo)) : CAMPAÑA_POR_DEFECTO;
  } catch {
    return CAMPAÑA_POR_DEFECTO;
  }
}

class CampañaActiva {
  actual = $state<Campaña>(leer());

  fijar(c: Campaña) {
    this.actual = c;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(c));
    } catch {
      /* sin almacenamiento: vale para esta sesión */
    }
  }

  restablecer() {
    this.fijar(CAMPAÑA_POR_DEFECTO);
  }
}

export const campaña = new CampañaActiva();
