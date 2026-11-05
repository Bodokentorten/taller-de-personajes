// Comprueba que la edición de jugador no contiene código ni datos del DJ.
// Uso: node scripts/centinela.mjs <carpeta>
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CENTINELA = 'CENTINELA-DJ-NO-PUBLICAR';
const carpeta = process.argv[2] ?? 'dist';

function recorrer(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? recorrer(ruta) : [ruta];
  });
}

const textos = /\.(js|mjs|css|html|json|txt|svg|map)$/i;
const culpables = recorrer(carpeta).filter(
  (ruta) => textos.test(ruta) && readFileSync(ruta, 'utf8').includes(CENTINELA),
);

if (culpables.length > 0) {
  console.error('✗ ¡Datos del DJ en la edición de jugador!');
  for (const ruta of culpables) console.error('  · ' + ruta);
  process.exit(1);
}
console.log(`✓ Centinela: ${carpeta}/ no contiene datos del DJ.`);
