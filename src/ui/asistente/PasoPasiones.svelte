<script lang="ts">
  import { catalogo } from '../../datos/catalogo';
  import type { Hoja } from '../../motor/hoja';
  import { BONO_PASION, MAX_PASIONES, tipoFe } from '../../motor/pasiones';
  import type { Pasion, Personaje } from '../../motor/personaje';
  import Numero from '../comunes/Numero.svelte';

  let { p = $bindable(), hoja }: { p: Personaje; hoja: Hoja } = $props();

  const tipos = catalogo.reglas.pasiones;
  const credo = $derived(catalogo.credos.find((c) => c.id === p.origen.credo));
  const cultura = $derived(catalogo.culturas.find((c) => c.id === p.origen.cultura));
  const pueblo = $derived(catalogo.pueblos.find((x) => x.id === p.origen.pueblo));
  const sugeridas = $derived([
    ...(pueblo?.pasiones_sugeridas ?? []),
    ...(cultura?.pasiones_sugeridas ?? []),
  ]);
  const usaSujeto = (x: Pasion) => tipos[x.tipo]?.formula.includes('SUJETO');

  function siguienteOrden(): 1 | 2 | 3 {
    const usados = new Set(p.pasiones.map((x) => x.orden));
    return ([1, 2, 3] as const).find((o) => !usados.has(o)) ?? 3;
  }

  function añadir(nombre = '', fe = false) {
    if (p.pasiones.length >= MAX_PASIONES) return;
    p.pasiones = [
      ...p.pasiones,
      {
        nombre,
        tipo: fe ? tipoFe(catalogo) : 3,
        orden: siguienteOrden(),
        ...(fe ? { fe: true } : {}),
      },
    ];
  }
</script>

<p>
  Hasta tres Pasiones: la más importante recibe +{BONO_PASION[1]}, la segunda +{BONO_PASION[2]} y la tercera
  +{BONO_PASION[3]}, sobre el valor que da su tipo. La <strong>Fe</strong> es casi universal: sin ella
  no se resiste lo sobrenatural ni se obran rituales.
</p>

{#if credo && !p.pasiones.some((x) => x.fe) && p.pasiones.length < MAX_PASIONES}
  <p>
    <button type="button" onclick={() => añadir(credo.pasion_fe, true)}
      >Añadir la Pasión {credo.pasion_fe}</button
    >
  </p>
{/if}

{#each p.pasiones as x, i (i)}
  <fieldset class="pasion">
    <legend>Pasión {i + 1}{x.fe ? ' · Fe' : ''}</legend>
    <label class="ancho"
      >Nombre <input
        type="text"
        bind:value={x.nombre}
        placeholder="Lealtad (Don Íñigo, su señor)"
      /></label
    >
    <label>
      Tipo
      <select bind:value={x.tipo} disabled={x.fe}>
        {#each tipos as t, j (j)}<option value={j}>{t.objeto} — {t.base}</option>{/each}
      </select>
    </label>
    <label>
      Importancia
      <select bind:value={x.orden}>
        {#each [1, 2, 3] as o (o)}<option value={o}>{o}.ª (+{BONO_PASION[o as 1 | 2 | 3]})</option
          >{/each}
      </select>
    </label>
    {#if usaSujeto(x)}
      <span class="sujeto">
        Sujeto: POD
        <Numero
          valor={x.sujeto?.POD ?? 0}
          min={0}
          max={30}
          etiqueta="POD del sujeto"
          alCambiar={(v) => (x.sujeto = { ...x.sujeto, POD: v })}
        />
        CAR
        <Numero
          valor={x.sujeto?.CAR ?? 0}
          min={0}
          max={30}
          etiqueta="CAR del sujeto"
          alCambiar={(v) => (x.sujeto = { ...x.sujeto, CAR: v })}
        />
      </span>
    {/if}
    <span class="valor">{hoja.pasiones[i]?.valor ?? '?'}%</span>
    <button
      type="button"
      class="quitar"
      onclick={() => (p.pasiones = p.pasiones.filter((_, j) => j !== i))}>Quitar</button
    >
  </fieldset>
{/each}

{#if p.pasiones.length < MAX_PASIONES}
  <p><button type="button" onclick={() => añadir()}>Añadir una Pasión</button></p>
{/if}

{#if sugeridas.length}
  <h2>Sugeridas por su origen</h2>
  <ul class="sugeridas">
    {#each sugeridas as s, i (i)}
      <li>
        {s}
        {#if p.pasiones.length < MAX_PASIONES}<button
            type="button"
            onclick={() => añadir(s.replace(/\.$/, ''))}>Usar</button
          >{/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .pasion {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1.2rem;
    align-items: end;
    margin: 0.8rem 0;
  }
  .ancho {
    flex: 1 1 100%;
  }
  .ancho input {
    width: 100%;
  }
  .sujeto {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
  }
  .valor {
    font-family: var(--letra-titulo);
    font-size: 1.4rem;
    color: var(--rubrica);
  }
  .quitar {
    margin-left: auto;
  }
  .sugeridas button {
    font-size: 0.8em;
    padding: 0 0.5em;
  }
</style>
