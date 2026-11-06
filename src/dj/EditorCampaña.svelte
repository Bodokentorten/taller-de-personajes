<script lang="ts">
  // Editor del archivo de campaña, con enlace para compartir con los jugadores.
  import { descargar } from '../almacen/biblioteca.svelte';
  import { codificarCampaña, serializarCampaña } from '../almacen/campaña';
  import { campaña } from '../almacen/campaña.svelte';
  import { catalogo } from '../datos/catalogo';
  import type { Campaña } from '../motor/personaje';

  /** Dirección pública de la edición de jugador (GitHub Pages). */
  const URL_PUBLICA = 'https://bodokentorten.github.io/taller-de-personajes/';

  let c = $state<Campaña>(structuredClone($state.snapshot(campaña.actual) as Campaña));
  let mensaje = $state('');
  const enlace = $derived(
    `${URL_PUBLICA}#/campana/${codificarCampaña($state.snapshot(c) as Campaña)}`,
  );

  function alternar(lista: 'carrerasPermitidas' | 'pueblosPermitidos', id: string) {
    const actual = c[lista] ?? [];
    c[lista] = actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id];
  }
  function alternarMetodo<K extends 'metodosHabilidades' | 'metodosCaracteristicas'>(
    k: K,
    m: Campaña[K][number],
  ) {
    const l = c[k] as string[];
    const nueva = l.includes(m) ? l.filter((x) => x !== m) : [...l, m];
    if (nueva.length) (c[k] as string[]) = nueva;
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      mensaje = 'Enlace copiado: envíaselo a los jugadores.';
    } catch {
      mensaje = 'No se ha podido copiar; selecciona el enlace a mano.';
    }
  }
</script>

<div class="campos">
  <label
    >Nombre de la campaña <input
      type="text"
      bind:value={c.nombre}
      placeholder="La sombra del Temple"
    /></label
  >
  <label>Año <input type="number" min="1300" max="1400" bind:value={c.año} class="corto" /></label>
</div>

<fieldset>
  <legend>Métodos</legend>
  <span>Características:</span>
  {#each [['compra', 'compra de 80'], ['tirada', 'tirada'], ['manual', 'manual']] as [m, n] (m)}
    <label
      ><input
        type="checkbox"
        checked={c.metodosCaracteristicas.includes(m as 'compra')}
        onchange={() => alternarMetodo('metodosCaracteristicas', m as 'compra')}
      />
      {n}</label
    >
  {/each}
  <br />
  <span>Habilidades:</span>
  {#each [['estandar', 'estándar'], ['piramide', 'pirámide']] as [m, n] (m)}
    <label
      ><input
        type="checkbox"
        checked={c.metodosHabilidades.includes(m as 'estandar')}
        onchange={() => alternarMetodo('metodosHabilidades', m as 'estandar')}
      />
      {n}</label
    >
  {/each}
</fieldset>

<fieldset>
  <legend>Reglas opcionales</legend>
  <label><input type="checkbox" bind:checked={c.permitirMagia} /> Los PJ pueden usar magia</label>
  <label
    ><input type="checkbox" bind:checked={c.restriccionesSexo} /> Restricciones de sexo de las carreras
    (Sesión 0)</label
  >
  <label><input type="checkbox" bind:checked={c.hidalguiaVasca} /> Hidalguía universal vasca</label>
  <label
    ><input type="checkbox" bind:checked={c.repetirTrasfondo} /> Se pueden repetir las tiradas de trasfondo</label
  >
</fieldset>

<details>
  <summary>Pueblos permitidos ({c.pueblosPermitidos?.length || 'todos'})</summary>
  <div class="lista">
    {#each catalogo.pueblos as x (x.id)}
      <label
        ><input
          type="checkbox"
          checked={c.pueblosPermitidos?.includes(x.id) ?? false}
          onchange={() => alternar('pueblosPermitidos', x.id)}
        />
        {x.nombre}</label
      >
    {/each}
  </div>
  <p class="detalle">Si no marcas ninguno, se permiten todos.</p>
</details>
<details>
  <summary>Carreras permitidas ({c.carrerasPermitidas?.length || 'todas'})</summary>
  <div class="lista">
    {#each catalogo.carreras as x (x.id)}
      <label
        ><input
          type="checkbox"
          checked={c.carrerasPermitidas?.includes(x.id) ?? false}
          onchange={() => alternar('carrerasPermitidas', x.id)}
        />
        {x.nombre}</label
      >
    {/each}
  </div>
  <p class="detalle">Si no marcas ninguna, se permiten todas.</p>
</details>

<h2>Compartir</h2>
<p class="enlace"><code>{enlace}</code></p>
<div class="acciones">
  <button class="principal" onclick={copiar}>Copiar enlace para los jugadores</button>
  <button
    onclick={() => descargar('campaña.json', serializarCampaña($state.snapshot(c) as Campaña))}
    >Descargar campaña.json</button
  >
  <button
    onclick={() => {
      campaña.fijar($state.snapshot(c) as Campaña);
      mensaje = 'Aplicada en este navegador (también para la revisión de fichas).';
    }}>Usar aquí</button
  >
</div>
{#if mensaje}<p class="mensaje" role="status">{mensaje}</p>{/if}

<style>
  fieldset {
    margin: 0.8rem 0;
  }
  fieldset label {
    margin-right: 1rem;
  }
  fieldset span {
    margin-right: 0.6rem;
    color: var(--tinta-suave);
  }
  .lista {
    columns: 3;
    margin: 0.5rem 0;
  }
  .lista label {
    display: block;
  }
  .enlace code {
    word-break: break-all;
    font-size: 0.85em;
  }
  .acciones {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .mensaje {
    border-left: 3px solid var(--oro);
    padding-left: 0.6rem;
  }
</style>
