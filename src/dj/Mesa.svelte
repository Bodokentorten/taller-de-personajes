<script lang="ts">
  // Mesa del DJ: solo existe en la edición del DJ (npm run dev:dj / build:dj).
  import { datosDJ } from './datos';
  import EditorCampaña from './EditorCampaña.svelte';
  import GeneradorPNJ from './GeneradorPNJ.svelte';
  import RevisionFichas from './RevisionFichas.svelte';

  type Pestaña = 'pnj' | 'fichas' | 'campaña';
  let pestaña = $state<Pestaña>('pnj');
  const PESTAÑAS: { id: Pestaña; nombre: string }[] = [
    { id: 'pnj', nombre: 'Generador de PNJ' },
    { id: 'fichas', nombre: 'Revisión de fichas' },
    { id: 'campaña', nombre: 'Campaña' },
  ];
</script>

<article class="folio mesa" data-centinela={datosDJ.centinela}>
  <h1>Mesa del DJ</h1>
  <p class="subtitulo">Solo en tu ordenador: esta edición no se publica.</p>
  <div class="pestañas" role="tablist">
    {#each PESTAÑAS as t (t.id)}
      <button role="tab" aria-selected={pestaña === t.id} onclick={() => (pestaña = t.id)}
        >{t.nombre}</button
      >
    {/each}
  </div>
  {#if pestaña === 'pnj'}<GeneradorPNJ />
  {:else if pestaña === 'fichas'}<RevisionFichas />
  {:else}<EditorCampaña />{/if}
</article>

<style>
  .mesa {
    max-width: 90rem;
  }
  .pestañas {
    display: flex;
    gap: 0.4rem;
    border-bottom: 1px solid var(--borde);
    margin: 1rem 0;
  }
  .pestañas button[aria-selected='true'] {
    border-color: var(--rubrica);
    color: var(--rubrica);
    font-weight: 600;
  }
</style>
