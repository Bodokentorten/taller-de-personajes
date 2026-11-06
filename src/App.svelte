<script lang="ts">
  import { onMount } from 'svelte';
  import { ES_DJ, cargarModuloDJ } from './edicion';
  import Biblioteca from './ui/Biblioteca.svelte';
  import Asistente from './ui/asistente/Asistente.svelte';
  import FichaImprimible from './ui/ficha/FichaImprimible.svelte';
  import Reglas from './ui/reglas/Reglas.svelte';
  import Campaña from './ui/Campaña.svelte';
  import Guia from './ui/Guia.svelte';
  import Calculadora from './ui/hechizos/Calculadora.svelte';
  import { ruta } from './ui/ruta.svelte';

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
  // Módulo del DJ: se carga solo en esa edición (en la de jugador ni siquiera existe en el paquete).
  let moduloDJ = $state<Awaited<ReturnType<typeof cargarModuloDJ>>>(null);

  $effect(() => {
    document.documentElement.dataset.tema = tema;
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  });

  onMount(() => {
    if (ES_DJ) cargarModuloDJ().then((m) => (moduloDJ = m));
  });

  const vista = $derived(ruta.partes[0] ?? '');
  const secciones = [
    { hash: '#/', nombre: 'Mis personajes', vista: '' },
    { hash: '#/reglas', nombre: 'Consulta de reglas', vista: 'reglas' },
    { hash: '#/campana', nombre: 'Campaña', vista: 'campana' },
    { hash: '#/guia', nombre: 'Guía', vista: 'guia' },
  ];
</script>

<a
  class="saltar no-imprimir"
  href="#contenido"
  onclick={(e) => {
    e.preventDefault();
    document.getElementById('contenido')?.focus();
  }}>Saltar al contenido</a
>
<header class="cabecera no-imprimir">
  <a class="marca" href="#/"
    ><img src="./favicon.svg" alt="" width="28" height="28" /> Taller de Personajes</a
  >
  <nav>
    {#each secciones as s (s.hash)}
      <a
        href={s.hash}
        aria-current={vista === s.vista || (s.vista === '' && vista === 'personaje')
          ? 'page'
          : undefined}>{s.nombre}</a
      >
    {/each}
    {#if ES_DJ}
      <a href="#/dj" aria-current={vista === 'dj' ? 'page' : undefined}>Mesa del DJ</a>
    {/if}
  </nav>
  <button
    onclick={() => (tema = tema === 'vela' ? 'pergamino' : 'vela')}
    title="Cambiar entre pergamino y luz de vela"
  >
    {tema === 'vela' ? '☀ Pergamino' : '🕯 Vela'}
  </button>
</header>

<div id="contenido" tabindex="-1">
  {#if vista === 'personaje' && ruta.partes[1] && ruta.partes[2] === 'imprimir'}
    <FichaImprimible id={ruta.partes[1]} />
  {:else if vista === 'reglas'}
    <Reglas tipo={ruta.partes[1]} id={ruta.partes[2]} />
  {:else if vista === 'personaje' && ruta.partes[1]}
    <Asistente id={ruta.partes[1]} paso={ruta.partes[2] ?? 'concepto'} />
  {:else}
    <main class="pagina">
      {#if vista === 'hechizos'}
        <Calculadora id={ruta.partes[1]} />
      {:else if vista === 'guia'}
        <Guia />
      {:else if vista === 'campana'}
        <Campaña codigo={ruta.partes[1]} />
      {:else if vista === 'dj' && ES_DJ}
        {#if moduloDJ}<moduloDJ.Mesa />{:else}<p>Cargando la mesa del DJ…</p>{/if}
      {:else}
        <Biblioteca />
      {/if}
    </main>
  {/if}
</div>

<style>
  .cabecera {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.6rem 2rem;
    border-bottom: 2px double var(--borde);
    background: var(--pergamino-hondo);
  }
  .saltar {
    position: absolute;
    left: 0.5rem;
    top: -3rem;
    z-index: 10;
    padding: 0.4rem 0.8rem;
    background: var(--pergamino);
    border: 2px solid var(--oro);
  }
  .saltar:focus {
    top: 0.5rem;
  }
  #contenido:focus {
    outline: none;
  }
  .marca {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
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
  .pagina {
    padding: 2.5rem 2rem;
  }
  @media (max-width: 600px) {
    .cabecera {
      flex-wrap: wrap;
      gap: 0.4rem 1rem;
      padding: 0.5rem 0.8rem;
    }
    .marca {
      font-size: 1.3rem;
      flex: 1;
    }
    nav {
      order: 3;
      flex-basis: 100%;
      gap: 0.4rem 1rem;
      font-size: 0.95rem;
    }
    .pagina {
      padding: 1rem 0.5rem;
    }
  }
</style>
