<script lang="ts">
  import { catalogo } from '../../datos/catalogo';
  import { CARACTERISTICAS, type Caracteristica } from '../../datos/tipos';
  import { puntosGastados, tirarCaracteristicas } from '../../motor/caracteristicas';
  import type { MetodoCaracteristicas, Personaje } from '../../motor/personaje';
  import Numero from '../comunes/Numero.svelte';

  let { p = $bindable() }: { p: Personaje } = $props();

  const compra = catalogo.reglas.compra_caracteristicas;
  const NOMBRES: Record<Caracteristica, string> = {
    FUE: 'Fuerza',
    CON: 'Constitución',
    TAM: 'Tamaño',
    DES: 'Destreza',
    INT: 'Inteligencia',
    POD: 'Poder',
    CAR: 'Carisma',
  };
  const gastados = $derived(puntosGastados(p.caracteristicas.valores));
  const metodo = $derived(p.caracteristicas.metodo);

  function cambiarMetodo(m: MetodoCaracteristicas) {
    p.caracteristicas.metodo = m;
    if (m !== 'tirada') p.caracteristicas.tiradas = undefined;
  }

  function tirar() {
    const t = tirarCaracteristicas(catalogo.reglas);
    p.caracteristicas = { metodo: 'tirada', valores: t.valores, tiradas: t.tiradas };
  }
</script>

<p>
  Las siete características definen el cuerpo y el alma del personaje. Elige cómo se obtienen; la
  campaña puede limitarlo.
</p>

<fieldset class="metodos">
  <legend>Método</legend>
  <label
    ><input type="radio" checked={metodo === 'compra'} onchange={() => cambiarMetodo('compra')} />
    Compra de {compra.puntos} puntos</label
  >
  <label
    ><input type="radio" checked={metodo === 'tirada'} onchange={() => cambiarMetodo('tirada')} /> Tirada
    de dados</label
  >
  <label
    ><input type="radio" checked={metodo === 'manual'} onchange={() => cambiarMetodo('manual')} /> Introducción
    manual</label
  >
</fieldset>

{#if metodo === 'compra'}
  <p class={gastados === compra.puntos ? 'cuenta' : 'cuenta pendiente'}>
    Puntos repartidos: <strong>{gastados}</strong> de {compra.puntos}
    {#if gastados !== compra.puntos}({gastados < compra.puntos
        ? `faltan ${compra.puntos - gastados}`
        : `sobran ${gastados - compra.puntos}`}){/if}
  </p>
{:else if metodo === 'tirada'}
  <p>
    <button type="button" onclick={tirar}>🎲 Tirar las características</button>
    3d6 para FUE, CON, DES, POD y CAR; 2d6+6 para TAM e INT. Cada tirada queda registrada en la ficha.
  </p>
{:else}
  <p class="cuenta pendiente">Valores introducidos a mano: el DJ tendrá que darlos por buenos.</p>
{/if}

<table class="tabla-car">
  <thead
    ><tr
      ><th>Característica</th><th>Valor</th><th>Rango</th>{#if metodo === 'tirada'}<th>Tirada</th
        >{/if}</tr
    ></thead
  >
  <tbody>
    {#each CARACTERISTICAS as c (c)}
      {@const [min, max] = compra.rangos[c]}
      <tr>
        <th scope="row">{NOMBRES[c]} <abbr>({c})</abbr></th>
        <td>
          {#if metodo === 'tirada'}
            <strong>{p.caracteristicas.valores[c]}</strong>
          {:else}
            <Numero
              valor={p.caracteristicas.valores[c]}
              min={metodo === 'manual' ? 1 : min}
              max={metodo === 'manual' ? 40 : max}
              etiqueta={c}
              alCambiar={(v) => (p.caracteristicas.valores[c] = v)}
            />
          {/if}
        </td>
        <td class="rango">{compra.tiradas[c]} ({min}–{max})</td>
        {#if metodo === 'tirada'}
          {@const t = p.caracteristicas.tiradas?.[c]}
          <td class="rango"
            >{t ? `${t.dados.join(' + ')}${t.modificador ? ` + ${t.modificador}` : ''}` : '—'}</td
          >
        {/if}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .metodos {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  .cuenta {
    font-size: 1.1em;
  }
  .pendiente {
    color: var(--rubrica);
  }
  .tabla-car {
    border-collapse: collapse;
    margin-top: 1rem;
  }
  .tabla-car th,
  .tabla-car td {
    padding: 0.35rem 0.8rem;
    border-bottom: 1px solid var(--borde);
    text-align: left;
  }
  .rango {
    color: var(--tinta-suave);
    font-size: 0.9em;
  }
</style>
