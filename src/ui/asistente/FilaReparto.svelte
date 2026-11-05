<script lang="ts">
  // Una habilidad de una lista de cultura o carrera, con sus especialidades y sus puntos.
  import { catalogo } from '../../datos/catalogo';
  import type { ItemHabilidad } from '../../datos/tipos';
  import { nombreHabilidad, valorDe, type ValorHabilidad } from '../../motor/habilidades';
  import { clave, type Fuente, type Personaje } from '../../motor/personaje';
  import Info from '../comunes/Info.svelte';
  import Numero from '../comunes/Numero.svelte';
  import { claveFija, clavesDe, fijar, habilidad, puntos, sugerenciasEspecialidad } from './puntos';

  interface Props {
    p: Personaje;
    item: ItemHabilidad;
    fuente: Fuente;
    hoja: readonly ValorHabilidad[];
    max: number;
    /** Estilos que admite la fila (solo para Estilo de combate). */
    estilos?: string[];
    /** La especialidad del elemento es exactamente la clave (pestaña de adicionales). */
    exacta?: boolean;
  }
  let { p = $bindable(), item, fuente, hoja, max, estilos = [], exacta = false }: Props = $props();

  const h = $derived(habilidad(catalogo, item.habilidad));
  const fija = $derived(
    exacta && item.especialidad
      ? clave(item.habilidad, item.especialidad)
      : claveFija(catalogo, item),
  );
  const claves = $derived(fija ? [fija] : clavesDe(p, fuente, item.habilidad));
  const esEstilo = $derived(item.habilidad === 'estilo-de-combate');
  const fijo = $derived(
    esEstilo && item.especialidad
      ? catalogo.estilos.find((e) => e.nombre.toLowerCase() === item.especialidad!.toLowerCase())
      : undefined,
  );
  // Para la Fuente Mística se proponen las Fuentes que ya tiene el personaje (paso «Magia y fe»).
  const sugerencias = $derived([
    ...new Set([
      ...(item.habilidad === 'fuente-mistica'
        ? p.magia.fuentes.map((f) => f.clave.replace('fuente-mistica:', ''))
        : []),
      ...sugerenciasEspecialidad(catalogo, item),
    ]),
  ]);
  let nueva = $state('');
  const listaId = `esp-${Math.random().toString(36).slice(2, 8)}`;

  function añadir() {
    const esp = esEstilo ? nueva : nueva.trim();
    if (!esp) return;
    const c = clave(item.habilidad, esp);
    if (!puntos(p, fuente, c)) fijar(p, fuente, c, Math.min(max, 5));
    nueva = '';
  }

  const etiqueta = $derived(
    (h?.nombre ?? item.habilidad) +
      (item.especialidad
        ? ` (${item.especialidad})`
        : item.cualquiera
          ? ' (cualquiera)'
          : item.aclaracion
            ? ` (${item.aclaracion})`
            : ''),
  );
</script>

<div class="fila">
  <div class="nombre">
    {etiqueta}
    {#if h}<Info titulo={h.nombre} resumen={h.resumen} nota={h.nota} />{/if}
    <span class="base">{h?.formula}</span>
  </div>
  <div class="claves">
    {#each claves as c (c)}
      <div class="clave">
        <span>{fija ? '' : nombreHabilidad(catalogo, c).replace(`${h?.nombre} `, '')}</span>
        <Numero
          valor={puntos(p, fuente, c)}
          {max}
          etiqueta={nombreHabilidad(catalogo, c)}
          alCambiar={(n) => fijar(p, fuente, c, n)}
        />
        <span class="total">{valorDe(hoja, c) || (h ? '' : '?')}{valorDe(hoja, c) ? '%' : ''}</span>
      </div>
    {/each}
    {#if !fija}
      <div class="añadir">
        {#if esEstilo}
          <select bind:value={nueva} aria-label="Elegir estilo">
            <option value="">Elegir estilo…</option>
            {#each fijo ? [fijo.id] : estilos as e (e)}
              <option value={e}>{catalogo.estilos.find((x) => x.id === e)?.nombre}</option>
            {/each}
          </select>
        {:else}
          <input
            type="text"
            list={listaId}
            bind:value={nueva}
            placeholder="Especialidad"
            aria-label={`Especialidad de ${h?.nombre}`}
            onkeydown={(e) => e.key === 'Enter' && añadir()}
          />
          <datalist id={listaId}
            >{#each sugerencias as s (s)}<option value={s}></option>{/each}</datalist
          >
        {/if}
        <button type="button" onclick={añadir} disabled={!nueva}>Añadir</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .fila {
    display: grid;
    grid-template-columns: minmax(12rem, 1fr) minmax(16rem, 1.4fr);
    gap: 0.5rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid var(--borde);
  }
  .base {
    font-size: 0.8em;
    color: var(--tinta-suave);
    margin-left: 0.3rem;
  }
  .clave,
  .añadir {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.1rem 0;
  }
  .clave > span:first-child {
    min-width: 6rem;
    font-style: italic;
  }
  .total {
    min-width: 3rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--rubrica);
  }
  .añadir input,
  .añadir select {
    max-width: 12rem;
  }
</style>
