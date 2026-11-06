<script lang="ts">
  import { campaña } from '../../almacen/campaña.svelte';
  import { catalogo } from '../../datos/catalogo';
  import { tirarDinero, formulaDinero } from '../../motor/economia';
  import { tablaClases, tirarClase } from '../../motor/origen';
  import { type Personaje, type TablaTrasfondo } from '../../motor/personaje';
  import { TABLAS_TRASFONDO, tirarTrasfondo } from '../../motor/trasfondo';

  let { p = $bindable() }: { p: Personaje } = $props();

  const tabla = $derived(tablaClases(p, catalogo));
  const clase = $derived(tabla.tabla.find((c) => c.id === p.origen.clase));
  const credo = $derived(catalogo.credos.find((c) => c.id === p.origen.credo));
  const dinero = $derived(formulaDinero(p, catalogo));
  const equipoInicial = $derived(
    clase
      ? catalogo.trasfondo.equipo_inicial.find((e) => e.estamentos.includes(clase.estamento))
      : undefined,
  );
  const familiares = TABLAS_TRASFONDO.filter((t) => t.id !== 'eventos') as {
    id: TablaTrasfondo;
    nombre: string;
  }[];

  function tirarLaClase() {
    const r = tirarClase(p, catalogo);
    p.origen.tiradaClase = r.tirada;
    p.origen.clase = r.clase?.id ?? '';
    p.dinero = {};
  }

  function elegirClase(id: string) {
    p.origen.clase = id;
    p.origen.tiradaClase = undefined;
    p.dinero = {};
  }

  function tirarElDinero() {
    const r = tirarDinero(p, catalogo);
    if (r) p.dinero = { tirada: r.tirada, total: r.total };
  }

  const puedeRepetir = (hay: boolean) => !hay || campaña.actual.repetirTrasfondo;
</script>

{#if !p.origen.cultura}
  <p>Elige antes la cultura y el pueblo (paso «Origen y cultura»).</p>
{:else}
  <h2>Clase social</h2>
  <p>Se tira en la tabla de <strong>{tabla.origen}</strong>.</p>
  <p>
    <button type="button" onclick={tirarLaClase}>🎲 Tirar 1d100</button>
    {#if p.origen.tiradaClase !== undefined}Salió <strong>{p.origen.tiradaClase}</strong>.{/if}
  </p>
  <table class="tabla">
    <thead><tr><th>1d100</th><th>Clase</th><th>Ejemplos</th><th>Dinero</th></tr></thead>
    <tbody>
      {#each tabla.tabla as c (c.id)}
        <tr class:elegida={c.id === p.origen.clase}>
          <td
            >{String(c.min).padStart(2, '0')}–{c.max === 100
              ? '00'
              : String(c.max).padStart(2, '0')}</td
          >
          <td
            ><label
              ><input
                type="radio"
                name="clase"
                checked={c.id === p.origen.clase}
                onchange={() => elegirClase(c.id)}
              />
              {c.clase}</label
            ></td
          >
          <td class="detalle">{c.ejemplos}</td>
          <td>×{String(c.mod_dinero).replace('.', ',')}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  {#if clase}
    <p><strong>Recursos:</strong> {clase.recursos}</p>
    {#if credo?.titulos_nobleza.length && (clase.estamento === 'alta-nobleza' || clase.estamento === 'baja-nobleza')}
      <p class="detalle">
        Si es noble, el DJ puede tirar el título en la tabla del {credo.nombre.toLowerCase()} (1d10).
      </p>
    {/if}
  {/if}

  {#if equipoInicial}
    <h2>Posesiones de su estamento</h2>
    <dl class="posesiones">
      <dt>Ropa</dt>
      <dd>{equipoInicial.ropa}</dd>
      <dt>Armas</dt>
      <dd>{equipoInicial.armas}</dd>
      <dt>Armadura</dt>
      <dd>{equipoInicial.armadura}</dd>
      <dt>Transporte</dt>
      <dd>{equipoInicial.transporte}</dd>
    </dl>
  {/if}

  {#if dinero}
    <h2>Dinero inicial</h2>
    <p>
      {dinero.dados} × {dinero.multiplicador} mrs × {String(dinero.mod).replace('.', ',')} (clase)
      <button
        type="button"
        disabled={!puedeRepetir(p.dinero.total !== undefined)}
        onclick={tirarElDinero}>🎲 Tirar</button
      >
      {#if p.dinero.total !== undefined}
        → <strong>{p.dinero.total} maravedíes</strong> (salió {p.dinero.tirada?.dados.join(' + ')})
      {/if}
    </p>
  {/if}

  <h2>Familia y conexiones</h2>
  <table class="tabla">
    <tbody>
      {#each familiares as t (t.id)}
        {@const r = p.trasfondo[t.id]}
        <tr>
          <th scope="row">{t.nombre}</th>
          <td>
            <button
              type="button"
              disabled={!puedeRepetir(Boolean(r))}
              onclick={() => (p.trasfondo[t.id] = tirarTrasfondo(catalogo, t.id))}
            >
              {r ? '🎲 Otra vez' : '🎲 Tirar'}
            </button>
          </td>
          <td
            >{#if r}<span class="tirada">{r.tirada}</span>
              {r.texto}{#if r.detalle}<br /><strong class="detalle-tirada">{r.detalle}</strong
                >{/if}{/if}</td
          >
        </tr>
      {/each}
    </tbody>
  </table>

  <h2>Eventos de trasfondo</h2>
  <p class="detalle">
    Un adulto tira una vez; uno de más edad, alguna más (o elige con permiso del DJ).
  </p>
  <ul class="eventos">
    {#each p.trasfondo.eventos ?? [] as ev, i (i)}
      <li>
        <span class="tirada">{ev.tirada}</span>
        {ev.texto}
        <button
          type="button"
          class="quitar"
          onclick={() => p.trasfondo.eventos?.splice(i, 1)}
          aria-label="Quitar evento">✕</button
        >
      </li>
    {/each}
  </ul>
  <button
    type="button"
    onclick={() =>
      (p.trasfondo.eventos = [...(p.trasfondo.eventos ?? []), tirarTrasfondo(catalogo, 'eventos')])}
  >
    🎲 Tirar un evento
  </button>
{/if}

<style>
  .tabla {
    border-collapse: collapse;
    width: 100%;
  }
  .tabla th,
  .tabla td {
    padding: 0.3rem 0.5rem;
    border-bottom: 1px solid var(--borde);
    text-align: left;
    vertical-align: top;
  }
  tr.elegida {
    background: var(--pergamino-hondo);
  }
  .posesiones {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.2rem 1rem;
  }
  dt {
    font-weight: 600;
  }
  dd {
    margin: 0;
  }
  .tirada {
    font-family: var(--letra-titulo);
    color: var(--rubrica);
    margin-right: 0.3rem;
  }
  .eventos li {
    margin: 0.4rem 0;
  }
  .quitar {
    padding: 0 0.4em;
    font-size: 0.8em;
  }
</style>
