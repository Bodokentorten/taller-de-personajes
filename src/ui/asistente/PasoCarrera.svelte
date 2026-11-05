<script lang="ts">
  import { catalogo } from '../../datos/catalogo';
  import type { Carrera, ItemHabilidad } from '../../datos/tipos';
  import { nombreHabilidad } from '../../motor/habilidades';
  import { validarCarrera } from '../../motor/origen';
  import { CAMPAÑA_POR_DEFECTO, type Personaje } from '../../motor/personaje';
  import Info from '../comunes/Info.svelte';

  let { p = $bindable() }: { p: Personaje } = $props();

  let filtro = $state('');
  let soloPermitidas = $state(true);

  const filas = $derived(
    catalogo.carreras.map((c) => {
      const problemas = validarCarrera({ ...p, carrera: c.id }, catalogo, CAMPAÑA_POR_DEFECTO);
      return {
        c,
        errores: problemas.filter((x) => x.gravedad === 'error'),
        habitual: !p.origen.cultura || c.culturas_habituales.includes(p.origen.cultura),
      };
    }),
  );
  const visibles = $derived(
    filas.filter(
      (f) =>
        (!soloPermitidas || f.errores.length === 0 || f.c.id === p.carrera) &&
        (!filtro || `${f.c.nombre} ${f.c.arquetipos}`.toLowerCase().includes(filtro.toLowerCase())),
    ),
  );

  const texto = (it: ItemHabilidad) =>
    nombreHabilidad(catalogo, it.habilidad) +
    (it.especialidad
      ? ` (${it.especialidad})`
      : it.cualquiera
        ? ' (cualquiera)'
        : it.aclaracion
          ? ` (${it.aclaracion})`
          : '');
  const marcas = (c: Carrera) =>
    [c.magia && 'magia', c.fe && 'rituales', c.origen === 'aquelarre' && 'Aquelarre']
      .filter(Boolean)
      .join(' · ');
</script>

<p>
  La carrera es el oficio que aprendió al hacerse adulto. Reparte 100 puntos entre sus habilidades
  estándar y hasta 3 profesionales (paso «Habilidades»).
</p>

<div class="filtros">
  <label
    >Buscar <input
      type="search"
      bind:value={filtro}
      placeholder="juglar, físico, almogávar…"
    /></label
  >
  <label><input type="checkbox" bind:checked={soloPermitidas} /> Solo las que puede elegir</label>
</div>

<div class="tarjetas">
  {#each visibles as f (f.c.id)}
    <div
      class="tarjeta"
      class:elegida={p.carrera === f.c.id}
      class:atenuada={!f.habitual || f.errores.length > 0}
    >
      <label>
        <input type="radio" name="carrera" value={f.c.id} bind:group={p.carrera} />
        <strong>{f.c.nombre}</strong>
      </label>
      <Info titulo={f.c.nombre} resumen={f.c.resumen} nota={f.c.nota}>
        <p><strong>Estándar:</strong> {f.c.estandar.map(texto).join(', ')}</p>
        <p>
          <strong>Profesionales (hasta {f.c.max_profesionales}):</strong>
          {f.c.profesionales.map(texto).join(', ')}
        </p>
        {#if f.c.restriccion}<p><strong>Quién puede:</strong> {f.c.restriccion}</p>{/if}
        {#if f.c.aviso}<p class="aviso">{f.c.aviso}</p>{/if}
      </Info>
      <p class="detalle">{f.c.arquetipos}</p>
      {#if marcas(f.c)}<p class="marca">{marcas(f.c)}</p>{/if}
      {#each f.errores as e, i (i)}<p class="no">✗ {e.mensaje}</p>{/each}
    </div>
  {/each}
</div>

<style>
  .filtros {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .marca {
    margin: 0;
    font-size: 0.85em;
    color: var(--oro);
    font-variant: small-caps;
  }
  .no {
    margin: 0.2rem 0 0;
    font-size: 0.85em;
    color: var(--rubrica);
  }
  .aviso {
    color: var(--rubrica);
  }
</style>
