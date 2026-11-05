<script lang="ts">
  // Mejora del personaje: tiradas de experiencia, entrenamiento, aprendizaje e historial.
  import { untrack } from 'svelte';
  import { autoguardar } from '../../almacen/autoguardado.svelte';
  import { catalogo } from '../../datos/catalogo';
  import { CARACTERISTICAS } from '../../datos/tipos';
  import {
    aplicarPifias,
    aprenderFormula,
    aprenderHabilidad,
    aprenderOrdo,
    COSTE_HABILIDAD_NUEVA,
    costeCaracteristica,
    entrenar,
    experiencia,
    mejorarCaracteristica,
    mejorarHabilidad,
    mejorarPasion,
    nuevaPasion,
    otorgarTiradas,
    yaTirada,
    type Resultado,
    type ResultadoEnseñar,
  } from '../../motor/experiencia';
  import { fuentesPara } from '../../motor/magia';
  import { calcularHoja } from '../../motor/hoja';
  import { caracteristicasActuales, clave, type Personaje } from '../../motor/personaje';
  import { enlacePaso } from '../ruta.svelte';
  import Numero from '../comunes/Numero.svelte';

  let { original }: { original: Personaje } = $props();
  let p = $state<Personaje>(structuredClone(untrack(() => $state.snapshot(original)) as Personaje));
  experiencia(p);
  autoguardar(() => p);

  const hoja = $derived(calcularHoja(p, catalogo));
  const e = $derived(p.experiencia!);
  let mensaje = $state('');
  let error = $state('');

  function hacer(r: Resultado) {
    if (r.ok) {
      mensaje = r.cambio.detalle;
      error = '';
    } else {
      error = r.error;
      mensaje = '';
    }
  }

  // Conceder tiradas
  let nuevas = $state(3);
  let conModificador = $state(false);

  // Marcadas en la vista de juego, primero
  const marcadas = $derived(p.juego?.marcadas ?? []);
  const habilidades = $derived(
    [...hoja.habilidades].sort(
      (a, b) =>
        Number(marcadas.includes(b.clave)) - Number(marcadas.includes(a.clave)) ||
        a.nombre.localeCompare(b.nombre, 'es'),
    ),
  );
  const pifias = $derived(p.juego?.pifias ?? []);

  // Aprender habilidad nueva
  let nuevaHab = $state('');
  let nuevaEsp = $state('');
  const profesionalesNuevas = $derived(
    catalogo.habilidades.filter(
      (h) =>
        h.tipo === 'profesional' &&
        (h.especialidades || !hoja.habilidades.some((x) => x.clave === h.id)),
    ),
  );

  // Pasión nueva
  let nombrePasion = $state('');
  let tipoPasion = $state(3);

  // Entrenamiento
  let claveEntreno = $state('');
  let mentor = $state(60);
  let enseñar = $state<ResultadoEnseñar>('ninguno');

  // Fórmula nueva
  let formulaNueva = $state('');
  let comoFormula = $state('con un maestro');
  const conocidas = $derived(new Set([...p.magia.formulas, ...(p.magia.formulasAprendidas ?? [])]));
  const formulasLanzables = $derived(
    catalogo.formulas.filter((f) => !conocidas.has(f.id) && fuentesPara(f, hoja.magia).length > 0),
  );
  const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-ES');
</script>

<article class="folio mejora">
  <nav class="arriba">
    <a href={enlacePaso(p.id, 'juego')}>← Vista de juego</a> ·
    <a href={enlacePaso(p.id, 'concepto')}>Ficha</a>
  </nav>
  <h1>Mejora de {p.nombre || 'Sin nombre'}</h1>

  <section class="tiradas-disponibles">
    <p class="grande">Tiradas de experiencia: <strong>{e.tiradas}</strong> · entrega {e.entrega}</p>
    <div class="linea">
      El DJ concede
      <Numero
        valor={nuevas}
        min={1}
        max={10}
        etiqueta="Tiradas concedidas"
        alCambiar={(v) => (nuevas = v)}
      />
      <label
        ><input type="checkbox" bind:checked={conModificador} /> en su comunidad (Mod. de
        experiencia {hoja.atributos.modExperiencia >= 0 ? '+' : ''}{hoja.atributos
          .modExperiencia})</label
      >
      <button
        onclick={() => {
          otorgarTiradas(
            p,
            nuevas,
            conModificador,
            hoja.atributos.modExperiencia,
            hoja.fe.ordoMaximo,
          );
          mensaje = 'Tiradas concedidas: empieza una entrega nueva.';
          error = '';
        }}>Conceder</button
      >
    </div>
  </section>

  {#if mensaje}<p class="mensaje" role="status">{mensaje}</p>{/if}
  {#if error}<p class="mensaje error" role="alert">{error}</p>{/if}

  {#if pifias.length}
    <section>
      <h2>Aprender de los errores</h2>
      <p>
        Pifiadas en juego: {pifias
          .map((c) => hoja.habilidades.find((h) => h.clave === c)?.nombre ?? c)
          .join(', ')}. Reciben +1 gratis antes de las tiradas.
      </p>
      <button
        onclick={() => {
          aplicarPifias(p, catalogo, pifias);
          if (p.juego) p.juego.pifias = [];
          mensaje = 'Pifias aplicadas (+1).';
          error = '';
        }}>Aplicar +1</button
      >
    </section>
  {/if}

  <section>
    <h2>Mejorar habilidades</h2>
    <p class="detalle">
      1 tirada: 1d100 + INT ({caracteristicasActuales(p).INT}) contra el valor. Si lo iguala o
      supera, +1d4+1; si no, +1. Una vez por habilidad y entrega. Las marcadas en juego salen
      primero.
    </p>
    <ul class="lista">
      {#each habilidades as h (h.clave)}
        {@const hecha = yaTirada(p, h.clave)}
        <li class:marcada={marcadas.includes(h.clave)}>
          <span>{marcadas.includes(h.clave) ? '☑ ' : ''}{h.nombre}</span>
          <span class="valor">{h.total}%</span>
          <button
            disabled={hecha || e.tiradas < 1}
            onclick={() => hacer(mejorarHabilidad(p, catalogo, h.clave))}
            >{hecha ? 'Hecha' : 'Tirar'}</button
          >
        </li>
      {/each}
    </ul>
  </section>

  <section>
    <h2>Pasiones</h2>
    <ul class="lista">
      {#each p.pasiones as x, i (i)}
        {@const hecha = yaTirada(p, `pasion:${i}`)}
        <li>
          <span>{x.nombre}</span><span class="valor">{hoja.pasiones[i]?.valor ?? '?'}%</span>
          <button
            disabled={hecha || e.tiradas < 1}
            onclick={() => hacer(mejorarPasion(p, catalogo, i))}>{hecha ? 'Hecha' : 'Tirar'}</button
          >
        </li>
      {/each}
    </ul>
    <div class="linea">
      <input
        type="text"
        bind:value={nombrePasion}
        placeholder="Odio (el bandido que mató a su hermano)"
      />
      <select bind:value={tipoPasion} aria-label="Tipo de Pasión">
        {#each catalogo.reglas.pasiones as t, i (i)}<option value={i}>{t.objeto}</option>{/each}
      </select>
      <button
        disabled={!nombrePasion.trim() || e.tiradas < 1}
        onclick={() => {
          hacer(nuevaPasion(p, nombrePasion, tipoPasion));
          nombrePasion = '';
        }}>Nueva Pasión (1 tirada)</button
      >
    </div>
  </section>

  <section class="columnas">
    <div>
      <h2>Habilidad nueva</h2>
      <p class="detalle">
        Con un maestro o un tratado: 1 mes de estudio y {COSTE_HABILIDAD_NUEVA} tiradas. Empieza en su
        porcentaje básico.
      </p>
      <div class="linea">
        <select bind:value={nuevaHab} aria-label="Habilidad profesional">
          <option value="">Elegir…</option>
          {#each profesionalesNuevas as h (h.id)}<option value={h.id}>{h.nombre}</option>{/each}
        </select>
        {#if catalogo.habilidades.find((h) => h.id === nuevaHab)?.especialidades}
          <input type="text" bind:value={nuevaEsp} placeholder="Especialidad" />
        {/if}
        <button
          disabled={!nuevaHab || e.tiradas < COSTE_HABILIDAD_NUEVA}
          onclick={() => {
            hacer(aprenderHabilidad(p, catalogo, clave(nuevaHab, nuevaEsp.trim() || undefined)));
            nuevaHab = '';
            nuevaEsp = '';
          }}>Aprender</button
        >
      </div>
    </div>
    <div>
      <h2>Características</h2>
      <p class="detalle">
        Subir 1 punto cuesta 1 + valor actual − mínimo de la especie. El TAM no se entrena.
      </p>
      <ul class="lista compacta">
        {#each CARACTERISTICAS as c (c)}
          {@const coste = costeCaracteristica(p, catalogo, c)}
          <li>
            <span>{c} {caracteristicasActuales(p)[c]}</span>
            <button
              disabled={coste === undefined || e.tiradas < coste}
              onclick={() => hacer(mejorarCaracteristica(p, catalogo, c))}
              >{coste === undefined ? '—' : `+1 (${coste} tiradas)`}</button
            >
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section>
    <h2>Entrenamiento con maestro</h2>
    <p class="detalle">
      Una semana, sin gastar tiradas. El maestro necesita al menos un 20% más; si es profesor, su
      tirada de Enseñar mueve la fila. No se puede volver a entrenar la misma habilidad hasta que
      suba por experiencia.
    </p>
    <div class="linea">
      <select bind:value={claveEntreno} aria-label="Habilidad que entrena">
        <option value="">Habilidad…</option>
        {#each hoja.habilidades as h (h.clave)}<option
            value={h.clave}
            disabled={e.entrenadas.includes(h.clave)}>{h.nombre} ({h.total}%)</option
          >{/each}
      </select>
      Maestro al <Numero
        valor={mentor}
        min={1}
        max={200}
        etiqueta="Habilidad del maestro"
        alCambiar={(v) => (mentor = v)}
      />%
      <select bind:value={enseñar} aria-label="Tirada de Enseñar del profesor">
        <option value="ninguno">Sin tirada de Enseñar</option>
        <option value="critico">Enseñar: crítico</option>
        <option value="exito">Enseñar: éxito</option>
        <option value="fallo">Enseñar: fallo</option>
        <option value="pifia">Enseñar: pifia</option>
      </select>
      <button
        disabled={!claveEntreno}
        onclick={() => hacer(entrenar(p, catalogo, claveEntreno, mentor, enseñar))}
        >Entrenar una semana</button
      >
    </div>
  </section>

  {#if hoja.magia.fuentes.length}
    <section>
      <h2>Fórmulas</h2>
      <p class="detalle">
        Con un maestro o un grimorio: tantas semanas como la vis, una tirada de Enseñar (del maestro
        o del libro) y otra de Conocimiento (Ocultismo). Anótala cuando se superen.
      </p>
      <div class="linea">
        <select bind:value={formulaNueva} aria-label="Fórmula">
          <option value="">Fórmula que puede lanzar con sus Fuentes…</option>
          {#each formulasLanzables as f (f.id)}<option value={f.id}
              >{f.nombre} (vis {f.vis}, Rango {f.rango}){f.goecia ? ' ✠' : ''}</option
            >{/each}
        </select>
        <input type="text" bind:value={comoFormula} aria-label="Cómo la aprende" />
        <button
          disabled={!formulaNueva}
          onclick={() => {
            hacer(aprenderFormula(p, catalogo, formulaNueva, comoFormula));
            formulaNueva = '';
          }}>Anotar</button
        >
      </div>
    </section>
  {/if}

  {#if hoja.fe.puedeObrar}
    <section>
      <h2>Ordos de fe</h2>
      <p>
        Conoce hasta el ordo {hoja.fe.ordoMaximo}; sus PF y su Teología le permitirían el {hoja.fe
          .ordoAlcanzable}.
      </p>
      <button
        disabled={hoja.fe.ordoAlcanzable <= hoja.fe.ordoMaximo}
        onclick={() => hacer(aprenderOrdo(p, hoja.fe.ordoMaximo, hoja.fe.ordoAlcanzable))}
      >
        Aprender el siguiente ordo (tras estudiar y superar la tirada de Fe)
      </button>
    </section>
  {/if}

  <section>
    <h2>Historial</h2>
    {#if e.historial.length === 0}<p class="detalle">Aún no hay cambios.</p>{/if}
    <table class="historial">
      <tbody>
        {#each [...e.historial].reverse() as c, i (i)}
          <tr
            ><td>{fecha(c.fecha)}</td><td>Entrega {c.entrega}</td><td>{c.detalle}</td><td
              >{c.coste ? `−${c.coste}` : ''}</td
            ></tr
          >
        {/each}
      </tbody>
    </table>
  </section>
</article>

<style>
  .mejora {
    margin: 1.5rem auto;
  }
  .arriba {
    font-size: 0.95em;
  }
  .grande {
    font-size: 1.2em;
  }
  section {
    margin-top: 1.2rem;
  }
  h2 {
    font-size: 1.4rem;
    margin: 0.4rem 0;
  }
  .linea {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .lista {
    list-style: none;
    padding: 0;
    columns: 2;
    column-gap: 2rem;
  }
  .lista li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    break-inside: avoid;
    border-bottom: 1px dotted var(--borde);
    padding: 0.1rem 0;
  }
  .lista li span:first-child {
    flex: 1;
  }
  .lista button {
    font-size: 0.85em;
    padding: 0.05em 0.6em;
  }
  .lista.compacta {
    columns: 1;
  }
  .marcada {
    font-weight: 600;
  }
  .valor {
    color: var(--rubrica);
    font-variant-numeric: tabular-nums;
  }
  .columnas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  .mensaje {
    border-left: 3px solid var(--oro);
    padding-left: 0.6rem;
  }
  .mensaje.error {
    border-color: var(--rubrica);
    color: var(--rubrica);
  }
  .historial {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92em;
  }
  .historial td {
    border-bottom: 1px solid var(--borde);
    padding: 0.2rem 0.4rem;
  }
</style>
