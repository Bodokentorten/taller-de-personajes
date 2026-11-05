<script lang="ts">
  import { onMount } from 'svelte';
  import { EDICION, ES_DJ, cargarModuloDJ } from './edicion';
  import { tirar } from './motor/dados';

  type Tema = 'pergamino' | 'vela';

  const CLAVE_TEMA = 'taller.tema';

  function leerTema(): Tema {
    try {
      return localStorage.getItem(CLAVE_TEMA) === 'vela' ? 'vela' : 'pergamino';
    } catch {
      return 'pergamino';
    }
  }

  let tema = $state<Tema>(leerTema());
  let ruta = $state(location.hash || '#/');
  let tirada = $state<string>('');
  let avisoDJ = $state<string>('');

  $effect(() => {
    document.documentElement.dataset.tema = tema;
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  });

  onMount(() => {
    const alCambiar = () => (ruta = location.hash || '#/');
    window.addEventListener('hashchange', alCambiar);
    if (ES_DJ) {
      cargarModuloDJ().then((m) => (avisoDJ = m?.descripcion ?? ''));
    }
    return () => window.removeEventListener('hashchange', alCambiar);
  });

  function tirarPrueba() {
    const t = tirar('3d6');
    tirada = `3d6 → ${t.dados.join(' + ')} = ${t.total}`;
  }

  const secciones = [
    { hash: '#/', nombre: 'Portada' },
    { hash: '#/biblioteca', nombre: 'Mis personajes' },
    { hash: '#/crear', nombre: 'Crear personaje' },
    { hash: '#/reglas', nombre: 'Consulta de reglas' },
  ];
</script>

<header class="cabecera no-imprimir">
  <a class="marca" href="#/">Taller de Personajes</a>
  <nav>
    {#each secciones as s (s.hash)}
      <a href={s.hash} aria-current={ruta === s.hash ? 'page' : undefined}>{s.nombre}</a>
    {/each}
    {#if ES_DJ}
      <a href="#/dj" aria-current={ruta === '#/dj' ? 'page' : undefined}>Mesa del DJ</a>
    {/if}
  </nav>
  <button
    onclick={() => (tema = tema === 'vela' ? 'pergamino' : 'vela')}
    title="Cambiar entre pergamino y luz de vela"
  >
    {tema === 'vela' ? '☀ Pergamino' : '🕯 Vela'}
  </button>
</header>

<main>
  <article class="folio">
    <h1>Taller de Personajes</h1>
    <p class="subtitulo">Mythras · Reinos hispánicos del siglo XIV</p>

    <p class="capitular">
      Bienvenido, viajero. En este taller se forjan los hombres y mujeres que recorrerán los caminos
      de Castilla, Aragón, Navarra, Portugal y Granada: hidalgos sin fortuna, almogávares de la
      frontera, físicos judíos, goliardos y saludadoras. Aquí podrás crear tu personaje paso a paso,
      llevarlo a la mesa e imprimir su ficha.
    </p>

    <section class="estado">
      <h2>Estado de la obra</h2>
      <p>
        Fase 0 completada: el andamiaje está listo. Ruta actual: <code>{ruta}</code> · Edición:
        <strong>{EDICION}</strong>
      </p>
      {#if avisoDJ}<p><em>{avisoDJ}</em></p>{/if}
      <button onclick={tirarPrueba}>Tirar 3d6 de prueba</button>
      {#if tirada}<p class="tirada">{tirada}</p>{/if}
    </section>
  </article>
</main>

<style>
  .cabecera {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.6rem 2rem;
    border-bottom: 2px double var(--borde);
    background: var(--pergamino-hondo);
  }
  .marca {
    font-family: var(--letra-titulo);
    font-size: 1.6rem;
    text-decoration: none;
  }
  nav {
    display: flex;
    gap: 1.2rem;
    flex: 1;
    flex-wrap: wrap;
  }
  nav a {
    color: var(--tinta-suave);
    text-decoration: none;
  }
  nav a[aria-current='page'],
  nav a:hover {
    color: var(--rubrica);
    text-decoration: underline;
  }
  main {
    padding: 2.5rem 2rem;
  }
  .folio {
    max-width: 52rem;
    margin: 0 auto;
    padding: 2.5rem 3rem;
    border: 1px solid var(--borde);
    outline: 1px solid var(--borde);
    outline-offset: 5px;
    background: var(--pergamino);
    box-shadow: 0 6px 24px var(--sombra);
  }
  h1 {
    font-size: 3rem;
    margin: 0;
    text-align: center;
  }
  .subtitulo {
    text-align: center;
    font-style: italic;
    color: var(--tinta-suave);
    margin-top: 0.2rem;
  }
  .estado {
    margin-top: 2rem;
    border-top: 1px solid var(--borde);
  }
  .tirada {
    font-variant-numeric: tabular-nums;
    color: var(--rubrica);
  }
</style>
