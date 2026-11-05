<script lang="ts">
  import { catalogo } from '../../datos/catalogo';
  import type { ItemHabilidad } from '../../datos/tipos';
  import { idiomasGratis } from '../../motor/habilidades';
  import type { Hoja } from '../../motor/hoja';
  import {
    partirClave,
    type Fuente,
    type MetodoHabilidades,
    type Personaje,
  } from '../../motor/personaje';
  import FilaReparto from './FilaReparto.svelte';
  import Piramide from './Piramide.svelte';
  import { gastados } from './puntos';

  let { p = $bindable(), hoja }: { p: Personaje; hoja: Hoja } = $props();

  const cultura = $derived(catalogo.culturas.find((c) => c.id === p.origen.cultura));
  const carrera = $derived(catalogo.carreras.find((c) => c.id === p.carrera));
  const edad = $derived(catalogo.reglas.edades.find((e) => e.id === p.categoriaEdad));
  let pestaña = $state<Fuente>('cultura');
  let confirmarCambio = $state<MetodoHabilidades | ''>('');

  function cambiarMetodo(m: MetodoHabilidades) {
    if (m === p.metodoHabilidades) return;
    if (p.asignaciones.length && confirmarCambio !== m) {
      confirmarCambio = m;
      return;
    }
    p.metodoHabilidades = m;
    p.asignaciones = [];
    p.pasiones = p.pasiones.map((x) => ({ ...x, extra: undefined }));
    confirmarCambio = '';
  }

  // Listas de cada pestaña
  const elecciones = $derived(cultura?.estandar_eleccion ?? []);
  const itemsCultura = $derived<ItemHabilidad[]>(
    cultura
      ? [
          ...cultura.automaticas.map((a) => ({ habilidad: a.habilidad })),
          ...cultura.estandar,
          ...p.eleccionesCultura
            .filter((e) => elecciones.some((x) => x.opciones.includes(e)))
            .map((e) => ({ habilidad: e })),
          { habilidad: 'estilo-de-combate' },
        ]
      : [],
  );
  const estilosCarrera = $derived(
    catalogo.estilos.filter((e) => e.tipo !== 'raro').map((e) => e.id),
  );

  /** Puntos adicionales: estándar (sin especialidad) y lo que ya da la cultura, la carrera o el origen. */
  const itemsAdicional = $derived.by(() => {
    const pueblo = catalogo.pueblos.find((x) => x.id === p.origen.pueblo);
    const conocidas = new Set([
      ...p.asignaciones
        .filter((a) => a.fuente === 'cultura' || a.fuente === 'carrera')
        .map((a) => a.clave),
      ...idiomasGratis(pueblo, p.lenguaMaterna).map((i) => i.clave),
    ]);
    const estandar = catalogo.habilidades
      .filter((h) => h.tipo === 'estandar' && !h.especialidades)
      .map((h) => h.id);
    const extra = [...conocidas].filter((c) => !estandar.includes(c));
    return [...estandar, ...extra.sort()].map((c) => {
      const { habilidad: hab, especialidad } = partirClave(c);
      return { habilidad: hab, especialidad } as ItemHabilidad;
    });
  });

  function alternarEleccion(id: string, n: number, opciones: string[]) {
    const actuales = p.eleccionesCultura.filter((e) => opciones.includes(e));
    if (p.eleccionesCultura.includes(id)) {
      p.eleccionesCultura = p.eleccionesCultura.filter((e) => e !== id);
      p.asignaciones = p.asignaciones.filter((a) => !(a.fuente === 'cultura' && a.clave === id));
    } else if (actuales.length < n) {
      p.eleccionesCultura = [...p.eleccionesCultura, id];
    }
  }

  const barras = $derived([
    {
      id: 'cultura' as const,
      nombre: 'Cultura',
      total: cultura?.puntos ?? 100,
      max: cultura?.max_por_habilidad ?? 15,
    },
    {
      id: 'carrera' as const,
      nombre: 'Carrera',
      total: carrera?.puntos ?? 100,
      max: carrera?.max_por_habilidad ?? 15,
    },
    {
      id: 'adicional' as const,
      nombre: `Adicionales (${edad?.categoria ?? '—'})`,
      total: edad?.puntos ?? 150,
      max: edad?.max_incremento ?? 15,
    },
  ]);
  const barra = $derived(barras.find((b) => b.id === pestaña)!);
</script>

<fieldset class="metodos">
  <legend>Método de reparto</legend>
  <label
    ><input
      type="radio"
      checked={p.metodoHabilidades === 'estandar'}
      onchange={() => cambiarMetodo('estandar')}
    /> Estándar (cultura 100 + carrera 100 + adicionales)</label
  >
  <label
    ><input
      type="radio"
      checked={p.metodoHabilidades === 'piramide'}
      onchange={() => cambiarMetodo('piramide')}
    /> Pirámide de habilidades</label
  >
</fieldset>
{#if confirmarCambio}
  <p class="confirmar" role="alert">
    Cambiar de método borra todos los puntos repartidos.
    <button type="button" onclick={() => cambiarMetodo(confirmarCambio as MetodoHabilidades)}
      >Sí, cambiar</button
    >
    <button type="button" onclick={() => (confirmarCambio = '')}>No</button>
  </p>
{/if}

{#if p.metodoHabilidades === 'piramide'}
  <Piramide bind:p {hoja} />
{:else if !cultura || !carrera}
  <p>Elige antes la cultura (paso «Origen y cultura») y la carrera.</p>
{:else}
  <div class="pestañas" role="tablist">
    {#each barras as b (b.id)}
      {@const g = gastados(p, b.id)}
      <button
        type="button"
        role="tab"
        aria-selected={pestaña === b.id}
        onclick={() => (pestaña = b.id)}
      >
        {b.nombre}
        <span class="contador" class:completo={g === b.total} class:exceso={g > b.total}
          >{g}/{b.total}</span
        >
        <span class="barra" style={`--lleno: ${Math.min(100, (g / b.total) * 100)}%`}></span>
      </button>
    {/each}
  </div>

  {#if pestaña === 'cultura'}
    <p class="detalle">
      {cultura.nombre}: cada habilidad que elijas recibe entre +{cultura.min_por_habilidad} y +{cultura.max_por_habilidad};
      hasta {cultura.n_profesionales} profesionales y un estilo de combate cultural.
    </p>
    {#each elecciones as el, i (i)}
      <fieldset class="eleccion">
        <legend>Elige {el.n === 1 ? 'una' : el.n}</legend>
        {#each el.opciones as o (o)}
          <label
            ><input
              type="checkbox"
              checked={p.eleccionesCultura.includes(o)}
              onchange={() => alternarEleccion(o, el.n, el.opciones)}
            />
            {catalogo.habilidades.find((h) => h.id === o)?.nombre}</label
          >
        {/each}
      </fieldset>
    {/each}
    <h3>Estándar</h3>
    {#each itemsCultura as it, i (`${it.habilidad}-${i}`)}
      <FilaReparto
        bind:p
        item={it}
        fuente="cultura"
        hoja={hoja.habilidades}
        max={barra.max}
        estilos={cultura.estilos}
      />
    {/each}
    <h3>Profesionales</h3>
    {#each cultura.profesionales as it, i (`${it.habilidad}-${i}`)}
      <FilaReparto bind:p item={it} fuente="cultura" hoja={hoja.habilidades} max={barra.max} />
    {/each}
  {:else if pestaña === 'carrera'}
    <p class="detalle">
      {carrera.nombre}: hasta +{carrera.max_por_habilidad} por habilidad y {carrera.max_profesionales}
      profesionales como mucho.
    </p>
    <h3>Estándar</h3>
    {#each carrera.estandar as it, i (`${it.habilidad}-${i}`)}
      <FilaReparto
        bind:p
        item={it}
        fuente="carrera"
        hoja={hoja.habilidades}
        max={barra.max}
        estilos={estilosCarrera}
      />
    {/each}
    <h3>Profesionales</h3>
    {#each carrera.profesionales as it, i (`${it.habilidad}-${i}`)}
      <FilaReparto bind:p item={it} fuente="carrera" hoja={hoja.habilidades} max={barra.max} />
    {/each}
  {:else}
    <p class="detalle">
      Cualquier habilidad estándar o las profesionales que ya tienes por la cultura, la carrera o el
      origen; hasta +{barra.max} cada una.
    </p>
    {#each itemsAdicional as it (`${it.habilidad}:${it.especialidad ?? ''}`)}
      <FilaReparto
        bind:p
        item={it}
        fuente="adicional"
        hoja={hoja.habilidades}
        max={barra.max}
        exacta
      />
    {/each}
  {/if}
{/if}

<style>
  .metodos {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  .confirmar {
    border-left: 3px solid var(--rubrica);
    padding-left: 0.6rem;
  }
  .pestañas {
    display: flex;
    gap: 0.4rem;
    margin: 1rem 0 0.5rem;
    border-bottom: 1px solid var(--borde);
  }
  .pestañas button {
    position: relative;
    border-bottom: none;
    border-radius: 3px 3px 0 0;
    padding-bottom: 0.6em;
  }
  .pestañas button[aria-selected='true'] {
    background: var(--pergamino);
    border-color: var(--rubrica);
    font-weight: 600;
  }
  .contador {
    margin-left: 0.4rem;
    font-variant-numeric: tabular-nums;
    color: var(--rubrica);
  }
  .contador.completo {
    color: var(--tinta-suave);
  }
  .contador.exceso {
    font-weight: 700;
  }
  .barra {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    width: var(--lleno);
    background: var(--oro);
  }
  .eleccion {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  h3 {
    font-size: 1.2rem;
    margin: 1rem 0 0.3rem;
  }
</style>
