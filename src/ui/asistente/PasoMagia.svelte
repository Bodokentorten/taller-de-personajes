<script lang="ts">
  import { catalogo } from '../../datos/catalogo';
  import {
    fuentesPara,
    ORIGENES_FUENTE,
    TIPOS_FUENTE,
    totalTiradasCorrupcion,
    UMBRAL_RANGO,
  } from '../../motor/magia';
  import type { OrigenFuente, TipoFuente } from '../../datos/tipos';
  import { ORDINES } from '../../motor/fe';
  import type { Hoja } from '../../motor/hoja';
  import { enlacePaso } from '../ruta.svelte';
  import type { Personaje } from '../../motor/personaje';
  import Info from '../comunes/Info.svelte';

  let { p = $bindable(), hoja }: { p: Personaje; hoja: Hoja } = $props();

  const carrera = $derived(catalogo.carreras.find((c) => c.id === p.carrera));
  let filtro = $state('');
  let soloLanzables = $state(true);
  let nombreFuente = $state('');
  let dominiosFuente = $state<string[]>([]);
  let origenFuente = $state<OrigenFuente>('maestro');
  let tipoFuente = $state<TipoFuente>('mixta');
  let goeticaFuente = $state(false);
  const nombreTipo = (t: TipoFuente) => TIPOS_FUENTE.find((x) => x.id === t)?.nombre ?? t;
  const nombreOrigen = (o: OrigenFuente) => ORIGENES_FUENTE.find((x) => x.id === o)?.nombre ?? o;
  const origenesPropios = ORIGENES_FUENTE.filter((o) => o.id !== 'grimorio');
  const tiradasCorrupcion = $derived(totalTiradasCorrupcion(hoja.magia));
  const DOMINIOS = [...new Set(catalogo.formulas.flatMap((f) => f.dominios))].sort();

  const formulas = $derived(
    catalogo.formulas.filter(
      (f) =>
        (!soloLanzables ||
          fuentesPara(f, hoja.magia).length > 0 ||
          p.magia.formulas.includes(f.id)) &&
        (!filtro || `${f.nombre} ${f.resumen}`.toLowerCase().includes(filtro.toLowerCase())),
    ),
  );

  function añadirGrimorio(id: string) {
    const g = catalogo.grimorios.find((x) => x.id === id);
    if (!g || p.magia.fuentes.some((f) => f.grimorio === id)) return;
    p.magia.fuentes = [
      ...p.magia.fuentes,
      { clave: `fuente-mistica:${g.nombre}`, grimorio: g.id, nombre: g.nombre, dominios: [] },
    ];
  }

  function añadirPropia() {
    const n = nombreFuente.trim();
    if (!n || !dominiosFuente.length) return;
    p.magia.fuentes = [
      ...p.magia.fuentes,
      {
        clave: `fuente-mistica:${n}`,
        nombre: n,
        dominios: [...dominiosFuente],
        origen: origenFuente,
        tipo: origenFuente === 'linaje' ? 'filosofica' : tipoFuente,
        goetica: goeticaFuente,
      },
    ];
    nombreFuente = '';
    dominiosFuente = [];
    goeticaFuente = false;
  }

  function alternar(id: string) {
    p.magia.formulas = p.magia.formulas.includes(id)
      ? p.magia.formulas.filter((x) => x !== id)
      : [...p.magia.formulas, id];
  }
</script>

{#if carrera?.magia}
  <aside class="callout">
    <strong>Ojo con la Inquisición.</strong> La magia es real, pero también lo son la Iglesia y sus
    tribunales. Es <em>goecia</em> todo lo que se lanza con una fuente goética, las fórmulas de goecia
    y los hechizos con actos atroces: usarla condena el alma. Estudiar una fuente goética o aprender goecia
    corrompe (tiradas de Fuerza de voluntad).
  </aside>

  <h2>Fuentes Místicas</h2>
  <p>
    Cada Fuente es una habilidad que empieza en 0% y sube con los puntos de carrera y adicionales
    (paso
    <a href={enlacePaso(p.id, 'habilidades')}>Habilidades</a>, «Fuente Mística»). Su % de estudio
    decide qué Rango de fórmulas puede lanzar. Con una fuente filosófica o mixta también puede
    <strong>improvisar</strong> (magia espontánea), hasta el menor entre su estudio y su
    Conocimiento (Ocultismo) {hoja.magia.ocultismo}% (en un linaje, su Fuerza de voluntad {hoja
      .magia.fuerzaVoluntad}%).
  </p>
  <ul>
    {#each hoja.magia.fuentes as f, i (f.clave)}
      <li>
        <strong>{f.nombre}</strong> — {f.dominios.join(', ')} · estudio {f.valor}%
        <span class="detalle"
          >· {nombreOrigen(f.origen)} · {nombreTipo(f.tipo)}{f.improvisa
            ? ` · improvisa hasta ${f.techo}% (${f.techoPor})`
            : ' · no improvisa'}</span
        >{#if f.goetica}
          <span class="goecia" title="Fuente goética: todo lo que se lance con ella es goecia"
            >✠ goética</span
          >{/if}
        {#if f.grimorio && catalogo.grimorios.find((g) => g.id === f.grimorio)?.variante_goetica}
          <label
            ><input
              type="checkbox"
              checked={Boolean(p.magia.fuentes[i]?.versionGoetica)}
              onchange={(e) =>
                (p.magia.fuentes[i]!.versionGoetica = (
                  e.currentTarget as HTMLInputElement
                ).checked)}
            />
            {catalogo.grimorios.find((g) => g.id === f.grimorio)?.variante_goetica} (goética)</label
          >
        {/if}
        <button
          type="button"
          onclick={() => (p.magia.fuentes = p.magia.fuentes.filter((_, j) => j !== i))}
          >Quitar</button
        >
      </li>
    {/each}
  </ul>
  <div class="añadir">
    <label>
      Grimorio
      <select
        onchange={(e) => {
          añadirGrimorio((e.currentTarget as HTMLSelectElement).value);
          (e.currentTarget as HTMLSelectElement).value = '';
        }}
      >
        <option value="">Añadir un grimorio…</option>
        {#each catalogo.grimorios.filter((g) => g.estudiable) as g (g.id)}<option value={g.id}
            >{g.nombre} ({g.dominios.join(', ')}; hasta {g.estudio_maximo}%; {nombreTipo(
              g.tipo_fuente ?? 'mixta',
            ).toLowerCase()}{g.fuente_goetica ? '; goético' : ''})</option
          >{/each}
      </select>
    </label>
  </div>
  <details>
    <summary>Otra Fuente (un maestro, un pacto, un objeto o lugar, un linaje)</summary>
    <div class="añadir">
      <input type="text" bind:value={nombreFuente} placeholder="Saber de la tía Remedios" />
      <label
        >Origen
        <select bind:value={origenFuente}
          >{#each origenesPropios as o (o.id)}<option value={o.id}>{o.nombre}</option
            >{/each}</select
        >
      </label>
      {#if origenFuente !== 'linaje'}
        <label
          >Tipo
          <select bind:value={tipoFuente}
            >{#each TIPOS_FUENTE as x (x.id)}<option value={x.id}>{x.nombre} ({x.detalle})</option
              >{/each}</select
          >
        </label>
      {/if}
      <label
        ><input type="checkbox" bind:checked={goeticaFuente} /> Goética (nace del Infierno o del mal)</label
      >
      {#each DOMINIOS as d (d)}<label
          ><input type="checkbox" bind:group={dominiosFuente} value={d} /> {d}</label
        >{/each}
      <button
        type="button"
        onclick={añadirPropia}
        disabled={!nombreFuente.trim() || !dominiosFuente.length}>Añadir</button
      >
    </div>
    <p class="detalle">
      {#if origenFuente === 'linaje'}Linaje: sólo al crear el personaje; un dominio (dos con permiso
        del DJ), Estudio Máximo POD × 3, se estudia con Fuerza de voluntad y siempre es filosófica.
      {:else if origenFuente === 'maestro'}Maestro: el Estudio Máximo es el % del maestro en su
        propia fuente; sus dominios y parámetros son los suyos.
      {:else if origenFuente === 'pacto'}Pacto: Estudio Máximo POD de la entidad × 3; cada Rango
        nuevo tiene un precio y la entidad puede retirar su favor.
      {:else}Objeto o lugar: el DJ fija el Estudio Máximo (40–90%); fuera del lugar se lanza con la
        mitad.
      {/if}
      Véase «Fuentes Místicas de los reinos».
    </p>
  </details>

  {#if tiradasCorrupcion > 0}
    <h3>Corrupción inicial</h3>
    <p>
      Tira <strong>Fuerza de voluntad ({hoja.magia.fuerzaVoluntad}%)</strong>
      {tiradasCorrupcion}
      {tiradasCorrupcion === 1 ? 'vez' : 'veces'}; cada fallo es 1 punto de Corrupción (−1 POD
      permanente; anótalo en la ficha).
    </p>
    <ul>
      {#each hoja.magia.tiradasCorrupcion as x (x.motivo)}<li>
          {x.motivo}: {x.tiradas}
          {x.tiradas === 1 ? 'tirada' : 'tiradas'}
        </li>{/each}
    </ul>
    <label
      >Fallos (Corrupción inicial)
      <input
        type="number"
        min="0"
        max={tiradasCorrupcion}
        bind:value={p.magia.corrupcionInicial}
        class="corto"
      />
    </label>
  {/if}

  <p>
    <a href={`#/hechizos/${encodeURIComponent(p.id)}`}>Calculadora de hechizos</a>: la dificultad de
    sus fórmulas según la zona, y la de cualquier hechizo espontáneo.
  </p>

  <h2>Fórmulas iniciales</h2>
  <p>
    Con Conocimiento (Ocultismo) {hoja.magia.ocultismo}% empieza con
    <strong>{hoja.magia.formulasPermitidas}</strong> fórmulas{hoja.magia.formulasAzar
      ? ` (o ${hoja.magia.formulasAzar} al azar, si se decide antes de tirar)`
      : ''}. Elegidas: {p.magia.formulas.length}. El mago se define por su fuente: las fórmulas son
    un complemento seguro (sin Reatracción salvo con pifia).
    <label><input type="checkbox" bind:checked={p.magia.formulasAlAzar} /> Las tiré al azar</label>
  </p>
  <div class="filtros">
    <input type="search" bind:value={filtro} placeholder="Buscar fórmula…" />
    <label
      ><input type="checkbox" bind:checked={soloLanzables} /> Solo las que puede lanzar con sus Fuentes</label
    >
  </div>
  <table class="tabla">
    <thead
      ><tr><th></th><th>Fórmula</th><th>Vis</th><th>Rango</th><th>Dominios</th><th>Forma</th></tr
      ></thead
    >
    <tbody>
      {#each formulas as f (f.id)}
        <tr class:elegida={p.magia.formulas.includes(f.id)}>
          <td
            ><input
              type="checkbox"
              checked={p.magia.formulas.includes(f.id)}
              onchange={() => alternar(f.id)}
              aria-label={f.nombre}
            /></td
          >
          <td
            >{f.nombre}{#if f.goecia}
              <span class="goecia" title="Goecia: condena el alma">✠</span>{/if}<Info
              titulo={f.nombre}
              resumen={f.resumen}
              nota={f.nota}
            /></td
          >
          <td>{f.vis}</td>
          <td>{f.rango} <span class="detalle">({UMBRAL_RANGO[f.rango]}%)</span></td>
          <td>{f.dominios.join(' + ')}</td>
          <td>{f.forma}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  {#if formulas.length === 0}<p class="detalle">
      Ninguna fórmula encaja: añade una Fuente y súbele el estudio.
    </p>{/if}
{/if}

{#if carrera?.fe}
  <h2>Fe y rituales</h2>
  <p>
    Fe {hoja.fe.fe}% → <strong>{hoja.fe.pf} PF</strong>. Conocimiento (Teología) {hoja.fe
      .teologia}%.
    {#if hoja.fe.puedeObrar}
      Conoce los rituales hasta el <strong
        >{ORDINES[hoja.fe.ordoMaximo - 1]?.nombre ?? '— (ninguno)'}</strong
      >.
    {:else}
      Aún no puede obrar rituales (hace falta Fe 50% y no conocer goecia ni estudiar una fuente
      goética).
    {/if}
  </p>
  <table class="tabla">
    <thead><tr><th>Ordo</th><th>PF</th><th>Teología</th><th></th></tr></thead>
    <tbody>
      {#each ORDINES.slice(0, 5) as o (o.ordo)}
        <tr class:elegida={o.ordo <= hoja.fe.ordoMaximo}
          ><td>{o.nombre}</td><td>{o.pf}</td><td>{o.teologia}%</td><td
            >{o.ordo <= hoja.fe.ordoMaximo ? '✓' : ''}</td
          ></tr
        >
      {/each}
    </tbody>
  </table>
  {#if hoja.fe.rituales.length}
    <h3>Rituales que conoce ({hoja.fe.rituales.length})</h3>
    <ul class="rituales">
      {#each hoja.fe.rituales as r (r.id)}<li>
          {r.nombre} <span class="detalle">({r.ordo_nombre})</span><Info
            titulo={r.nombre}
            resumen={r.resumen}
            nota={r.nota}
          />
        </li>{/each}
    </ul>
  {/if}
{/if}

<style>
  .callout {
    border: 1px solid var(--rubrica);
    border-left-width: 4px;
    padding: 0.6rem 1rem;
    background: color-mix(in srgb, var(--rubrica) 6%, transparent);
  }
  .añadir,
  .filtros {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    align-items: center;
    margin: 0.5rem 0;
  }
  .tabla {
    border-collapse: collapse;
    width: 100%;
  }
  .tabla th,
  .tabla td {
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid var(--borde);
    text-align: left;
  }
  tr.elegida {
    background: var(--pergamino-hondo);
  }
  .goecia {
    color: var(--rubrica);
  }
  .rituales {
    columns: 2;
  }
</style>
