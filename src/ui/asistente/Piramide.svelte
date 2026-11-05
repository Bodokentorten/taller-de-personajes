<script lang="ts">
  // Pirámide de habilidades: 15 fichas de lacre que se arrastran (o se colocan con dos clics) sobre una
  // habilidad o una Pasión. Las habilidades que pasarían del tope se marcan al elegir una ficha.
  import { catalogo } from '../../datos/catalogo';
  import { base, idiomasGratis, nombreHabilidad } from '../../motor/habilidades';
  import type { Hoja } from '../../motor/hoja';
  import { clave, type Personaje } from '../../motor/personaje';
  import { fichasLibres } from '../../motor/reparto';
  import Info from '../comunes/Info.svelte';
  import { fijar, puntos } from './puntos';

  let { p = $bindable(), hoja }: { p: Personaje; hoja: Hoja } = $props();

  const reglas = catalogo.reglas.fichas_piramide;
  const filasPiramide = [[50], [40, 40], [30, 30, 30], [20, 20, 20, 20], [10, 10, 10, 10, 10]];
  let elegida = $state<number | null>(null);
  let extras = $state<string[]>([]);
  let nuevaHab = $state('');
  let nuevaEsp = $state('');

  const libres = $derived(fichasLibres(p, catalogo));
  /** Para dibujar: cuántas fichas de cada valor están libres. */
  const libresPorValor = $derived(
    libres.reduce<Record<number, number>>((m, v) => ((m[v] = (m[v] ?? 0) + 1), m), {}),
  );

  const pueblo = $derived(catalogo.pueblos.find((x) => x.id === p.origen.pueblo));
  const filas = $derived.by(() => {
    const estandar = catalogo.habilidades
      .filter((h) => h.tipo === 'estandar' && !h.especialidades)
      .map((h) => h.id);
    const profesionales = catalogo.habilidades
      .filter((h) => h.tipo === 'profesional' && !h.especialidades)
      .map((h) => h.id);
    const conEsp = [
      ...p.asignaciones.filter((a) => a.fuente === 'piramide').map((a) => a.clave),
      ...idiomasGratis(pueblo, p.lenguaMaterna).map((i) => i.clave),
      ...extras,
    ].filter((c) => c.includes(':'));
    return {
      estandar: [...estandar, ...new Set(conEsp.filter((c) => c.startsWith('estilo-de-combate:')))],
      profesionales: [
        ...profesionales,
        ...new Set(conEsp.filter((c) => !c.startsWith('estilo-de-combate:'))),
      ].sort((a, b) =>
        nombreHabilidad(catalogo, a).localeCompare(nombreHabilidad(catalogo, b), 'es'),
      ),
    };
  });

  const fichaDe = (c: string) => puntos(p, 'piramide', c);
  /** Valor de la habilidad sin contar su ficha (base + idiomas gratis). */
  function sinFicha(c: string): number {
    const e = hoja.habilidades.find((x) => x.clave === c);
    if (e) return e.total - fichaDe(c);
    const h = catalogo.habilidades.find((x) => x.id === c.split(':')[0]);
    return h ? base(h, p.caracteristicas.valores) : 0;
  }
  const admite = (c: string, v: number) => sinFicha(c) + v <= reglas.tope;

  function colocar(c: string, v: number) {
    const actual = fichaDe(c);
    const disponibles = (libresPorValor[v] ?? 0) + (actual === v ? 1 : 0);
    if (disponibles <= 0 || !admite(c, v)) return;
    fijar(p, 'piramide', c, v);
    elegida = null;
  }

  function colocarEnPasion(i: number, v: number) {
    const x = p.pasiones[i];
    if (!x) return;
    const disponibles = (libresPorValor[v] ?? 0) + (x.extra === v ? 1 : 0);
    if (disponibles <= 0) return;
    x.extra = v;
    elegida = null;
  }

  function soltar(e: DragEvent, destino: (v: number) => void) {
    e.preventDefault();
    const v = Number(e.dataTransfer?.getData('text/plain'));
    if (v) destino(v);
  }

  function añadirFila() {
    if (!nuevaHab) return;
    const esp = nuevaHab === 'estilo-de-combate' ? nuevaEsp : nuevaEsp.trim();
    if (!esp) return;
    extras = [...extras, clave(nuevaHab, esp)];
    nuevaEsp = '';
  }
  const conEspecialidad = catalogo.habilidades.filter((h) => h.especialidades);
</script>

<p>
  Coloca las 15 fichas: <strong>arrástralas</strong> sobre una habilidad o una Pasión, o haz clic en
  una ficha y luego en la habilidad. Ninguna habilidad puede pasar del {reglas.tope}%, cada una
  recibe una sola ficha y al menos
  {reglas.min_profesionales} van a habilidades profesionales. Costumbres y Lengua materna ya tienen su
  +40.
</p>

<div class="piramide" aria-label="Fichas de la pirámide">
  {#each filasPiramide as fila, f (f)}
    <div class="fila-piramide">
      {#each fila as v, i (i)}
        {@const libre = i < (libresPorValor[v] ?? 0)}
        <button
          type="button"
          class="ficha"
          class:usada={!libre}
          class:elegida={libre && elegida === v}
          disabled={!libre}
          draggable={libre}
          ondragstart={(e) => {
            e.dataTransfer?.setData('text/plain', String(v));
            elegida = v;
          }}
          ondragend={() => (elegida = null)}
          onclick={() => (elegida = elegida === v ? null : v)}
          aria-label={`Ficha de ${v}${libre ? '' : ' (usada)'}`}>{v}</button
        >
      {/each}
    </div>
  {/each}
  <p class="detalle">
    Quedan {libres.length} fichas.{elegida
      ? ` Ficha de ${elegida} elegida: haz clic en una habilidad.`
      : ''}
  </p>
</div>

{#snippet fila(c: string)}
  {@const ficha = fichaDe(c)}
  {@const h = catalogo.habilidades.find((x) => x.id === c.split(':')[0])}
  <li
    class:no-admite={elegida !== null && !admite(c, elegida)}
    class:destino={elegida !== null && admite(c, elegida)}
    ondragover={(e) => e.preventDefault()}
    ondrop={(e) => soltar(e, (v) => colocar(c, v))}
  >
    <button
      type="button"
      class="habilidad"
      onclick={() => elegida !== null && colocar(c, elegida)}
      disabled={elegida === null}
    >
      {nombreHabilidad(catalogo, c)}
    </button>
    {#if h}<Info titulo={h.nombre} resumen={h.resumen} nota={h.nota} />{/if}
    <span class="base">{sinFicha(c)}</span>
    {#if ficha}
      <button
        type="button"
        class="ficha pequeña"
        title="Quitar la ficha"
        onclick={() => fijar(p, 'piramide', c, 0)}>{ficha}</button
      >
    {:else}<span class="hueco"></span>{/if}
    <span class="total">{sinFicha(c) + ficha}%</span>
  </li>
{/snippet}

<div class="columnas">
  <section>
    <h3>Estándar</h3>
    <ul class="lista">
      {#each filas.estandar as c (c)}{@render fila(c)}{/each}
    </ul>
  </section>
  <section>
    <h3>Profesionales</h3>
    <ul class="lista">
      {#each filas.profesionales as c (c)}{@render fila(c)}{/each}
    </ul>
    <div class="añadir">
      <select bind:value={nuevaHab} aria-label="Habilidad con especialidad">
        <option value="">Añadir habilidad con especialidad…</option>
        {#each conEspecialidad as h (h.id)}<option value={h.id}>{h.nombre}</option>{/each}
      </select>
      {#if nuevaHab === 'estilo-de-combate'}
        <select bind:value={nuevaEsp} aria-label="Estilo">
          <option value="">Estilo…</option>
          {#each catalogo.estilos as e (e.id)}<option value={e.id}>{e.nombre}</option>{/each}
        </select>
      {:else if nuevaHab}
        <input type="text" bind:value={nuevaEsp} placeholder="Especialidad" list="esp-piramide" />
        <datalist id="esp-piramide">
          {#each catalogo.habilidades.find((h) => h.id === nuevaHab)?.ejemplos_especialidad ?? [] as s (s)}<option
              value={s}
            ></option>{/each}
        </datalist>
      {/if}
      <button type="button" onclick={añadirFila} disabled={!nuevaHab || !nuevaEsp}>Añadir</button>
    </div>

    <h3>Pasiones</h3>
    {#if p.pasiones.length === 0}<p class="detalle">Aún no hay Pasiones (paso «Pasiones»).</p>{/if}
    <ul class="lista">
      {#each p.pasiones as x, i (i)}
        <li
          class:destino={elegida !== null}
          ondragover={(e) => e.preventDefault()}
          ondrop={(e) => soltar(e, (v) => colocarEnPasion(i, v))}
        >
          <button
            type="button"
            class="habilidad"
            disabled={elegida === null}
            onclick={() => elegida !== null && colocarEnPasion(i, elegida)}>{x.nombre}</button
          >
          <span class="base"></span>
          {#if x.extra}
            <button
              type="button"
              class="ficha pequeña"
              title="Quitar la ficha"
              onclick={() => (x.extra = undefined)}>{x.extra}</button
            >
          {:else}<span class="hueco"></span>{/if}
          <span class="total">{hoja.pasiones[i]?.valor ?? '?'}%</span>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .piramide {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    margin: 1rem 0;
  }
  .fila-piramide {
    display: flex;
    gap: 0.4rem;
  }
  .ficha {
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    padding: 0;
    font-family: var(--letra-titulo);
    font-size: 1.05rem;
    color: #f6e7c8;
    background: radial-gradient(circle at 35% 30%, #b03a2e, var(--lacre) 60%, #4a0b0b);
    border: 2px solid #5a1010;
    box-shadow: 0 2px 4px var(--sombra);
    cursor: grab;
  }
  .ficha.elegida {
    outline: 3px solid var(--oro);
    outline-offset: 2px;
  }
  .ficha.usada {
    opacity: 0.25;
    cursor: default;
    text-decoration: line-through;
  }
  .ficha.pequeña {
    width: 2rem;
    height: 2rem;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .columnas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  .lista {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .lista li {
    display: grid;
    grid-template-columns: 1fr auto 2.5rem 2.2rem 3rem;
    align-items: center;
    gap: 0.3rem;
    border-bottom: 1px dotted var(--borde);
    min-height: 2.3rem;
  }
  .lista li.destino {
    background: color-mix(in srgb, var(--oro) 10%, transparent);
  }
  .lista li.no-admite {
    background: color-mix(in srgb, var(--rubrica) 12%, transparent);
    color: var(--tinta-suave);
  }
  .habilidad {
    text-align: left;
    background: none;
    border: none;
    padding: 0.1rem 0;
  }
  .habilidad:disabled {
    cursor: default;
    color: inherit;
  }
  .base {
    color: var(--tinta-suave);
    font-size: 0.85em;
    text-align: right;
  }
  .hueco {
    width: 2rem;
    height: 2rem;
    border: 1px dashed var(--borde);
    border-radius: 50%;
  }
  .total {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--rubrica);
  }
  .añadir {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin: 0.5rem 0;
  }
  @media (max-width: 1300px) {
    .columnas {
      grid-template-columns: 1fr;
    }
  }
</style>
