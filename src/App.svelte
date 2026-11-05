<script lang="ts">
  import { onMount } from 'svelte';
  import { ES_DJ, cargarModuloDJ } from './edicion';
  import Biblioteca from './ui/Biblioteca.svelte';
  import Asistente from './ui/asistente/Asistente.svelte';
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
  let avisoDJ = $state('');

  $effect(() => {
    document.documentElement.dataset.tema = tema;
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  });

  onMount(() => {
    if (ES_DJ) cargarModuloDJ().then((m) => (avisoDJ = m?.descripcion ?? ''));
  });

  const vista = $derived(ruta.partes[0] ?? '');
  const secciones = [
    { hash: '#/', nombre: 'Mis personajes', vista: '' },
    { hash: '#/reglas', nombre: 'Consulta de reglas', vista: 'reglas' },
  ];
</script>

<header class="cabecera no-imprimir">
  <a class="marca" href="#/">Taller de Personajes</a>
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

{#if vista === 'personaje' && ruta.partes[1]}
  <Asistente id={ruta.partes[1]} paso={ruta.partes[2] ?? 'concepto'} />
{:else}
  <main class="pagina">
    {#if vista === 'reglas'}
      <article class="folio">
        <h1>Consulta de reglas</h1>
        <p>El buscador de reglas llegará en la fase 6.</p>
      </article>
    {:else if vista === 'dj' && ES_DJ}
      <article class="folio">
        <h1>Mesa del DJ</h1>
        <p><em>{avisoDJ}</em></p>
      </article>
    {:else}
      <Biblioteca />
    {/if}
  </main>
{/if}

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
  .pagina {
    padding: 2.5rem 2rem;
  }
</style>
