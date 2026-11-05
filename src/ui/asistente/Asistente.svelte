<script lang="ts">
  // Busca el personaje en la biblioteca y abre el editor (o avisa si no está).
  import { biblioteca } from '../../almacen/biblioteca.svelte';
  import Editor from './Editor.svelte';
  import Juego from '../juego/Juego.svelte';
  import Mejora from '../juego/Mejora.svelte';

  interface Props {
    id: string;
    paso: string;
  }
  let { id, paso }: Props = $props();
  const original = $derived(biblioteca.obtener(id));
</script>

{#if original}
  {#key `${id}-${paso === 'juego' || paso === 'mejora' ? paso : 'editor'}`}
    {#if paso === 'juego'}<Juego {original} />
    {:else if paso === 'mejora'}<Mejora {original} />
    {:else}<Editor {original} {paso} />{/if}
  {/key}
{:else}
  <article class="folio">
    <h1>Personaje no encontrado</h1>
    <p>
      Este personaje no está en la biblioteca de este navegador.
      <a href="#/">Volver a mis personajes</a>.
    </p>
  </article>
{/if}
