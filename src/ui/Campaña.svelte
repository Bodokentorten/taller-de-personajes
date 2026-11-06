<script lang="ts">
  // Campaña activa: la que fija el DJ con un enlace (#/campana/<código>) o un archivo JSON.
  import { decodificarCampaña, normalizarCampaña } from '../almacen/campaña';
  import { campaña } from '../almacen/campaña.svelte';
  import { catalogo } from '../datos/catalogo';
  import { CAMPAÑA_POR_DEFECTO, type Campaña } from '../motor/personaje';
  import { ruta } from './ruta.svelte';

  let { codigo }: { codigo?: string } = $props();

  const propuesta = $derived.by((): { c?: Campaña; error?: string } => {
    if (!codigo) return {};
    try {
      return { c: decodificarCampaña(codigo) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  });
  let mensaje = $state('');
  let entrada: HTMLInputElement | undefined = $state();

  async function importar(e: Event) {
    const archivo = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!archivo) return;
    try {
      campaña.fijar(normalizarCampaña(JSON.parse(await archivo.text())));
      mensaje = 'Campaña cargada desde el archivo.';
    } catch {
      mensaje = 'El archivo no es una campaña válida.';
    }
  }

  const nombres = (lista: { id: string; nombre: string }[], ids?: string[], todos = 'todos') =>
    ids?.length ? ids.map((id) => lista.find((x) => x.id === id)?.nombre ?? id).join(', ') : todos;
  const METODOS: Record<string, string> = {
    estandar: 'estándar',
    piramide: 'pirámide',
    compra: 'compra de puntos',
    tirada: 'tirada',
    manual: 'manual',
  };
</script>

{#snippet resumen(c: Campaña)}
  <dl>
    {#if c.nombre}<dt>Campaña</dt>
      <dd>{c.nombre}</dd>{/if}
    {#if c.año}<dt>Año</dt>
      <dd>{c.año}</dd>{/if}
    <dt>Características</dt>
    <dd>{c.metodosCaracteristicas.map((m) => METODOS[m]).join(', ')}</dd>
    <dt>Habilidades</dt>
    <dd>{c.metodosHabilidades.map((m) => METODOS[m]).join(', ')}</dd>
    <dt>Magia en los PJ</dt>
    <dd>{c.permitirMagia ? 'sí' : 'no'}</dd>
    <dt>Restricciones de sexo</dt>
    <dd>{c.restriccionesSexo ? 'se aplican' : 'no se aplican'}</dd>
    <dt>Hidalguía vasca</dt>
    <dd>{c.hidalguiaVasca ? 'sí' : 'no'}</dd>
    <dt>Repetir el trasfondo</dt>
    <dd>{c.repetirTrasfondo ? 'sí' : 'no'}</dd>
    <dt>Carreras</dt>
    <dd>{nombres(catalogo.carreras, c.carrerasPermitidas, 'todas')}</dd>
    <dt>Pueblos</dt>
    <dd>{nombres(catalogo.pueblos, c.pueblosPermitidos)}</dd>
  </dl>
{/snippet}

<article class="folio">
  <h1>Campaña</h1>
  <p class="subtitulo">Las reglas de la mesa que fija el DJ</p>

  {#if propuesta.error}
    <p class="mensaje error" role="alert">{propuesta.error}</p>
  {:else if propuesta.c}
    <section class="propuesta">
      <h2>El DJ te propone esta campaña</h2>
      {@render resumen(propuesta.c)}
      <button
        class="principal"
        onclick={() => {
          campaña.fijar(propuesta.c!);
          mensaje = 'Campaña aplicada.';
          ruta.ir('#/campana');
        }}
      >
        Usar esta campaña
      </button>
    </section>
  {/if}

  <h2>Campaña activa en este navegador</h2>
  {@render resumen(campaña.actual)}
  <div class="acciones">
    <button onclick={() => entrada?.click()}>Cargar archivo de campaña…</button>
    <input
      bind:this={entrada}
      type="file"
      accept=".json,application/json"
      hidden
      onchange={importar}
    />
    <button
      onclick={() => {
        campaña.restablecer();
        mensaje = 'Vuelves a las reglas por defecto.';
      }}
      disabled={JSON.stringify(campaña.actual) === JSON.stringify(CAMPAÑA_POR_DEFECTO)}
      >Reglas por defecto</button
    >
  </div>
  {#if mensaje}<p class="mensaje" role="status">{mensaje}</p>{/if}
</article>

<style>
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.3rem 1.2rem;
  }
  dt {
    font-weight: 600;
    color: var(--tinta-suave);
  }
  dd {
    margin: 0;
  }
  .propuesta {
    border: 1px solid var(--rubrica);
    padding: 0.5rem 1rem 1rem;
    margin: 1rem 0;
  }
  .acciones {
    display: flex;
    gap: 0.8rem;
    margin-top: 1rem;
  }
  .mensaje {
    border-left: 3px solid var(--oro);
    padding-left: 0.6rem;
  }
  .mensaje.error {
    border-color: var(--rubrica);
  }
</style>
