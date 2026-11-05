<script lang="ts">
  import { untrack } from 'svelte';
  import { biblioteca } from '../../almacen/biblioteca.svelte';
  import { catalogo } from '../../datos/catalogo';
  import { calcularHoja } from '../../motor/hoja';
  import type { Personaje } from '../../motor/personaje';
  import Problemas from '../comunes/Problemas.svelte';
  import { enlacePaso, ruta } from '../ruta.svelte';
  import { estadoPaso, pasosVisibles } from './pasos';
  import Resumen from './Resumen.svelte';
  import PasoConcepto from './PasoConcepto.svelte';
  import PasoCaracteristicas from './PasoCaracteristicas.svelte';
  import PasoAtributos from './PasoAtributos.svelte';
  import PasoOrigen from './PasoOrigen.svelte';
  import PasoTrasfondo from './PasoTrasfondo.svelte';
  import PasoCarrera from './PasoCarrera.svelte';
  import PasoHabilidades from './PasoHabilidades.svelte';
  import PasoPasiones from './PasoPasiones.svelte';
  import PasoMagia from './PasoMagia.svelte';
  import PasoEquipo from './PasoEquipo.svelte';

  interface Props {
    original: Personaje;
    paso: string;
  }
  let { original, paso }: Props = $props();

  // Copia propia del personaje: se edita aquí y se guarda en la biblioteca.
  let p = $state<Personaje>(structuredClone(untrack(() => $state.snapshot(original)) as Personaje));

  // Autoguardado: cualquier cambio en el personaje se guarda al poco tiempo.
  $effect(() => {
    JSON.stringify(p); // lee todo el objeto para seguir los cambios en profundidad
    const t = setTimeout(() => biblioteca.actualizar(p), 300);
    return () => clearTimeout(t);
  });

  const hoja = $derived(calcularHoja(p, catalogo));
  const pasos = $derived(pasosVisibles(p, catalogo));
  const indice = $derived(
    Math.max(
      0,
      pasos.findIndex((x) => x.id === paso),
    ),
  );
  const actual = $derived(pasos[indice]);
  const propios = $derived(
    actual ? hoja.problemas.filter((x) => actual.problemas.includes(x.paso)) : [],
  );

  function ir(delta: number) {
    const destino = pasos[indice + delta];
    if (destino) ruta.ir(enlacePaso(p.id, destino.id));
  }

  function teclado(e: KeyboardEvent) {
    // Ctrl + ← / → cambia de paso, salvo dentro de un campo de texto (donde mueve el cursor).
    const t = e.target as HTMLElement;
    if (
      !e.ctrlKey ||
      e.altKey ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) ||
      t.isContentEditable
    )
      return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      ir(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      ir(-1);
    }
  }
</script>

<svelte:window onkeydown={teclado} />

<div class="asistente">
  <nav class="pasos" aria-label="Pasos de la creación">
    <a class="volver" href="#/">← Mis personajes</a>
    <ol>
      {#each pasos as d, i (d.id)}
        {@const estado = estadoPaso(d, hoja.problemas)}
        <li>
          <a
            href={enlacePaso(p.id, d.id)}
            aria-current={d.id === actual?.id ? 'step' : undefined}
            class={estado}
          >
            <span class="num">{i + 1}</span>
            <span class="titulo">{d.titulo}</span>
            <span
              class="estado"
              title={estado === 'ok'
                ? 'Completo'
                : estado === 'aviso'
                  ? 'Con avisos'
                  : 'Por resolver'}>{estado === 'ok' ? '✓' : estado === 'aviso' ? '!' : '·'}</span
            >
          </a>
        </li>
      {/each}
    </ol>
    <p class="atajo">Ctrl + ← / → para cambiar de paso</p>
  </nav>

  <main class="formulario">
    <article class="folio">
      <h1>{actual?.titulo}</h1>
      {#if actual?.id === 'concepto'}<PasoConcepto bind:p />
      {:else if actual?.id === 'caracteristicas'}<PasoCaracteristicas bind:p />
      {:else if actual?.id === 'atributos'}<PasoAtributos {p} {hoja} />
      {:else if actual?.id === 'origen'}<PasoOrigen bind:p />
      {:else if actual?.id === 'trasfondo'}<PasoTrasfondo bind:p />
      {:else if actual?.id === 'carrera'}<PasoCarrera bind:p />
      {:else if actual?.id === 'habilidades'}<PasoHabilidades bind:p {hoja} />
      {:else if actual?.id === 'pasiones'}<PasoPasiones bind:p {hoja} />
      {:else if actual?.id === 'magia'}<PasoMagia bind:p {hoja} />
      {:else if actual?.id === 'equipo'}<PasoEquipo bind:p {hoja} />
      {/if}

      <section class="revision" aria-live="polite">
        <h2>Revisión de este paso</h2>
        <Problemas problemas={propios} vacio="Nada que corregir en este paso." />
      </section>

      <div class="navegacion">
        <button disabled={indice === 0} onclick={() => ir(-1)}>← Anterior</button>
        <button disabled={indice >= pasos.length - 1} onclick={() => ir(1)}>Siguiente →</button>
      </div>
    </article>
  </main>

  <aside class="resumen" aria-label="Resumen de la ficha">
    <Resumen {p} {hoja} />
  </aside>
</div>

<style>
  .asistente {
    display: grid;
    grid-template-columns: 14rem minmax(0, 1fr) 20rem;
    gap: 1.5rem;
    align-items: start;
    padding: 1.5rem;
  }
  .pasos,
  .resumen {
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 2rem);
    overflow: auto;
  }
  .volver {
    display: block;
    margin-bottom: 0.8rem;
  }
  ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  ol a {
    display: grid;
    grid-template-columns: 1.6rem 1fr 1.2rem;
    align-items: center;
    padding: 0.35rem 0.5rem;
    color: var(--tinta);
    text-decoration: none;
    border-left: 3px solid transparent;
  }
  ol a:hover {
    background: var(--pergamino-hondo);
  }
  ol a[aria-current='step'] {
    border-left-color: var(--rubrica);
    background: var(--pergamino-hondo);
    font-weight: 600;
  }
  .num {
    font-family: var(--letra-titulo);
    color: var(--rubrica);
  }
  .estado {
    text-align: center;
  }
  a.ok .estado {
    color: var(--tinta-suave);
  }
  a.aviso .estado {
    color: var(--oro);
    font-weight: 600;
  }
  a.error .estado {
    color: var(--rubrica);
  }
  .atajo {
    font-size: 0.8em;
    color: var(--tinta-suave);
    margin-top: 1rem;
  }
  .formulario .folio {
    max-width: none;
    margin: 0;
  }
  .formulario h1 {
    text-align: left;
    font-size: 2.4rem;
  }
  .revision {
    margin-top: 2rem;
    border-top: 1px solid var(--borde);
  }
  .revision h2 {
    font-size: 1.3rem;
  }
  .navegacion {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
  }
  @media (max-width: 1100px) {
    .asistente {
      grid-template-columns: minmax(0, 1fr);
    }
    .pasos,
    .resumen {
      position: static;
      max-height: none;
    }
    ol {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }
  }
</style>
