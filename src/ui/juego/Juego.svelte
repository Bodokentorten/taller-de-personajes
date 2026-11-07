<script lang="ts">
  import { campaña } from '../../almacen/campaña.svelte';
  // Vista de juego: todo lo que cambia en la mesa, en una sola pantalla (1366×768 sin desplazar la página).
  import { untrack } from 'svelte';
  import { autoguardar } from '../../almacen/autoguardado.svelte';
  import { catalogo } from '../../datos/catalogo';
  import { LOCALIZACIONES } from '../../motor/atributos';
  import { armaduraPorLocalizacion } from '../../motor/equipo';
  import { calcularHoja } from '../../motor/hoja';
  import {
    DIFICULTADES,
    dificultadPorFatiga,
    EFECTO_HERIDA,
    FATIGA,
    NOMBRE_GRADO,
    nivelHerida,
    GRADOS_HORROR,
    indicePeldaño,
    faltaParaSiguiente,
    PELDAÑOS,
    REACCIONES_TERROR,
    tirarHabilidad,
    tirarHorror,
    valoresPorDificultad,
    type GradoHorror,
    type Peldaño,
    ABREVIATURA_DIFICULTAD,
    type Dificultad,
    type TiradaHabilidad,
  } from '../../motor/juego';
  import { tirar } from '../../motor/dados';
  import { juegoVacio, type Personaje } from '../../motor/personaje';
  import { enlacePaso } from '../ruta.svelte';
  import Inventario from '../comunes/Inventario.svelte';

  let { original }: { original: Personaje } = $props();
  const inicial = structuredClone(untrack(() => $state.snapshot(original)) as Personaje);
  inicial.juego ??= { ...juegoVacio(), corrupcion: inicial.magia.corrupcionInicial ?? 0 };
  let p = $state<Personaje>(inicial);
  const j = $derived(p.juego!);
  autoguardar(() => p);

  const hoja = $derived(calcularHoja(p, catalogo, campaña.actual));
  const a = $derived(hoja.atributos);
  const pa = $derived(armaduraPorLocalizacion(hoja.equipo));
  const pfMax = $derived(hoja.fe.puedeObrar ? hoja.fe.pf : 0);

  // ── Tiradas ──
  let filtro = $state('');
  let dificultad = $state<Dificultad>('normal');
  let historial = $state<TiradaHabilidad[]>([]);
  const fatigaDif = $derived(dificultadPorFatiga(j.fatiga));
  const ORDEN_DIF = DIFICULTADES.map((d) => d.id);
  /** La fatiga impone su grado si es más difícil que el elegido. */
  const difEfectiva = $derived(
    fatigaDif && ORDEN_DIF.indexOf(fatigaDif) > ORDEN_DIF.indexOf(dificultad)
      ? fatigaDif
      : dificultad,
  );
  const tirables = $derived([
    ...hoja.habilidades.map((h) => ({ clave: h.clave, nombre: h.nombre, valor: h.total })),
    ...hoja.pasiones.map((x, i) => ({
      clave: `pasion:${i}`,
      nombre: x.nombre,
      valor: x.valor ?? 0,
    })),
  ]);
  const visibles = $derived(
    tirables.filter((t) => !filtro || t.nombre.toLowerCase().includes(filtro.toLowerCase())),
  );

  /** Dificultad que se aplica: la elegida o la de la fatiga, la que sea más difícil. */
  const peor = (d: Dificultad) =>
    fatigaDif && ORDEN_DIF.indexOf(fatigaDif) > ORDEN_DIF.indexOf(d) ? fatigaDif : d;
  function tirarDe(
    t: { clave: string; nombre: string; valor: number },
    d: Dificultad = dificultad,
  ) {
    const r = tirarHabilidad(t.nombre, t.valor, peor(d));
    historial = [r, ...historial].slice(0, 6);
    if (r.grado === 'pifia' && !t.clave.startsWith('pasion:') && !j.pifias.includes(t.clave))
      j.pifias.push(t.clave);
  }
  function marcar(c: string) {
    j.marcadas = j.marcadas.includes(c) ? j.marcadas.filter((x) => x !== c) : [...j.marcadas, c];
  }

  // ── Recursos ──
  const pg = (id: string) => j.pg[id] ?? a.pg[id as keyof typeof a.pg];
  function cambiarPG(id: string, d: number) {
    j.pg[id] = pg(id) + d;
  }
  // ── Miedo («Escalera de miedo») ──
  const umbral = $derived(hoja.miedo.umbral);
  const iPeldaño = $derived(indicePeldaño(j.estres, umbral));
  const peldañoActual = $derived(PELDAÑOS[iPeldaño]!);
  const falta = $derived(faltaParaSiguiente(j.estres, umbral));
  const MODIFICADORES_MIEDO = [
    { valor: -20, nombre: '−20% (solo o a oscuras)' },
    { valor: 0, nombre: 'Sin modificador' },
    { valor: 20, nombre: '+20% (líder, clérigo, reliquia o Pasión)' },
    { valor: 40, nombre: '+40% (máximo)' },
  ];
  let gradoHorror = $state<GradoHorror>('II');
  let modMiedo = $state(0);
  let horror = $state<ReturnType<typeof tirarHorror> | null>(null);
  /** Efecto «al entrar» al cambiar el Estrés a mano (con los botones o la recuperación). */
  let avisoMiedo = $state<Peldaño | null>(null);
  function tirarElHorror() {
    // Quebrado: todas sus habilidades son Difíciles (y la fatiga impone la suya si es peor).
    horror = tirarHorror(
      hoja.magia.fuerzaVoluntad,
      gradoHorror,
      j.estres,
      umbral,
      modMiedo,
      peor(iPeldaño >= 4 ? 'dificil' : 'normal'),
    );
    avisoMiedo = null;
    j.estres = horror.despues;
    const peorEfecto = Math.max(
      horror.entra ? PELDAÑOS.indexOf(horror.entra) : 0,
      horror.porGolpe ? PELDAÑOS.indexOf(horror.porGolpe) : 0,
    );
    if (peorEfecto >= 3) j.aterrorizado = true;
  }
  function cambiarEstres(d: number) {
    const antes = indicePeldaño(j.estres, umbral);
    j.estres = Math.max(0, j.estres + d);
    const ahora = indicePeldaño(j.estres, umbral);
    horror = null;
    avisoMiedo = ahora > antes && ahora >= 2 ? PELDAÑOS[ahora]! : null;
    if (ahora > antes && ahora >= 3) j.aterrorizado = true;
  }
  let recuperado = $state<string>('');
  function recuperar(nombre: string) {
    const n = tirar('1d3').total;
    cambiarEstres(-n);
    recuperado = `${nombre}: −${n} de Estrés.`;
  }
  const esTerror = (x?: Peldaño) => x?.id === 'aterrorizado';
  function descansar() {
    j.pg = {};
    j.notasHeridas = {};
    j.pm = undefined;
    j.suerte = undefined;
    j.pf = undefined;
    j.fatiga = 0;
  }
  let nuevaMunicion = $state('');
</script>

<div class="juego">
  <header class="barra">
    <h1>{p.nombre || 'Sin nombre'}</h1>
    <span class="detalle"
      >{catalogo.carreras.find((c) => c.id === p.carrera)?.nombre ?? ''} · Iniciativa {a.iniciativa -
        (hoja.equipo.carArmadura ? Math.ceil(hoja.equipo.carArmadura / 5) : 0)} · MD {a.modDano} · PA
      {a.puntosAccion}</span
    >
    <nav>
      {#if hoja.magia.fuentes.length}<a href={`#/hechizos/${encodeURIComponent(p.id)}`}>Hechizos</a
        >{/if}
      <a href={enlacePaso(p.id, 'mejora')}>Mejora y experiencia</a>
      <a href={enlacePaso(p.id, 'concepto')}>Ficha</a>
    </nav>
  </header>

  <section class="panel cuerpo">
    <h2>Cuerpo</h2>
    <table>
      <tbody>
        {#each [...LOCALIZACIONES].reverse() as l (l.id)}
          {@const actual = pg(l.id)}
          {@const nivel = nivelHerida(actual, a.pg[l.id])}
          <tr class={nivel}>
            <td class="d20">{l.d20[0]}–{l.d20[1]}</td>
            <th title={EFECTO_HERIDA[nivel]}>{l.nombre}</th>
            <td class="pa" title="Puntos de armadura">{pa[l.id] ?? 0}</td>
            <td class="pg">
              <button onclick={() => cambiarPG(l.id, -1)} aria-label={`Quitar 1 PG de ${l.nombre}`}
                >−</button
              >
              <strong>{actual}</strong>/{a.pg[l.id]}
              <button onclick={() => cambiarPG(l.id, 1)} aria-label={`Sumar 1 PG a ${l.nombre}`}
                >+</button
              >
            </td>
            <td class="nivel">{nivel === 'ilesa' ? '' : nivel}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if LOCALIZACIONES.some((l) => nivelHerida(pg(l.id), a.pg[l.id]) !== 'ilesa')}
      {@const peor = LOCALIZACIONES.map((l) => nivelHerida(pg(l.id), a.pg[l.id])).reduce(
        (m, n) =>
          ['ilesa', 'leve', 'grave', 'mayor'].indexOf(n) >
          ['ilesa', 'leve', 'grave', 'mayor'].indexOf(m)
            ? n
            : m,
        'ilesa',
      )}
      <p class="efecto">{EFECTO_HERIDA[peor]}</p>
    {/if}

    <h2>Recursos</h2>
    <div class="recursos">
      {#snippet contador(nombre: string, valor: number, max: number, fijar: (v: number) => void)}
        <div class="contador">
          <span>{nombre}</span>
          <button onclick={() => fijar(Math.max(0, valor - 1))} aria-label={`Gastar ${nombre}`}
            >−</button
          >
          <strong>{valor}</strong>/{max}
          <button onclick={() => fijar(Math.min(max, valor + 1))} aria-label={`Recuperar ${nombre}`}
            >+</button
          >
        </div>
      {/snippet}
      {@render contador('Suerte', j.suerte ?? a.suerte, a.suerte, (v) => (j.suerte = v))}
      {@render contador('PM', j.pm ?? a.puntosMagia, a.puntosMagia, (v) => (j.pm = v))}
      {#if pfMax}{@render contador('PF', j.pf ?? pfMax, pfMax, (v) => (j.pf = v))}{/if}
    </div>
    <button class="descanso" onclick={descansar} title="PG, PM, PF, Suerte y Fatiga al máximo"
      >Nueva sesión o descanso completo</button
    >
  </section>

  <section class="panel tiradas">
    <h2>Tiradas</h2>
    <div class="controles">
      <input type="search" bind:value={filtro} placeholder="Buscar habilidad o Pasión…" />
      <select bind:value={dificultad} aria-label="Dificultad">
        {#each DIFICULTADES as d (d.id)}<option value={d.id}>{d.nombre}</option>{/each}
      </select>
    </div>
    {#if difEfectiva !== dificultad}<p class="aviso">
        La fatiga ({FATIGA[j.fatiga]?.nombre}) hace las tiradas {DIFICULTADES.find(
          (d) => d.id === difEfectiva,
        )?.nombre.toLowerCase()}.
      </p>{/if}
    <div class="ultimas" aria-live="polite">
      {#each historial as r, i (i)}
        <p class={`tirada ${r.grado}`} class:ultima={i === 0}>
          <strong>{r.d100}</strong>
          {NOMBRE_GRADO[r.grado]} · {r.nombre}
          {r.efectivo}%{r.efectivo !== r.valor ? ` (de ${r.valor}%)` : ''}
        </p>
      {/each}
    </div>
    <table class="lista">
      <thead>
        <tr>
          <th><span class="visualmente-oculto">Experiencia</span></th>
          <th>Habilidad o Pasión</th>
          {#each DIFICULTADES as d (d.id)}<th class="dif" title={d.nombre}
              >{ABREVIATURA_DIFICULTAD[d.id]}</th
            >{/each}
        </tr>
      </thead>
      <tbody>
        {#each visibles as t (t.clave)}
          <tr>
            <td>
              <input
                type="checkbox"
                checked={j.marcadas.includes(t.clave)}
                onchange={() => marcar(t.clave)}
                aria-label={`Marcar ${t.nombre} para experiencia`}
                title="Marcar para experiencia"
              />
            </td>
            <td>
              <button class="tirar" onclick={() => tirarDe(t)}>{t.nombre}</button>
              {#if j.pifias.includes(t.clave)}<span
                  class="pifia-marca"
                  title="Pifiada esta sesión: +1 gratis">✠</span
                >{/if}
            </td>
            {#each valoresPorDificultad(t.valor) as v (v.id)}
              <td class="dif">
                <button
                  class="valor"
                  class:normal={v.id === 'normal'}
                  class:elegida={v.id === dificultad}
                  title={`Tirar ${t.nombre} en ${v.nombre.toLowerCase()} (${v.valor}%)`}
                  onclick={() => tirarDe(t, v.id)}>{v.valor}</button
                >
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section class="panel estado">
    <h2>Fatiga</h2>
    <select bind:value={j.fatiga} aria-label="Nivel de fatiga">
      {#each FATIGA as f, i (i)}<option value={i}>{f.nombre}</option>{/each}
    </select>
    <p class="detalle">
      {FATIGA[j.fatiga]?.efecto}{FATIGA[j.fatiga]?.habilidades
        ? ` · habilidades ${FATIGA[j.fatiga]?.habilidades.toLowerCase()}`
        : ''}
    </p>

    <h2>Mente y alma</h2>
    <div class="contador">
      <span>Estrés</span>
      <button onclick={() => (j.estres = Math.max(0, j.estres - 1))} aria-label="Reducir Estrés"
        >−</button
      >
      <strong>{j.estres}</strong>
      <button onclick={() => cambiarEstres(1)} aria-label="Sumar Estrés">+</button>
      <span class="detalle">Umbral {umbral}</span>
    </div>
    <p class="detalle">
      <strong class:alarma={iPeldaño >= 3}>{peldañoActual.nombre}</strong>: {peldañoActual.mientras}
      {#if falta !== undefined}Faltan {falta} para el siguiente.{/if}
      <span title="Umbral = POD ÷ 2 (POD {hoja.miedo.pod}, ya descontada la Corrupción)"
        >Asustado {umbral} · Aterrorizado {2 * umbral} · Quebrado {3 * umbral} · Colapso {4 *
          umbral}.</span
      >
    </p>
    <div class="linea">
      <select bind:value={gradoHorror} aria-label="Grado de Horror">
        {#each GRADOS_HORROR as g (g.id)}<option value={g.id}>Grado {g.id} ({g.dado})</option
          >{/each}
      </select>
      <select bind:value={modMiedo} aria-label="Modificador a la Fuerza de voluntad">
        {#each MODIFICADORES_MIEDO as m (m.valor)}<option value={m.valor}>{m.nombre}</option>{/each}
      </select>
    </div>
    <div class="linea">
      <button onclick={tirarElHorror}
        >Horror: Fuerza de voluntad {hoja.magia.fuerzaVoluntad + modMiedo}%</button
      >
    </div>
    {#if horror}<div class="panico">
        <p>
          {horror.fv.d100} contra {horror.fv.efectivo}%:
          <strong>{NOMBRE_GRADO[horror.fv.grado]}</strong>. {horror.ganado > 0
            ? `+${horror.ganado} de Estrés`
            : horror.ganado < 0
              ? '−1 de Estrés'
              : 'No gana Estrés'} ({horror.antes} → {horror.despues}).
        </p>
        {#if horror.entra}<p>
            <strong>{horror.entra.id === 'colapso' ? '' : 'Entra en '}{horror.entra.nombre}:</strong
            >
            {horror.entra.alEntrar}
          </p>{/if}
        {#if horror.golpeFuerte}<p>
            <strong>Golpe fuerte</strong>: 2.ª Fuerza de voluntad {horror.golpeFuerte.d100} contra
            {horror.golpeFuerte.efectivo}%, {NOMBRE_GRADO[horror.golpeFuerte.grado].toLowerCase()}.
            {#if horror.porGolpe}Sufre en el acto el efecto de <strong
                >{horror.porGolpe.nombre}</strong
              >: {horror.porGolpe.alEntrar}{:else}Sólo cuenta el Estrés.{/if}
          </p>{/if}
        {#if esTerror(horror.entra) || esTerror(horror.porGolpe)}<ul class="reacciones">
            {#each REACCIONES_TERROR as x (x.nombre)}<li>
                <strong>{x.nombre}</strong>: {x.efecto}
              </li>{/each}
          </ul>{/if}
        {#if horror.entra || horror.porGolpe}<p class="detalle">
            Para ignorar el efecto: aferrarse a una Pasión o a la Fe (1/escena) o pagar 1 Punto de
            Suerte, 1 nivel de Fatiga o −5% a una Pasión. El Estrés se queda.{#if horror.porGolpe || (horror.entra && PELDAÑOS.indexOf(horror.entra) >= 3)}
              Contagio: +1 de Estrés a los aliados que lo vean u oigan (1/escena).{/if}
          </p>{/if}
      </div>{/if}
    {#if avisoMiedo}<p class="panico">
        <strong>Entra en {avisoMiedo.nombre}:</strong>
        {avisoMiedo.alEntrar}
      </p>{/if}
    <div class="linea">
      <button
        onclick={() => recuperar('Noche segura')}
        title="Techo, fuego, comida caliente y guardia">Noche segura (−1d3)</button
      >
      <button
        onclick={() => {
          j.estres = 0;
          horror = null;
          avisoMiedo = null;
          recuperado = 'Una semana segura: Estrés a 0.';
        }}>Semana segura (a 0)</button
      >
    </div>
    {#if recuperado}<p class="detalle">{recuperado}</p>{/if}
    <label class="linea"
      ><input type="checkbox" bind:checked={j.aterrorizado} /> #Aterrorizado</label
    >
    <div class="contador">
      <span>Corrupción</span>
      <button
        onclick={() => (j.corrupcion = Math.max(0, j.corrupcion - 1))}
        aria-label="Reducir Corrupción">−</button
      >
      <strong>{j.corrupcion}</strong>
      <button onclick={() => (j.corrupcion += 1)} aria-label="Sumar Corrupción">+</button>
      <span class="detalle">(−1 POD cada punto)</span>
    </div>

    <h2>Carga</h2>
    <Inventario bind:p {hoja} compacto />

    <h2>Munición</h2>
    {#each j.municion as m, i (i)}
      <div class="contador">
        <span>{m.nombre}</span>
        <button
          onclick={() => (m.cantidad = Math.max(0, m.cantidad - 1))}
          aria-label={`Gastar ${m.nombre}`}>−</button
        >
        <strong>{m.cantidad}</strong>
        <button onclick={() => (m.cantidad += 1)} aria-label={`Recuperar ${m.nombre}`}>+</button>
        <button onclick={() => j.municion.splice(i, 1)} aria-label={`Quitar ${m.nombre}`}>✕</button>
      </div>
    {/each}
    <div class="linea">
      <input type="text" bind:value={nuevaMunicion} placeholder="Virotes (15)" />
      <button
        disabled={!nuevaMunicion.trim()}
        onclick={() => {
          j.municion.push({
            nombre: nuevaMunicion.trim(),
            cantidad: Number(/\((\d+)\)/.exec(nuevaMunicion)?.[1] ?? 10),
          });
          nuevaMunicion = '';
        }}>Añadir</button
      >
    </div>

    <h2>Notas de la sesión</h2>
    <textarea bind:value={j.notasSesion} rows="5"></textarea>
  </section>
</div>

<style>
  .juego {
    display: grid;
    grid-template-columns: 22rem minmax(0, 1fr) 20rem;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.6rem 1rem;
    /* 100vh menos la cabecera (unos 63 px): la página no se desplaza */
    height: calc(100vh - 4rem);
    padding: 0.6rem 1rem;
    font-size: 0.95rem;
    box-sizing: border-box;
  }
  .barra {
    grid-column: 1 / -1;
    display: flex;
    align-items: baseline;
    gap: 1rem;
  }
  .barra h1 {
    margin: 0;
    font-size: 1.8rem;
  }
  .barra nav {
    margin-left: auto;
    display: flex;
    gap: 1rem;
  }
  .panel {
    border: 1px solid var(--borde);
    background: var(--pergamino);
    padding: 0.5rem 0.8rem;
    overflow: auto;
    min-height: 0;
  }
  h2 {
    font-size: 1.15rem;
    margin: 0.3rem 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  td,
  th {
    padding: 0.15rem 0.3rem;
    border-bottom: 1px dotted var(--borde);
    text-align: left;
    font-weight: normal;
  }
  .d20,
  .pa {
    color: var(--tinta-suave);
    font-size: 0.85em;
  }
  .pg {
    white-space: nowrap;
  }
  .pg button,
  .contador button {
    padding: 0 0.45em;
  }
  tr.leve .nivel {
    color: var(--oro);
  }
  tr.grave,
  tr.mayor {
    background: color-mix(in srgb, var(--rubrica) 12%, transparent);
  }
  tr.grave .nivel,
  tr.mayor .nivel {
    color: var(--rubrica);
    font-weight: 600;
  }
  .efecto,
  .aviso {
    font-size: 0.85em;
    color: var(--rubrica);
    margin: 0.3rem 0;
  }
  .recursos {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .contador {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin: 0.2rem 0;
  }
  .contador > span:first-child {
    min-width: 5.5rem;
  }
  .descanso {
    margin-top: 0.6rem;
    font-size: 0.85em;
  }
  .tiradas {
    display: flex;
    flex-direction: column;
  }
  .controles {
    display: flex;
    gap: 0.5rem;
  }
  .controles input {
    flex: 1;
  }
  .ultimas {
    min-height: 4.2rem;
    margin: 0.3rem 0;
  }
  .tirada {
    margin: 0.1rem 0;
    font-size: 0.9em;
    color: var(--tinta-suave);
  }
  .tirada.ultima {
    font-size: 1.15em;
    color: var(--tinta);
  }
  .tirada.critico strong,
  .tirada.exito strong {
    color: #2f6b2f;
  }
  .tirada.fallo strong,
  .tirada.pifia strong {
    color: var(--rubrica);
  }
  :root[data-tema='vela'] .tirada.critico strong,
  :root[data-tema='vela'] .tirada.exito strong {
    color: #7fc27f;
  }
  .lista {
    width: 100%;
    border-collapse: collapse;
    display: block;
    overflow: auto;
    flex: 1;
  }
  .lista thead th {
    position: sticky;
    top: 0;
    background: var(--pergamino);
    font-size: 0.78em;
    color: var(--tinta-suave);
    font-weight: normal;
  }
  .lista td {
    padding: 0 0.15rem;
  }
  .lista td:nth-child(2) {
    width: 100%;
  }
  .dif {
    text-align: center;
  }
  .tirar {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    padding: 0.1rem 0;
  }
  .tirar:hover {
    color: var(--rubrica);
    text-decoration: underline;
  }
  .valor {
    font-variant-numeric: tabular-nums;
    color: var(--tinta-suave);
    background: none;
    border: 1px solid transparent;
    padding: 0 0.3em;
    min-width: 2.6em;
  }
  .valor.normal {
    color: var(--rubrica);
    font-weight: 600;
  }
  .valor.elegida {
    border-color: var(--borde-campo);
  }
  .valor:hover {
    border-color: var(--rubrica);
  }
  .pifia-marca {
    color: var(--rubrica);
  }
  .estado select,
  .estado textarea {
    width: 100%;
  }
  .panico {
    font-size: 0.88em;
    border-left: 3px solid var(--rubrica);
    padding-left: 0.4rem;
  }
  .panico p {
    margin: 0.2rem 0;
  }
  .reacciones {
    margin: 0.2rem 0;
    padding-left: 1.1rem;
  }
  .alarma {
    color: var(--rubrica);
  }
  .linea {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }
  .linea input[type='text'] {
    flex: 1;
    min-width: 0;
  }
</style>
