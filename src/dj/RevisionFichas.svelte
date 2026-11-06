<script lang="ts">
  // Revisión de las fichas de los jugadores: se cargan sus JSON y se validan con la campaña activa.
  import { leerArchivo } from '../almacen/archivo';
  import { campaña } from '../almacen/campaña.svelte';
  import { catalogo } from '../datos/catalogo';
  import { calcularHoja } from '../motor/hoja';
  import type { Personaje } from '../motor/personaje';
  import Problemas from '../ui/comunes/Problemas.svelte';

  let fichas = $state<{ archivo: string; p: Personaje }[]>([]);
  let errores = $state<string[]>([]);
  let entrada: HTMLInputElement | undefined = $state();

  async function cargar(e: Event) {
    const archivos = [...((e.currentTarget as HTMLInputElement).files ?? [])];
    const nuevas: typeof fichas = [];
    const fallos: string[] = [];
    for (const a of archivos) {
      try {
        for (const p of leerArchivo(await a.text())) nuevas.push({ archivo: a.name, p });
      } catch (err) {
        fallos.push(`${a.name}: ${(err as Error).message}`);
      }
    }
    fichas = [...fichas, ...nuevas];
    errores = fallos;
    (e.currentTarget as HTMLInputElement).value = '';
  }

  const revisadas = $derived(
    fichas.map((f) => ({ ...f, hoja: calcularHoja(f.p, catalogo, campaña.actual) })),
  );
  const nombre = (lista: { id: string; nombre: string }[], id: string) =>
    lista.find((x) => x.id === id)?.nombre ?? '—';
</script>

<p>
  Carga los JSON que te envíen los jugadores (uno o varios, o una copia de toda su biblioteca). Se
  validan con la campaña activa{campaña.actual.nombre ? ` («${campaña.actual.nombre}»)` : ''}.
</p>
<div class="acciones">
  <button class="principal" onclick={() => entrada?.click()}>Cargar fichas…</button>
  <input
    bind:this={entrada}
    type="file"
    accept=".json,application/json"
    multiple
    hidden
    onchange={cargar}
  />
  {#if fichas.length}<button onclick={() => (fichas = [])}>Vaciar</button>{/if}
</div>
{#each errores as e, i (i)}<p class="error">{e}</p>{/each}

{#each revisadas as f, i (i)}
  <article class="ficha">
    <h2>
      {f.p.nombre || 'Sin nombre'}
      <span class={f.hoja.valido ? 'ok' : 'mal'}
        >{f.hoja.valido ? '✓ válida' : '✗ con errores'}</span
      >
    </h2>
    <p class="detalle">
      {f.archivo} · {nombre(catalogo.pueblos, f.p.origen.pueblo)} · {nombre(
        catalogo.carreras,
        f.p.carrera,
      )} · {f.hoja.clase ?? '—'}
      {#if f.p.experiencia?.historial.length}
        · {f.p.experiencia.historial.length} cambios por experiencia{/if}
    </p>
    <Problemas problemas={f.hoja.problemas} vacio="Ni errores ni avisos." />
  </article>
{/each}

<style>
  .acciones {
    display: flex;
    gap: 0.6rem;
  }
  .ficha {
    border-bottom: 1px solid var(--borde);
    padding: 0.6rem 0;
  }
  .ficha h2 {
    font-size: 1.4rem;
    margin: 0;
  }
  .ok {
    font-size: 0.7em;
    color: var(--tinta-suave);
  }
  .mal,
  .error {
    color: var(--rubrica);
  }
  .mal {
    font-size: 0.7em;
  }
</style>
