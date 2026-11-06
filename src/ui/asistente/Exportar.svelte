<script lang="ts">
  import { campaña } from '../../almacen/campaña.svelte';
  import { descargar, nombreArchivo } from '../../almacen/biblioteca.svelte';
  import { serializar } from '../../almacen/archivo';
  import { catalogo } from '../../datos/catalogo';
  import { exportarMarkdown } from '../../exportar/markdown';
  import type { Hoja } from '../../motor/hoja';
  import type { Personaje } from '../../motor/personaje';

  let { p, hoja }: { p: Personaje; hoja: Hoja } = $props();
  let mensaje = $state('');

  const md = () => exportarMarkdown($state.snapshot(p) as Personaje, catalogo, campaña.actual);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(md());
      mensaje = 'Markdown copiado: pégalo en una nota nueva de «90 - Partidas».';
    } catch {
      mensaje = 'No se ha podido copiar: usa la descarga.';
    }
  }
</script>

<section class="exportar" aria-label="Exportar">
  <h2>Exportar</h2>
  {#if !hoja.valido}<p class="aviso">
      La ficha aún tiene cosas por resolver: se exporta tal como está.
    </p>{/if}
  <button
    type="button"
    onclick={() => descargar(nombreArchivo(p.nombre, 'md'), md(), 'text/markdown')}
    >Markdown (.md)</button
  >
  <button type="button" onclick={copiar}>Copiar Markdown</button>
  <button
    type="button"
    onclick={() =>
      descargar(nombreArchivo(p.nombre), serializar([$state.snapshot(p) as Personaje]))}
    >Copia en JSON</button
  >
  <a class="boton" href={`#/personaje/${encodeURIComponent(p.id)}/imprimir`}
    >🖨 Ficha para imprimir</a
  >
  {#if mensaje}<p class="mensaje" role="status">{mensaje}</p>{/if}
</section>

<style>
  .exportar {
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  h2 {
    font-size: 1.2rem;
    margin: 0;
  }
  button,
  .boton {
    text-align: left;
    font-size: 0.95em;
  }
  .boton {
    display: block;
    padding: 0.35em 0.9em;
    border: 1px solid var(--borde);
    border-radius: 3px;
    background: var(--pergamino-hondo);
    color: var(--tinta);
    text-decoration: none;
  }
  .aviso,
  .mensaje {
    font-size: 0.85em;
    color: var(--tinta-suave);
    margin: 0;
  }
  .aviso {
    color: var(--rubrica);
  }
</style>
