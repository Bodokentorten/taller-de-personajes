<script lang="ts">
  import { catalogo } from '../../datos/catalogo';
  import { catalogoEquipo } from '../../motor/equipo';
  import type { Hoja } from '../../motor/hoja';
  import type { Personaje } from '../../motor/personaje';
  import { enlacePaso } from '../ruta.svelte';
  import Inventario from '../comunes/Inventario.svelte';

  let { p = $bindable(), hoja }: { p: Personaje; hoja: Hoja } = $props();

  const indice = catalogoEquipo(catalogo);
  const categorias = [...new Set(indice.map((o) => o.categoria))];
  let categoria = $state(categorias[0] ?? '');
  let filtro = $state('');
  const r = $derived(hoja.equipo);
  const visibles = $derived(
    indice.filter((o) =>
      filtro ? o.nombre.toLowerCase().includes(filtro.toLowerCase()) : o.categoria === categoria,
    ),
  );

  function añadir(id: string) {
    // Se suma a la entrada que va encima; si todas van guardadas o es otra cosa, entrada nueva
    const e = p.equipo.find((x) => x.id === id && !x.en);
    if (e) e.cantidad += 1;
    else
      p.equipo = [
        ...p.equipo,
        { id, cantidad: 1, puesto: id.startsWith('armadura:') || id.startsWith('casco:') },
      ];
  }
  const mrs = (n: number | null | undefined) =>
    n == null ? '—' : `${String(n).replace('.', ',')} mrs`;
</script>

{#if p.dinero.total === undefined}
  <p>
    Primero tira el dinero inicial en el paso <a href={enlacePaso(p.id, 'trasfondo')}>Trasfondo</a>.
  </p>
{/if}

<p class="cuentas">
  Dinero: <strong>{mrs(r.dinero)}</strong> · Gastado: {mrs(r.coste)} · Queda:
  <strong class:pendiente={(r.restante ?? 0) < 0}>{mrs(r.restante)}</strong>
</p>
<p class="detalle">
  Además de lo que compre, tiene la ropa, las armas y el transporte propios de su estamento (paso
  «Trasfondo»).
</p>

<h2>Lo que lleva</h2>
<Inventario bind:p {hoja} />

<h2>Mercado</h2>
<div class="filtros">
  <input type="search" bind:value={filtro} placeholder="Buscar en todo el mercado…" />
  {#if !filtro}
    <select bind:value={categoria} aria-label="Categoría">
      {#each categorias as c (c)}<option value={c}>{c}</option>{/each}
    </select>
  {/if}
</div>
<table class="tabla">
  <thead><tr><th>Objeto</th><th>Precio</th><th>CAR</th><th></th></tr></thead>
  <tbody>
    {#each visibles as o (o.id)}
      <tr>
        <td
          >{o.nombre}{#if filtro}
            <span class="detalle">({o.categoria})</span>{/if}</td
        >
        <td>{o.precio == null ? o.precioTexto : mrs(o.precio)}</td>
        <td>{o.car || ''}</td>
        <td><button type="button" onclick={() => añadir(o.id)}>Añadir</button></td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .cuentas {
    font-size: 1.1em;
  }
  .pendiente {
    color: var(--rubrica);
  }
  .filtros {
    display: flex;
    gap: 0.6rem;
    margin: 0.5rem 0;
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
  .tabla button {
    font-size: 0.85em;
    padding: 0.1em 0.6em;
  }
</style>
