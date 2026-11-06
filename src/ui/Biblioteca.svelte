<script lang="ts">
  import { campaña } from '../almacen/campaña.svelte';
  import { biblioteca, descargar, nombreArchivo } from '../almacen/biblioteca.svelte';
  import { catalogo } from '../datos/catalogo';
  import { calcularHoja } from '../motor/hoja';
  import { enlacePaso, ruta } from './ruta.svelte';

  let mensaje = $state('');
  let entradaArchivo: HTMLInputElement | undefined = $state();

  const filas = $derived(
    biblioteca.entradas.map((e) => {
      const p = e.personaje;
      const hoja = calcularHoja(p, catalogo, campaña.actual);
      return {
        p,
        modificado: new Date(e.modificado),
        carrera: catalogo.carreras.find((c) => c.id === p.carrera)?.nombre ?? '—',
        pueblo: catalogo.pueblos.find((x) => x.id === p.origen.pueblo)?.nombre ?? '—',
        errores: hoja.problemas.filter((x) => x.gravedad === 'error').length,
      };
    }),
  );

  function crear() {
    const p = biblioteca.crear();
    ruta.ir(enlacePaso(p.id, 'concepto'));
  }

  function borrar(id: string, nombre: string) {
    // Confirmación en la propia página (sin diálogos del navegador)
    if (pendienteBorrar === id) {
      biblioteca.borrar(id);
      pendienteBorrar = '';
      mensaje = `Se ha borrado «${nombre || 'Sin nombre'}».`;
    } else {
      pendienteBorrar = id;
    }
  }
  let pendienteBorrar = $state('');

  async function importar(e: Event) {
    const archivo = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!archivo) return;
    try {
      const n = biblioteca.importar(await archivo.text());
      mensaje = n === 1 ? 'Se ha importado 1 personaje.' : `Se han importado ${n} personajes.`;
    } catch (err) {
      mensaje = `No se ha podido importar: ${(err as Error).message}`;
    } finally {
      (e.currentTarget as HTMLInputElement).value = '';
    }
  }

  const fecha = (d: Date) => d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<article class="folio">
  <h1>Mis personajes</h1>
  <p class="subtitulo">Mythras · Reinos hispánicos del siglo XIV</p>

  {#if biblioteca.entradas.length === 0}
    <p class="capitular">
      Bienvenido, viajero. En este taller se forjan los hombres y mujeres que recorrerán los caminos
      de Castilla, Aragón, Navarra, Portugal y Granada: hidalgos sin fortuna, almogávares de la
      frontera, físicos judíos, goliardos y saludadoras. Aún no tienes ningún personaje.
    </p>
  {/if}

  <div class="acciones">
    <button class="principal" onclick={crear}>✒ Crear un personaje</button>
    <button onclick={() => entradaArchivo?.click()}>Importar JSON…</button>
    <input
      bind:this={entradaArchivo}
      type="file"
      accept=".json,application/json"
      hidden
      onchange={importar}
    />
    {#if biblioteca.entradas.length}
      <button onclick={() => descargar('biblioteca-taller.json', biblioteca.exportar())}>
        Copia de seguridad de todos
      </button>
    {/if}
  </div>

  {#if mensaje}<p class="mensaje" role="status">{mensaje}</p>{/if}
  {#if biblioteca.error}<p class="mensaje error" role="alert">{biblioteca.error}</p>{/if}

  {#if filas.length}
    <table>
      <thead>
        <tr
          ><th>Nombre</th><th>Pueblo</th><th>Carrera</th><th>Estado</th><th>Modificado</th><th
          ></th></tr
        >
      </thead>
      <tbody>
        {#each filas as f (f.p.id)}
          <tr>
            <td>
              <a href={enlacePaso(f.p.id, 'concepto')}>{f.p.nombre || 'Sin nombre'}</a>
              <a class="jugar" href={enlacePaso(f.p.id, 'juego')} title="Vista de juego">⚔ Jugar</a>
            </td>
            <td>{f.pueblo}</td>
            <td>{f.carrera}</td>
            <td>
              {#if f.errores === 0}<span class="ok">Completo</span>
              {:else}<span class="pendiente">{f.errores} por resolver</span>{/if}
            </td>
            <td>{fecha(f.modificado)}</td>
            <td class="botones">
              <button
                onclick={() => descargar(nombreArchivo(f.p.nombre), biblioteca.exportar([f.p.id]))}
                >JSON</button
              >
              <button onclick={() => biblioteca.duplicar(f.p.id)}>Duplicar</button>
              <button
                class:peligro={pendienteBorrar === f.p.id}
                onclick={() => borrar(f.p.id, f.p.nombre)}
              >
                {pendienteBorrar === f.p.id ? '¿Seguro? Borrar' : 'Borrar'}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <p class="privacidad">
    Los personajes solo viven en este navegador. Haz de vez en cuando una copia de seguridad en
    JSON.
  </p>
</article>

<style>
  .acciones {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    margin: 1.5rem 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    text-align: left;
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid var(--borde);
  }
  th {
    font-weight: 600;
    color: var(--tinta-suave);
  }
  .botones {
    white-space: nowrap;
    text-align: right;
  }
  .botones button {
    font-size: 0.85em;
    padding: 0.15em 0.6em;
  }
  .ok {
    color: var(--tinta-suave);
  }
  .jugar {
    margin-left: 0.6rem;
    font-size: 0.85em;
  }
  .pendiente {
    color: var(--rubrica);
  }
  .peligro {
    border-color: var(--rubrica);
    color: var(--rubrica);
  }
  .mensaje {
    padding: 0.4rem 0.8rem;
    border-left: 3px solid var(--oro);
  }
  .mensaje.error {
    border-color: var(--rubrica);
  }
  .privacidad {
    margin-top: 2rem;
    font-size: 0.9em;
    font-style: italic;
    color: var(--tinta-suave);
  }
</style>
