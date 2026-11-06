<script lang="ts">
  // Consulta de reglas: buscador sin conexión sobre los catálogos de jugador y fichas de lectura.
  import { catalogo } from '../../datos/catalogo';
  import {
    buscar,
    buscarEntrada,
    claveEntrada,
    construirIndice,
    TIPOS,
    type EntradaConsulta,
    type TipoEntrada,
  } from '../../consulta/indice';
  import { CAMPAÑA_POR_DEFECTO } from '../../motor/personaje';

  let { tipo, id }: { tipo?: string; id?: string } = $props();

  // Fórmulas, rituales y grimorios solo si la campaña permite la magia en los PJ.
  const tiposVisibles = TIPOS.filter((t) => !t.magia || CAMPAÑA_POR_DEFECTO.permitirMagia);
  const indice = construirIndice(catalogo).filter((e) =>
    tiposVisibles.some((t) => t.id === e.tipo),
  );

  let consulta = $state('');
  let filtro = $state<TipoEntrada | ''>('');
  let campo: HTMLInputElement | undefined = $state();

  const elegida = $derived(tipo && id ? buscarEntrada(indice, tipo as TipoEntrada, id) : undefined);
  const resultados = $derived.by(() => {
    if (consulta.trim()) return buscar(indice, consulta, filtro ? new Set([filtro]) : undefined);
    if (filtro)
      return indice
        .filter((e) => e.tipo === filtro)
        .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    return [];
  });
  const enlace = (e: { tipo: TipoEntrada; id: string }) =>
    `#/reglas/${e.tipo}/${encodeURIComponent(e.id)}`;
  const nombreTipo = (t: TipoEntrada) => TIPOS.find((x) => x.id === t)?.nombre ?? t;
  const recuento = (t: TipoEntrada) => indice.filter((e) => e.tipo === t).length;

  $effect(() => {
    if (!elegida) campo?.focus();
  });

  function teclado(e: KeyboardEvent) {
    // «/» enfoca el buscador desde cualquier sitio
    const t = e.target as HTMLElement;
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
      e.preventDefault();
      campo?.focus();
    }
  }
</script>

<svelte:window onkeydown={teclado} />

<div class="consulta">
  <aside class="buscador">
    <h1>Consulta de reglas</h1>
    <input
      bind:this={campo}
      type="search"
      bind:value={consulta}
      placeholder="Busca: almogávar, ballesta, Teología…"
      aria-label="Buscar en las reglas"
    />
    <div class="tipos" role="group" aria-label="Filtrar por tipo">
      <button type="button" aria-pressed={filtro === ''} onclick={() => (filtro = '')}>Todo</button>
      {#each tiposVisibles as t (t.id)}
        <button
          type="button"
          aria-pressed={filtro === t.id}
          onclick={() => (filtro = filtro === t.id ? '' : t.id)}
        >
          {t.plural} <span class="n">{recuento(t.id)}</span>
        </button>
      {/each}
    </div>
    {#if consulta.trim() || filtro}
      <p class="detalle">
        {resultados.length === 60
          ? 'Los 60 primeros resultados'
          : `${resultados.length} resultado${resultados.length === 1 ? '' : 's'}`}
      </p>
      <ul class="resultados">
        {#each resultados as r (claveEntrada(r))}
          <li>
            <a
              href={enlace(r)}
              aria-current={elegida && claveEntrada(elegida) === claveEntrada(r)
                ? 'true'
                : undefined}
            >
              <strong>{r.titulo}</strong>
              <span class="tipo"
                >{r.subtitulo.toLowerCase().startsWith(nombreTipo(r.tipo).toLowerCase())
                  ? r.subtitulo
                  : `${nombreTipo(r.tipo)} · ${r.subtitulo}`}</span
              >
            </a>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="detalle">
        Escribe para buscar o elige un tipo para ver la lista completa. Pulsa <kbd>/</kbd> para volver
        al buscador.
      </p>
    {/if}
  </aside>

  <main class="ficha">
    {#if elegida}
      {@render ficha(elegida)}
    {:else}
      <article class="folio">
        <p class="capitular">
          Aquí están las reglas que necesita un jugador para crear y llevar su personaje:
          habilidades, culturas, pueblos y credos, carreras, estilos de combate, armas, armaduras y
          equipo{CAMPAÑA_POR_DEFECTO.permitirMagia
            ? ', y las fórmulas, los rituales y los grimorios'
            : ''}. Son resúmenes: el texto completo está en las notas del vault.
        </p>
      </article>
    {/if}
  </main>
</div>

{#snippet ficha(e: EntradaConsulta)}
  <article class="folio">
    <p class="tipo-ficha">{nombreTipo(e.tipo)}</p>
    <h1>{e.titulo}</h1>
    <p class="subtitulo">{e.subtitulo}</p>
    {#if e.resumen}<p class="capitular">{e.resumen}</p>{/if}
    <dl>
      {#each e.campos.filter((c) => c.texto || c.refs?.length) as c, i (i)}
        <dt>{c.etiqueta}</dt>
        <dd>
          {#if c.texto}<span>{c.texto}</span>{/if}
          {#if c.refs?.length}
            <span class="refs">
              {#each c.refs as r, j (j)}<a href={enlace(r)}>{r.nombre}</a>{j < c.refs.length - 1
                  ? ', '
                  : ''}{/each}
            </span>
          {/if}
        </dd>
      {/each}
    </dl>
    {#if e.nota}<p class="nota">En el vault: <em>{e.nota}</em></p>{/if}
  </article>
{/snippet}

<style>
  .consulta {
    display: grid;
    grid-template-columns: 24rem minmax(0, 1fr);
    gap: 1.5rem;
    padding: 1.5rem;
    align-items: start;
  }
  .buscador {
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 6rem);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .buscador h1 {
    font-size: 2rem;
    margin: 0;
  }
  .buscador input {
    font-size: 1.1em;
    padding: 0.4em 0.6em;
  }
  .tipos {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .tipos button {
    font-size: 0.82em;
    padding: 0.1em 0.6em;
  }
  .tipos button[aria-pressed='true'] {
    border-color: var(--rubrica);
    background: var(--pergamino);
    color: var(--rubrica);
  }
  .n {
    color: var(--tinta-suave);
    font-size: 0.85em;
  }
  .resultados {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow: auto;
  }
  .resultados a {
    display: block;
    padding: 0.3rem 0.5rem;
    border-bottom: 1px dotted var(--borde);
    text-decoration: none;
    color: var(--tinta);
  }
  .resultados a:hover,
  .resultados a[aria-current='true'] {
    background: var(--pergamino-hondo);
  }
  .tipo {
    display: block;
    font-size: 0.82em;
    color: var(--tinta-suave);
  }
  .ficha .folio {
    max-width: 52rem;
  }
  .tipo-ficha {
    margin: 0;
    font-variant: small-caps;
    color: var(--oro);
  }
  .ficha h1 {
    text-align: left;
    font-size: 2.6rem;
  }
  .ficha .subtitulo {
    text-align: left;
  }
  dl {
    display: grid;
    grid-template-columns: minmax(10rem, auto) 1fr;
    gap: 0.4rem 1.2rem;
  }
  dt {
    font-weight: 600;
    color: var(--tinta-suave);
  }
  dd {
    margin: 0;
  }
  .refs {
    display: block;
  }
  .nota {
    margin-top: 1.5rem;
    font-size: 0.9em;
    color: var(--tinta-suave);
  }
  kbd {
    border: 1px solid var(--borde);
    border-radius: 3px;
    padding: 0 0.3em;
    font-family: inherit;
  }
  @media (max-width: 900px) {
    .consulta {
      grid-template-columns: 1fr;
    }
    .buscador {
      position: static;
      max-height: none;
    }
  }
</style>
