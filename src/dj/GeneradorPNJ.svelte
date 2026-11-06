<script lang="ts">
  import { descargar, nombreArchivo } from '../almacen/biblioteca.svelte';
  import { campaña } from '../almacen/campaña.svelte';
  import { catalogo } from '../datos/catalogo';
  import { CARACTERISTICAS } from '../datos/tipos';
  import { ARQUETIPOS, NIVELES } from './arquetipos';
  import { datosDJ } from './datos';
  import { exportarPNJ, generarPNJ, sociedadesPosibles, type OpcionesPNJ, type PNJ } from './pnj';

  let opciones = $state<OpcionesPNJ>({
    arquetipo: 'azar',
    nivel: 'curtido',
    reino: 'azar',
    año: campaña.actual.año ?? 1360,
    sexo: 'azar',
    sociedad: 'ninguna',
  });
  let cuantos = $state(1);
  let partida = $state(campaña.actual.nombre ?? '');
  let generados = $state<PNJ[]>([]);
  let mensaje = $state('');

  const sociedades = $derived(sociedadesPosibles(datosDJ.sociedades, opciones.año));

  function generar() {
    generados = Array.from({ length: cuantos }, () =>
      generarPNJ($state.snapshot(opciones) as OpcionesPNJ, catalogo, datosDJ.sociedades),
    );
    mensaje = '';
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      mensaje = 'Copiado: pégalo en una nota nueva del vault.';
    } catch {
      mensaje = 'No se ha podido copiar.';
    }
  }
</script>

<section class="opciones">
  <label
    >Arquetipo
    <select bind:value={opciones.arquetipo}>
      <option value="azar">Al azar</option>
      {#each ARQUETIPOS as a (a.id)}<option value={a.id}>{a.nombre}</option>{/each}
    </select>
  </label>
  <label
    >Nivel
    <select bind:value={opciones.nivel}
      >{#each NIVELES as n (n.id)}<option value={n.id}>{n.nombre}</option>{/each}</select
    >
  </label>
  <label
    >Reino
    <select bind:value={opciones.reino}>
      <option value="azar">Al azar (según población)</option>
      {#each catalogo.reinos as r (r.id)}<option value={r.id}>{r.nombre}</option>{/each}
    </select>
  </label>
  <label>Año <input type="number" min="1300" max="1400" bind:value={opciones.año} /></label>
  <label
    >Sexo
    <select bind:value={opciones.sexo}>
      <option value="azar">Al azar</option><option value="varon">Varón</option><option value="mujer"
        >Mujer</option
      >
    </select>
  </label>
  <label
    >Sociedad secreta
    <select bind:value={opciones.sociedad}>
      <option value="ninguna">Ninguna</option>
      <option value="azar">Quizá (1 de cada 4)</option>
      {#each sociedades as s (s.id)}<option value={s.id}>{s.nombre}</option>{/each}
    </select>
  </label>
  <label>Cuántos <input type="number" min="1" max="20" bind:value={cuantos} /></label>
  <label>Partida (para el enlace) <input type="text" bind:value={partida} /></label>
  <button class="principal" onclick={generar}>🎲 Generar</button>
</section>
{#if !datosDJ.sociedades.length}
  <p class="aviso">
    No hay datos del DJ (src/datos/dj): ejecuta <code>npm run extraer</code> para tener las sociedades.
  </p>
{/if}

{#if generados.length > 1}
  <p>
    <button onclick={() => copiar(generados.map((x) => exportarPNJ(x, partida)).join('\n\n'))}
      >Copiar los {generados.length} en Markdown</button
    >
  </p>
{/if}
{#if mensaje}<p class="mensaje" role="status">{mensaje}</p>{/if}

<div class="pnjs">
  {#each generados as x, i (i)}
    <article class="pnj">
      <header>
        <h2>{x.nombre}</h2>
        <p class="detalle">
          {x.arquetipo} · {x.nivel} · {x.sexo === 'mujer' ? 'mujer' : 'varón'} de {x.edad} años
        </p>
        <p class="detalle">
          {x.pueblo} ({x.reino}) · {x.credo} · {x.cultura} · {x.clase} · {x.carrera.nombre}
        </p>
      </header>
      <table class="cars">
        <tbody>
          <tr
            >{#each CARACTERISTICAS as c (c)}<th>{c}</th>{/each}<th>PA</th><th>MD</th><th>Ini</th
            ></tr
          >
          <tr
            >{#each CARACTERISTICAS as c (c)}<td>{x.caracteristicas[c]}</td>{/each}<td
              >{x.atributos.puntosAccion}</td
            ><td>{x.atributos.modDano}</td><td>{x.atributos.iniciativa}</td></tr
          >
        </tbody>
      </table>
      <p>
        <strong>Habilidades:</strong>
        {x.habilidades.map((h) => `${h.nombre} ${h.valor}%`).join(', ')}
      </p>
      {#if x.estilo}<p>
          <strong>Estilo:</strong>
          {x.estilo.nombre}
          {x.estilo.valor}% <em>({x.estilo.armas.join(', ')})</em>
        </p>{/if}
      <p>
        <strong>Pasiones:</strong>
        {x.pasiones.map((p) => `${p.nombre} ${p.valor}%`).join(', ')}
      </p>
      {#if x.formulas.length}<p>
          <strong>Fórmulas:</strong>
          {x.formulas.map((f) => f.nombre).join(', ')}
        </p>{/if}
      <p><strong>Equipo:</strong> {x.equipo} · <strong>Armadura:</strong> {x.armadura}</p>
      <p>
        <strong>Aspecto:</strong>
        {x.aspecto}. {x.personalidad}. <strong>Quiere:</strong>
        {x.motivacion}.
      </p>
      <p class="secreto"><strong>Secreto:</strong> {x.secreto}</p>
      <p><strong>Gancho:</strong> {x.gancho}</p>
      {#each x.avisos as a, j (j)}<p class="aviso">{a}</p>{/each}
      <div class="acciones">
        <button onclick={() => copiar(exportarPNJ(x, partida))}>Copiar Markdown</button>
        <button
          onclick={() =>
            descargar(nombreArchivo(x.nombre, 'md'), exportarPNJ(x, partida), 'text/markdown')}
          >Descargar .md</button
        >
      </div>
    </article>
  {/each}
</div>

<style>
  .opciones {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem 1.2rem;
    align-items: end;
  }
  .opciones label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .opciones input[type='number'] {
    width: 5.5rem;
  }
  .pnjs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  .pnj {
    border: 1px solid var(--borde);
    background: var(--pergamino);
    padding: 0.8rem 1rem;
  }
  .pnj h2 {
    margin: 0;
    font-size: 1.5rem;
  }
  .pnj p {
    margin: 0.3rem 0;
  }
  .cars {
    border-collapse: collapse;
    margin: 0.4rem 0;
  }
  .cars th,
  .cars td {
    border: 1px solid var(--borde);
    padding: 0 0.4rem;
    text-align: center;
    font-size: 0.9em;
  }
  .secreto {
    border-left: 3px solid var(--rubrica);
    padding-left: 0.5rem;
    background: color-mix(in srgb, var(--rubrica) 6%, transparent);
  }
  .aviso {
    color: var(--rubrica);
    font-size: 0.9em;
  }
  .acciones {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .mensaje {
    border-left: 3px solid var(--oro);
    padding-left: 0.6rem;
  }
</style>
