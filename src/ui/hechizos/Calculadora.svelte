<script lang="ts">
  // Calculadora de hechizos de Magia Caótica: dificultad de un hechizo espontáneo y de las fórmulas del PJ.
  import { biblioteca } from '../../almacen/biblioteca.svelte';
  import { campaña } from '../../almacen/campaña.svelte';
  import { catalogo } from '../../datos/catalogo';
  import { MANIPULACIONES, type Manipulacion } from '../../datos/tipos';
  import {
    ALCANCES,
    ARMADURAS,
    armaduraDe,
    calcularHechizo,
    COMPONENTES,
    dificultadFormula,
    DURACIONES,
    manipulacionFuente,
    OBJETIVOS,
    parametrosDeFormula,
    RANGOS,
    ZONAS,
    resistenciaHechizo,
    mde,
    intercambiosMedios,
    LIMITE_LANZAMIENTO_RAPIDO,
    type ParametrosHechizo,
    type Rango,
  } from '../../motor/hechizos';
  import { calcularHoja } from '../../motor/hoja';
  import { caracteristicasActuales } from '../../motor/personaje';
  import { fuentesPara } from '../../motor/magia';
  import { enlacePaso } from '../ruta.svelte';

  let { id }: { id?: string } = $props();

  const p = $derived(id ? biblioteca.obtener(id) : undefined);
  const hoja = $derived(p ? calcularHoja(p, catalogo, campaña.actual) : undefined);
  const fuentes = $derived(hoja?.magia.fuentes ?? []);
  const armaduraPJ = $derived(
    armaduraDe(
      hoja?.equipo.objetos
        .filter((o) => o.tipo === 'armadura' && o.puesto)
        .map(
          (o) => catalogo.armas.armaduras.find((a) => `armadura:${a.id}` === o.id)?.tipo ?? '',
        ) ?? [],
    ),
  );

  // ── Lanzamiento (común a las dos partes) ──
  let zona = $state('rural');
  let vozBaja = $state(false);
  let sinGestos = $state(false);
  let armadura = $state<string | undefined>(undefined);
  const armaduraUsada = $derived(armadura ?? armaduraPJ);

  // ── Fórmulas del personaje ──
  const formulasPJ = $derived(
    (hoja?.magia.formulas ?? []).map((f) => {
      const validas = fuentesPara(f, hoja!.magia);
      const opciones = (validas.length ? validas : fuentes).map((s) => ({
        s,
        r: dificultadFormula(catalogo, f, s, { zona, vozBaja, sinGestos, armadura: armaduraUsada }),
      }));
      const mejor = opciones.sort((a, b) => a.r.final - b.r.final)[0];
      return { f, puede: validas.length > 0, mejor };
    }),
  );

  // ── Hechizo libre ──
  let h = $state<ParametrosHechizo>({
    rango: 'I',
    duracion: 'instantanea',
    alcance: 'toque',
    objetivo: 'otro',
    requisitos: 0,
    formulaCompleta: false,
    componentes: 'ninguno',
  });
  let manipulacion = $state<Manipulacion>('Crear');
  /** «g:<id>» un grimorio, «f:<clave>» una Fuente del PJ o «manual». */
  let fuente = $state('manual');
  let manual = $state(0);
  let desdeFormula = $state('');

  const fuenteElegida = $derived.by(() => {
    if (fuente.startsWith('f:')) return fuentes.find((s) => s.clave === fuente.slice(2));
    if (fuente.startsWith('g:')) {
      const g = catalogo.grimorios.find((x) => x.id === fuente.slice(2));
      return g
        ? {
            grimorio: g.id,
            nombre: g.nombre,
            rangoMaximo: g.rango_maximo ?? 'V',
            valor: undefined as number | undefined,
            improvisa: g.tipo_fuente !== 'recetario',
            goetica: g.fuente_goetica,
            techo: undefined as number | undefined,
            techoPor: 'Ocultismo' as const,
          }
        : undefined;
    }
    return undefined;
  });
  const valorManipulacion = $derived(
    fuenteElegida ? manipulacionFuente(catalogo, fuenteElegida, manipulacion) : manual,
  );
  const resultado = $derived(
    calcularHechizo(h, {
      zona,
      manipulacion: valorManipulacion,
      vozBaja,
      sinGestos,
      armadura: armaduraUsada,
    }),
  );
  const ORDEN: Rango[] = ['I', 'II', 'III', 'IV', 'V'];

  // POD del hechicero: el del personaje, o uno a mano si se usa sin personaje
  let podManual = $state(11);
  const pod = $derived(p ? caracteristicasActuales(p).POD : podManual);
  const modEspiritu = $derived(mde(pod));

  function cargarFormula(fid: string) {
    const f = catalogo.formulas.find((x) => x.id === fid);
    if (!f) return;
    h = { ...parametrosDeFormula(f), componentes: 'ninguno' };
    manipulacion = f.manipulacion;
  }
  const espontaneo = $derived(!h.formulaCompleta);
</script>

<article class="folio calculadora">
  <h1>Calculadora de hechizos</h1>
  <p class="subtitulo">
    Magia Caótica: dificultad de un hechizo según su Rango, sus parámetros y dónde se lanza
  </p>

  {#if !campaña.actual.permitirMagia}
    <p class="aviso">
      La campaña activa no permite magia a los PJ; la calculadora sigue sirviendo de consulta.
    </p>
  {/if}

  <section class="lanzamiento">
    <h2>Dónde y cómo se lanza</h2>
    <div class="fila">
      <label
        >Zona
        <select bind:value={zona}
          >{#each ZONAS as z (z.id)}<option value={z.id}>{z.nombre} (+{z.valor}%)</option
            >{/each}</select
        >
      </label>
      <label
        >Armadura
        <select
          value={armaduraUsada}
          onchange={(e) => (armadura = (e.currentTarget as HTMLSelectElement).value)}
        >
          {#each ARMADURAS as a (a.id)}<option value={a.id}>{a.nombre} (+{a.valor}%)</option>{/each}
        </select>
      </label>
      <label class="check"
        ><input type="checkbox" bind:checked={vozBaja} /> En voz baja (+10%)</label
      >
      <label class="check"
        ><input type="checkbox" bind:checked={sinGestos} /> Sin gestos (+10%)</label
      >
    </div>
    {#if p && armadura === undefined && armaduraPJ !== 'ninguna'}<p class="detalle">
        Armadura tomada de lo que lleva puesto {p.nombre}.
      </p>{/if}
  </section>

  {#if p && hoja}
    <section>
      <h2>Fórmulas de {p.nombre || 'tu personaje'}</h2>
      {#if !formulasPJ.length}
        <p class="detalle">
          No conoce fórmulas. <a href={enlacePaso(p.id, 'magia')}>Paso «Magia y fe»</a>.
        </p>
      {:else}
        <table class="tabla">
          <thead
            ><tr
              ><th>Fórmula</th><th>Rango</th><th>Fuente</th><th>Base</th><th>Final</th><th
                title="Resistencia del Hechizo: dificultad ÷ 5">Resistencia</th
              ></tr
            ></thead
          >
          <tbody>
            {#each formulasPJ as x (x.f.id)}
              <tr class:no={!x.puede}>
                <td>{x.f.nombre}{x.f.goecia ? ' ✠' : ''}</td>
                <td>{x.f.rango} <span class="detalle">(estudio {x.mejor?.r.umbral}%)</span></td>
                <td
                  >{x.mejor ? `${x.mejor.s.nombre} ${x.mejor.s.valor}%` : '—'}{#if !x.puede}<span
                      class="aviso"
                    >
                      no le llega</span
                    >{/if}</td
                >
                <td>{x.f.dificultad_base}%</td>
                <td
                  class="final"
                  title={x.mejor?.r.desglose
                    .map((d) => `${d.concepto}: ${d.valor >= 0 ? '+' : ''}${d.valor}%`)
                    .join('\n')}
                >
                  {x.mejor ? `${x.mejor.r.final}%` : '—'}
                </td>
                <td>
                  {#if x.mejor}
                    <strong>{resistenciaHechizo(x.mejor.r.final)}</strong>
                    <span class="detalle"
                      >{x.mejor.r.final <= LIMITE_LANZAMIENTO_RAPIDO
                        ? 'rápido'
                        : `~${intercambiosMedios(x.mejor.r.final, modEspiritu)} interc.`}</span
                    >
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        <p class="detalle">
          POD {pod} · MDE {modEspiritu >= 0 ? '+' : ''}{modEspiritu}: cada intercambio ganado resta
          1d6{modEspiritu ? (modEspiritu > 0 ? ` + ${modEspiritu}` : ` − ${-modEspiritu}`) : ''} a la
          Resistencia. Pasa el ratón por la dificultad final para ver el desglose. Si tiene varias Fuentes
          válidas, se usa la que da menos dificultad.
        </p>
      {/if}
    </section>
  {/if}

  <section>
    <h2>Hechizo espontáneo o fórmula</h2>
    <p class="detalle">
      Lo habitual es la magia espontánea: el mago interpreta su Fuente. Una fórmula sin variar es la
      opción segura. Si se cambia cualquier parámetro de una fórmula, es magia espontánea.
    </p>
    <div class="fila">
      <label
        >Partir de una fórmula
        <select bind:value={desdeFormula} onchange={() => cargarFormula(desdeFormula)}>
          <option value="">—</option>
          {#each catalogo.formulas as f (f.id)}<option value={f.id}>{f.nombre} (vis {f.vis})</option
            >{/each}
        </select>
      </label>
    </div>
    <div class="parametros">
      <label
        >Rango
        <select bind:value={h.rango}
          >{#each RANGOS as r (r.id)}<option value={r.id}
              >{r.nombre} (+{r.valor}% · estudio {r.umbral}%)</option
            >{/each}</select
        >
      </label>
      <label
        >Duración
        <select bind:value={h.duracion}
          >{#each DURACIONES as o (o.id)}<option value={o.id}>{o.nombre} (+{o.valor}%)</option
            >{/each}</select
        >
      </label>
      <label
        >Alcance
        <select bind:value={h.alcance}
          >{#each ALCANCES as o (o.id)}<option value={o.id}>{o.nombre} (+{o.valor}%)</option
            >{/each}</select
        >
      </label>
      <label
        >Objetivo
        <select bind:value={h.objetivo}
          >{#each OBJETIVOS as o (o.id)}<option value={o.id}>{o.nombre} (+{o.valor}%)</option
            >{/each}</select
        >
      </label>
      <label
        >Requisitos extra
        <input type="number" min="0" max="5" bind:value={h.requisitos} class="corto" />
      </label>
      <label
        >Tipo
        <select bind:value={h.formulaCompleta}>
          <option value={false}>Magia espontánea</option>
          <option value={true}>Fórmula sin variar, con todos sus componentes (−20%)</option>
        </select>
      </label>
      {#if espontaneo}
        <label
          >Componentes
          <select bind:value={h.componentes}
            >{#each COMPONENTES as c (c.id)}<option value={c.id}
                >{c.nombre}{c.valor ? ` (${c.valor}%)` : ''}</option
              >{/each}</select
          >
        </label>
      {/if}
      <label
        >Manipulación
        <select bind:value={manipulacion}
          >{#each MANIPULACIONES as m (m)}<option value={m}>{m}</option>{/each}</select
        >
      </label>
      <label
        >Fuente
        <select bind:value={fuente}>
          <option value="manual">Valor a mano</option>
          {#each fuentes as s (s.clave)}<option value={`f:${s.clave}`}
              >{s.nombre} ({s.valor}%)</option
            >{/each}
          {#each catalogo.grimorios.filter((g) => g.estudiable) as g (g.id)}<option
              value={`g:${g.id}`}>{g.nombre}</option
            >{/each}
        </select>
      </label>
      {#if fuente === 'manual'}
        <label
          >Manipulación de la Fuente (%)
          <input type="number" min="0" max="60" bind:value={manual} class="corto" />
        </label>
      {/if}
    </div>

    <div class="resultado">
      <p class="cifra">
        Dificultad: <strong>{resultado.final}%</strong>
        <span class="detalle">(base {resultado.base}%)</span>
      </p>
      <p class="cifra">
        Resistencia del Hechizo: <strong>{resistenciaHechizo(resultado.final)}</strong>
        <span class="detalle">(dificultad ÷ 5, redondeando hacia arriba)</span>
      </p>
      <p>
        {#if resultado.final <= LIMITE_LANZAMIENTO_RAPIDO}
          <strong>Lanzamiento rápido:</strong> con dificultad del {LIMITE_LANZAMIENTO_RAPIDO}% o
          menos se resuelve con una sola tirada opuesta (1 PAc).
        {:else}
          Tirada opuesta: % de la Fuente contra {resultado.final}%. Cada intercambio ganado resta
          1d6 + MDE ({modEspiritu >= 0 ? '+' : ''}{modEspiritu} con POD
          {#if p}{pod}{:else}<input
              type="number"
              min="1"
              max="40"
              bind:value={podManual}
              class="pod"
              aria-label="POD del hechicero"
            />{/if}): unos <strong>{intercambiosMedios(resultado.final, modEspiritu)}</strong> intercambios
          si los gana todos; cada uno perdido le cuesta 1d6 − MDE PM (mínimo 1).
        {/if}
      </p>
      <p>
        Hace falta una Fuente con <strong>{resultado.umbral}%</strong> de estudio o más{fuenteElegida
          ? ''
          : ' en los dominios del hechizo'}.
      </p>
      {#if fuenteElegida?.valor !== undefined && fuenteElegida.valor < resultado.umbral}
        <p class="aviso">
          {fuenteElegida.nombre} solo tiene {fuenteElegida.valor}%: no llega a este Rango.
        </p>
      {/if}
      {#if fuenteElegida && ORDEN.indexOf(h.rango) > ORDEN.indexOf(fuenteElegida.rangoMaximo)}
        <p class="aviso">
          {fuenteElegida.nombre} solo permite hasta el Rango {fuenteElegida.rangoMaximo}.
        </p>
      {/if}
      {#if espontaneo && fuenteElegida && !fuenteElegida.improvisa}
        <p class="aviso">
          {fuenteElegida.nombre} es un recetario: no permite improvisar, sólo lanzar fórmulas.
        </p>
      {/if}
      {#if espontaneo && fuenteElegida?.techo !== undefined && fuenteElegida.techo < resultado.umbral}
        <p class="aviso">
          Techo para improvisar con {fuenteElegida.nombre}: {fuenteElegida.techo}% (el menor entre
          su estudio y su {fuenteElegida.techoPor}). No llega al Rango {h.rango}.
        </p>
      {:else if espontaneo && !fuenteElegida && hoja}
        <p class="detalle">
          Para improvisar, el Rango tampoco puede pasar de su Conocimiento (Ocultismo) {hoja.magia
            .ocultismo}% (en un linaje, de su Fuerza de voluntad).
        </p>
      {/if}
      {#if fuenteElegida?.goetica}
        <p class="aviso">
          {fuenteElegida.nombre} es una fuente goética: este hechizo es goecia y condena el alma.
        </p>
      {/if}
      <p>
        <strong>Riesgo:</strong>
        {#if espontaneo}Reatracción Mística si pierde la concentración al recibir daño, si queda a 0
          PM y falla al Empujar el Vacío, o con una pifia (la deformación del dominio).
        {:else}sólo Reatracción con una pifia (además del efecto contrario); si pierde la
          concentración o falla al Empujar el Vacío, el hechizo se disipa sin más.
        {/if}
      </p>
      <ul class="desglose">
        {#each resultado.desglose as d, i (i)}<li>
            <span>{d.concepto}</span><span>{d.valor >= 0 ? '+' : ''}{d.valor}%</span>
          </li>{/each}
      </ul>
      <p class="detalle">
        La dificultad base nunca baja del 5%. Reglas: «Magia espontánea», «Fórmulas, vis y rangos» y
        la Guía de Magia Caótica (§6).
      </p>
    </div>
  </section>
</article>

<style>
  .calculadora {
    max-width: 62rem;
  }
  .fila,
  .parametros {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem 1.2rem;
    align-items: end;
  }
  .parametros label,
  .fila label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  label.check {
    flex-direction: row;
    align-items: center;
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
  tr.no {
    color: var(--tinta-suave);
  }
  .final {
    font-weight: 700;
    color: var(--rubrica);
    cursor: help;
  }
  .resultado {
    margin-top: 1rem;
    border: 1px solid var(--borde);
    padding: 0.6rem 1rem;
  }
  .cifra {
    font-size: 1.4em;
    margin: 0;
  }
  .cifra strong {
    color: var(--rubrica);
  }
  .desglose {
    list-style: none;
    padding: 0;
    max-width: 28rem;
  }
  .desglose li {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dotted var(--borde);
  }
  .aviso {
    color: var(--rubrica);
  }
  .pod {
    width: 3.5em;
  }
</style>
