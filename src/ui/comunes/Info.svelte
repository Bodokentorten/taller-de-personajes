<script lang="ts">
  // Ficha emergente con el resumen de una entrada de los catálogos de jugador.
  import type { Snippet } from 'svelte';

  interface Props {
    titulo: string;
    resumen?: string;
    nota?: string;
    children?: Snippet;
  }
  let { titulo, resumen = '', nota, children }: Props = $props();
  const id = `info-${Math.random().toString(36).slice(2, 9)}`;
</script>

<button
  type="button"
  class="info"
  popovertarget={id}
  aria-label={`Más sobre ${titulo}`}
  title={`Más sobre ${titulo}`}>?</button
>
<div {id} popover class="ficha-emergente">
  <h3>{titulo}</h3>
  {#if resumen}<p>{resumen}</p>{/if}
  {@render children?.()}
  {#if nota}<p class="nota">En el vault: <em>{nota}</em></p>{/if}
  <button type="button" popovertarget={id} popovertargetaction="hide">Cerrar</button>
</div>

<style>
  .info {
    padding: 0 0.45em;
    border-radius: 50%;
    font-size: 0.8em;
    line-height: 1.4;
    margin-left: 0.3em;
    color: var(--rubrica);
    vertical-align: middle;
  }
  .ficha-emergente {
    max-width: 34rem;
    padding: 1.2rem 1.5rem;
    border: 1px solid var(--borde);
    outline: 1px solid var(--borde);
    outline-offset: 4px;
    background: var(--pergamino);
    color: var(--tinta);
    box-shadow: 0 8px 30px var(--sombra);
  }
  .ficha-emergente::backdrop {
    background: rgb(0 0 0 / 0.25);
  }
  h3 {
    margin-top: 0;
  }
  .nota {
    font-size: 0.85em;
    color: var(--tinta-suave);
  }
</style>
