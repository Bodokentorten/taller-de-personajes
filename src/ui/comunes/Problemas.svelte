<script lang="ts">
  import type { Problema } from '../../motor/resultado';

  interface Props {
    problemas: readonly Problema[];
    vacio?: string;
  }
  let { problemas, vacio = '' }: Props = $props();
</script>

{#if problemas.length}
  <ul class="problemas">
    {#each problemas as x, i (i)}
      <li class={x.gravedad}>
        <span class="marca" aria-hidden="true">{x.gravedad === 'error' ? '✗' : '!'}</span>
        <span class="visualmente-oculto">{x.gravedad === 'error' ? 'Error:' : 'Aviso:'}</span>
        {x.mensaje}
      </li>
    {/each}
  </ul>
{:else if vacio}
  <p class="vacio">✓ {vacio}</p>
{/if}

<style>
  .problemas {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
  }
  li {
    padding: 0.25rem 0.5rem;
    margin: 0.2rem 0;
    border-left: 3px solid var(--borde);
    font-size: 0.95em;
  }
  li.error {
    border-color: var(--rubrica);
  }
  li.aviso {
    border-color: var(--oro);
  }
  .marca {
    font-weight: 600;
    margin-right: 0.3rem;
  }
  .error .marca {
    color: var(--rubrica);
  }
  .aviso .marca {
    color: var(--oro);
  }
  .vacio {
    color: var(--tinta-suave);
    font-style: italic;
  }
</style>
