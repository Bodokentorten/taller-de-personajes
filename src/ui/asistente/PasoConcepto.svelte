<script lang="ts">
  import { catalogo } from '../../datos/catalogo';
  import type { Personaje } from '../../motor/personaje';
  import SugerirNombre from './SugerirNombre.svelte';

  let { p = $bindable() }: { p: Personaje } = $props();
</script>

<p class="capitular">
  Antes de tirar dados, piensa quién es: qué hace en la vida, de dónde viene y qué le empuja a los
  caminos. Un hidalgo segundón sin herencia, una partera judía de Toledo, un almogávar que ya no
  tiene guerra…
</p>

<div class="campos">
  <label>
    Nombre
    <input type="text" bind:value={p.nombre} placeholder="Rodrigo Pérez de Burgos" />
  </label>
  <SugerirNombre bind:p />

  <fieldset>
    <legend>Sexo</legend>
    <label><input type="radio" bind:group={p.sexo} value="varon" /> Varón</label>
    <label><input type="radio" bind:group={p.sexo} value="mujer" /> Mujer</label>
  </fieldset>

  <label>
    Edad
    <select bind:value={p.categoriaEdad}>
      {#each catalogo.reglas.edades as e (e.id)}
        <option value={e.id}
          >{e.categoria} ({e.edad} años · {e.puntos} puntos adicionales, hasta +{e.max_incremento})</option
        >
      {/each}
    </select>
  </label>
  <label>
    Años
    <input type="number" min="10" max="99" bind:value={p.edad} placeholder="—" class="corto" />
  </label>

  <label class="ancho">
    Concepto
    <input
      type="text"
      bind:value={p.concepto}
      placeholder="Escudero castellano que busca recuperar la honra de su linaje"
    />
  </label>
  <label class="ancho">
    Aspecto y carácter
    <textarea rows="3" bind:value={p.aspecto}></textarea>
  </label>
</div>
