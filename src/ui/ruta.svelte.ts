// Enrutado por hash (#/…), compatible con GitHub Pages.
class Ruta {
  hash = $state(typeof location === 'undefined' ? '#/' : location.hash || '#/');

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => (this.hash = location.hash || '#/'));
    }
  }

  /** Partes de la ruta: «#/personaje/abc/origen» → ['personaje', 'abc', 'origen']. */
  get partes(): string[] {
    return this.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  }

  ir(destino: string) {
    location.hash = destino;
  }
}

export const ruta = new Ruta();

export const enlacePaso = (id: string, paso: string) =>
  `#/personaje/${encodeURIComponent(id)}/${paso}`;
