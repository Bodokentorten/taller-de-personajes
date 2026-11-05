<script lang="ts">
  // Sugerencias de nombre de la Nomina, según el pueblo y el sexo.
  import { catalogo } from '../../datos/catalogo';
  import type { Personaje } from '../../motor/personaje';

  let { p = $bindable() }: { p: Personaje } = $props();

  const pueblo = $derived(catalogo.pueblos.find((x) => x.id === p.origen.pueblo));
  const grupo = $derived(catalogo.nomina.find((g) => g.id === pueblo?.nomina));
  const lista = $derived(
    grupo ? (p.sexo === 'mujer' ? grupo.mujeres : p.sexo === 'varon' ? grupo.varones : []) : [],
  );
  let sugeridos = $state<string[]>([]);

  function sugerir() {
    const copia = [...lista];
    sugeridos = Array.from(
      { length: Math.min(5, copia.length) },
      () => copia.splice(Math.floor(Math.random() * copia.length), 1)[0]!,
    );
  }
</script>

<div class="sugerir">
  {#if !grupo}
    <span class="nota">Elige el pueblo (paso «Origen») para ver nombres de la Nomina.</span>
  {:else if !p.sexo}
    <span class="nota">Indica el sexo para ver nombres de la Nomina.</span>
  {:else}
    <button type="button" onclick={sugerir}>🎲 Nombres {grupo.nombre.toLowerCase()}</button>
    {#each sugeridos as n (n)}
      <button
        type="button"
        class="nombre"
        onclick={() =>
          (p.nombre = p.nombre.includes(' ')
            ? `${n} ${p.nombre.split(' ').slice(1).join(' ')}`
            : n)}>{n}</button
      >
    {/each}
    {#if grupo.costumbre && sugeridos.length}<p class="nota">{grupo.costumbre}</p>{/if}
  {/if}
</div>

<style>
  .sugerir {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
    grid-column: 1 / -1;
  }
  .nombre {
    font-style: italic;
  }
  .nota {
    color: var(--tinta-suave);
    font-size: 0.9em;
    margin: 0;
    width: 100%;
  }
</style>
