<script lang="ts">
  // Inventario: dónde va cada objeto (encima, en un contenedor o en la montura) y «soltar el morral».
  import { caracteristicasActuales, type Personaje } from '../../motor/personaje';
  import { NOMBRE_UBICACION, soltarContenedor, soltarTodo } from '../../motor/equipo';
  import type { Hoja } from '../../motor/hoja';
  import Numero from './Numero.svelte';

  interface Props {
    p: Personaje;
    hoja: Hoja;
    /** Versión reducida para la vista de juego: solo carga y contenedores. */
    compacto?: boolean;
  }
  let { p = $bindable(), hoja, compacto = false }: Props = $props();

  const r = $derived(hoja.equipo);
  const fue2 = $derived(caracteristicasActuales(p).FUE * 2);
  const contenedores = $derived(r.objetos.filter((o) => o.contenedor));
  const sueltos = $derived(contenedores.filter((o) => o.soltado));
  const ESTADO: Record<string, string> = {
    normal: 'normal',
    cargado: 'cargado',
    sobrecargado: 'sobrecargado',
    inmovil: 'inmóvil',
  };

  function cantidad(pos: number, n: number) {
    if (n > 0) p.equipo[pos]!.cantidad = n;
    else {
      const id = p.equipo[pos]!.id;
      // Si se quita un contenedor, lo que llevaba vuelve a ir encima
      p.equipo = p.equipo
        .filter((_, i) => i !== pos)
        .map((e) =>
          e.en === id && !p.equipo.some((x, i) => i !== pos && x.id === id)
            ? { ...e, en: undefined }
            : e,
        );
    }
  }
  function mover(pos: number, destino: string) {
    const e = p.equipo[pos]!;
    e.en = destino || undefined;
  }
</script>

<div class="inventario" class:compacto>
  <p class="carga">
    <strong>Carga: {r.car}</strong> de {fue2} sin penalización ·
    <span class:mal={r.estado !== 'normal'}>{ESTADO[r.estado]}</span>
    {#if r.carFuera}<span class="detalle"> · {r.carFuera} más en la montura o soltado</span>{/if}
  </p>

  {#if contenedores.some((o) => !o.contenedor?.animal)}
    <div class="soltar">
      {#if sueltos.length}
        <span class="aviso">Ha soltado: {sueltos.map((o) => o.nombre).join(', ')}.</span>
      {/if}
      <button
        type="button"
        class="principal"
        disabled={contenedores.every((o) => o.contenedor?.animal || o.soltado)}
        onclick={() => soltarTodo(p)}
        title="Deja en el suelo todos los morrales y sacos: ni ellos ni lo que llevan cuentan para la carga"
      >
        Soltar el morral
      </button>
    </div>
  {/if}

  {#if compacto}
    {#each contenedores as o (o.pos)}
      <div class="contenedor">
        <span>{o.nombre}{o.cantidad > 1 ? ` ×${o.cantidad}` : ''}</span>
        <span class="detalle"
          >{o.contenedor!.dentro}{o.contenedor!.capacidad !== undefined
            ? `/${o.contenedor!.capacidad * o.cantidad}`
            : ''} CAR</span
        >
        {#if o.contenedor!.animal}<span class="detalle">en la montura</span>
        {:else}
          <button type="button" onclick={() => soltarContenedor(p, o.id, !o.soltado)}
            >{o.soltado ? 'Recoger' : 'Soltar'}</button
          >
        {/if}
      </div>
    {/each}
  {:else if r.objetos.length}
    <table class="tabla">
      <thead
        ><tr><th>Objeto</th><th>Cantidad</th><th>Dónde</th><th>CAR</th><th>Puesto</th><th></th></tr
        ></thead
      >
      <tbody>
        {#each r.objetos as o (o.pos)}
          <tr
            class:fuera={o.ubicacion === 'animal' ||
              o.ubicacion === 'soltado' ||
              o.ubicacion === 'fuera'}
          >
            <td>
              {o.nombre} <span class="detalle">({o.categoria})</span>
              {#if o.contenedor}
                <span
                  class="capacidad"
                  class:mal={o.contenedor.capacidad !== undefined &&
                    o.contenedor.dentro > o.contenedor.capacidad * o.cantidad}
                >
                  lleva {o.contenedor.dentro}{o.contenedor.capacidad !== undefined
                    ? ` de ${o.contenedor.capacidad * o.cantidad}`
                    : ''} CAR{o.contenedor.animal ? ' · va en la montura' : ''}
                </span>
              {/if}
            </td>
            <td
              ><Numero
                valor={o.cantidad}
                min={0}
                max={99}
                etiqueta={`Cantidad de ${o.nombre}`}
                alCambiar={(n) => cantidad(o.pos, n)}
              /></td
            >
            <td>
              {#if o.contenedor || o.ubicacion === 'fuera' || o.puesto}
                <span class="detalle">{o.puesto ? 'puesto' : NOMBRE_UBICACION[o.ubicacion]}</span>
              {:else}
                <select
                  value={p.equipo[o.pos]?.en ?? ''}
                  onchange={(e) => mover(o.pos, (e.currentTarget as HTMLSelectElement).value)}
                  aria-label={`Dónde lleva ${o.nombre}`}
                >
                  <option value="">Encima</option>
                  {#each contenedores as c (c.pos)}<option value={c.id}
                      >{c.nombre}{c.contenedor?.animal ? ' (montura)' : ''}</option
                    >{/each}
                </select>
              {/if}
            </td>
            <td>{o.car}</td>
            <td>
              {#if o.tipo === 'armadura' || o.tipo === 'casco'}
                <input
                  type="checkbox"
                  checked={o.puesto}
                  aria-label={`Lleva puesto ${o.nombre}`}
                  onchange={(e) =>
                    (p.equipo[o.pos]!.puesto = (e.currentTarget as HTMLInputElement).checked)}
                />
              {/if}
            </td>
            <td>
              {#if o.contenedor && !o.contenedor.animal}
                <button type="button" onclick={() => soltarContenedor(p, o.id, !o.soltado)}
                  >{o.soltado ? 'Recoger' : 'Soltar'}</button
                >
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="detalle">
      Morral o zurrón: CAR 1, caben 20 · saco: CAR 0, caben 30 · alforjas y albardas van en la
      montura: lo que lleven no pesa sobre el personaje. La armadura puesta cuenta la mitad.
    </p>
  {/if}
</div>

<style>
  .carga {
    margin: 0.3rem 0;
  }
  .mal {
    color: var(--rubrica);
    font-weight: 600;
  }
  .soltar {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex-wrap: wrap;
    margin: 0.3rem 0;
  }
  .aviso {
    color: var(--rubrica);
    font-size: 0.9em;
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
  tr.fuera {
    color: var(--tinta-suave);
  }
  .capacidad {
    display: block;
    font-size: 0.85em;
    color: var(--tinta-suave);
  }
  .contenedor {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin: 0.2rem 0;
  }
  .contenedor span:first-child {
    flex: 1;
  }
  .compacto button {
    padding: 0 0.5em;
    font-size: 0.9em;
  }
</style>
