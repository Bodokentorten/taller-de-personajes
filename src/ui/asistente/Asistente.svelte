<script lang="ts">
  // Busca el personaje en la biblioteca y abre el editor (o avisa si no está).
  import { biblioteca } from '../../almacen/biblioteca.svelte';
  import Editor from './Editor.svelte';

  interface Props {
    id: string;
    paso: string;
  }
  let { id, paso }: Props = $props();
  const original = $derived(biblioteca.obtener(id));
</script>

{#if original}
  {#key id}<Editor {original} {paso} />{/key}
{:else}
  <article class="folio">
    <h1>Personaje no encontrado</h1>
    <p>
      Este personaje no está en la biblioteca de este navegador.
      <a href="#/">Volver a mis personajes</a>.
    </p>
  </article>
{/if}
