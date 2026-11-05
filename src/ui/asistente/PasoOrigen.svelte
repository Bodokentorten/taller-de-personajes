<script lang="ts">
  import { catalogo } from '../../datos/catalogo';
  import type { Pueblo } from '../../datos/tipos';
  import { idiomasGratis } from '../../motor/habilidades';
  import { tablaClases } from '../../motor/origen';
  import type { Personaje } from '../../motor/personaje';
  import Escudo from '../comunes/Escudo.svelte';
  import Info from '../comunes/Info.svelte';
  import SugerirNombre from './SugerirNombre.svelte';

  let { p = $bindable() }: { p: Personaje } = $props();

  const reino = $derived(catalogo.reinos.find((r) => r.id === p.origen.reino));
  const pueblos = $derived(
    reino ? catalogo.pueblos.filter((x) => x.reinos.includes(reino.nombre)) : [],
  );
  const pueblo = $derived(catalogo.pueblos.find((x) => x.id === p.origen.pueblo));
  const credo = $derived(catalogo.credos.find((c) => c.id === p.origen.credo));
  const gratis = $derived(idiomasGratis(pueblo, p.lenguaMaterna));

  /** Si la lengua materna del pueblo es una sola palabra («Castellano»), se rellena sola. */
  const lenguaSimple = (x: Pueblo) =>
    /^[\p{L}-]+$/u.test(x.lengua_materna) ? x.lengua_materna : '';

  function elegirReino(id: string) {
    p.origen.reino = id;
    const r = catalogo.reinos.find((x) => x.id === id);
    if (pueblo && r && !pueblo.reinos.includes(r.nombre)) p.origen.pueblo = '';
  }

  function elegirPueblo(x: Pueblo) {
    p.origen.pueblo = x.id;
    p.origen.credo = x.credo;
    p.lenguaMaterna = lenguaSimple(x);
    if (!p.origen.cultura && x.culturas_habituales.length === 1)
      p.origen.cultura = x.culturas_habituales[0]!;
    revisarClase();
  }

  /** Si cambia la tabla de clases (otra cultura u otro credo), la clase elegida deja de valer. */
  function revisarClase() {
    if (!tablaClases(p, catalogo).tabla.some((c) => c.id === p.origen.clase)) {
      p.origen.clase = '';
      p.origen.tiradaClase = undefined;
    }
  }
</script>

<h2>Reino</h2>
<div class="reinos">
  {#each catalogo.reinos as r (r.id)}
    <button
      type="button"
      class="reino"
      aria-pressed={p.origen.reino === r.id}
      onclick={() => elegirReino(r.id)}
    >
      <Escudo reino={r.id} />
      <span>{r.nombre}</span>
    </button>
  {/each}
</div>

{#if reino}
  <h2>Pueblo</h2>
  <div class="tarjetas">
    {#each pueblos as x (x.id)}
      <div class="tarjeta" class:elegida={p.origen.pueblo === x.id}>
        <label>
          <input
            type="radio"
            name="pueblo"
            checked={p.origen.pueblo === x.id}
            onchange={() => elegirPueblo(x)}
          />
          <strong>{x.nombre}</strong>{#if x.raro}<span class="raro"> (raro)</span>{/if}
        </label>
        <Info titulo={x.nombre} resumen={x.resumen} nota={x.nota}>
          <p><strong>Restricciones:</strong> {x.restricciones}</p>
          {#if x.pasiones_sugeridas.length}<p>
              <strong>Pasiones sugeridas:</strong>
              {x.pasiones_sugeridas.join('; ')}
            </p>{/if}
        </Info>
        <p class="detalle">
          Credo {catalogo.credos.find((c) => c.id === x.credo)?.nombre.replace('Credo ', '')} · {x.lengua_materna}
        </p>
      </div>
    {/each}
  </div>
{/if}

{#if pueblo}
  <h2>Credo</h2>
  <p>
    <select bind:value={p.origen.credo} onchange={revisarClase}>
      {#each catalogo.credos as c (c.id)}<option value={c.id}>{c.nombre}</option>{/each}
    </select>
    {#if credo}<Info titulo={credo.nombre} resumen={credo.resumen} nota={credo.nota} />{/if}
    {#if pueblo.credo !== p.origen.credo}<span class="raro">
        ¿Converso? Los {pueblo.nombre.toLowerCase()} son de otro credo.</span
      >{/if}
  </p>

  <h2>Cultura</h2>
  <p class="detalle">Habitual entre los {pueblo.nombre.toLowerCase()}: {pueblo.culturas_texto}.</p>
  <div class="tarjetas">
    {#each catalogo.culturas as c (c.id)}
      <div
        class="tarjeta"
        class:elegida={p.origen.cultura === c.id}
        class:atenuada={!pueblo.culturas_habituales.includes(c.id)}
      >
        <label>
          <input
            type="radio"
            name="cultura"
            value={c.id}
            bind:group={p.origen.cultura}
            onchange={revisarClase}
          />
          <strong>{c.nombre}</strong>
        </label>
        <Info titulo={c.nombre} resumen={c.resumen} nota={c.nota} />
      </div>
    {/each}
  </div>

  <h2>Lenguas</h2>
  <label>
    Lengua materna
    <input type="text" bind:value={p.lenguaMaterna} placeholder={pueblo.lengua_materna} />
  </label>
  {#if !lenguaSimple(pueblo)}<p class="detalle">{pueblo.lengua_materna}</p>{/if}
  <p>
    Costumbres {pueblo.costumbres}. Idiomas gratuitos:
    {gratis.length
      ? gratis.map((i) => `${i.clave.replace('idioma:', '')} +${i.puntos}%`).join(', ')
      : 'ninguno'}.
  </p>

  <h2>Nombre</h2>
  <p>Nombre actual: <strong>{p.nombre || '—'}</strong></p>
  <SugerirNombre bind:p />
{/if}

<style>
  .reinos {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .reino {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    width: 8.5rem;
    padding: 0.6rem;
    background: transparent;
  }
  .reino[aria-pressed='true'] {
    background: var(--pergamino-hondo);
    border-color: var(--rubrica);
    box-shadow: inset 0 0 0 1px var(--rubrica);
  }
  .raro {
    color: var(--rubrica);
    font-style: italic;
  }
</style>
