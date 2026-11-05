<script lang="ts">
  import { caracteristicasActuales } from '../../motor/personaje';
  // Resumen vivo de la ficha, en la columna derecha del asistente.
  import { catalogo } from '../../datos/catalogo';
  import { CARACTERISTICAS } from '../../datos/tipos';
  import { LOCALIZACIONES } from '../../motor/atributos';
  import { armaduraPorLocalizacion } from '../../motor/equipo';
  import type { Hoja } from '../../motor/hoja';
  import type { Personaje } from '../../motor/personaje';

  interface Props {
    p: Personaje;
    hoja: Hoja;
  }
  let { p, hoja }: Props = $props();

  const nombre = (lista: { id: string; nombre: string }[], id: string) =>
    lista.find((x) => x.id === id)?.nombre;
  const a = $derived(hoja.atributos);
  const pa = $derived(armaduraPorLocalizacion(hoja.equipo));
  const conPuntos = $derived(
    hoja.habilidades
      .filter((h) => h.total !== h.base || h.habilidad.tipo === 'profesional')
      .sort((x, y) => y.total - x.total),
  );
  const errores = $derived(hoja.problemas.filter((x) => x.gravedad === 'error').length);
</script>

<div class="hoja">
  <h2>{p.nombre || 'Sin nombre'}</h2>
  <p class="linea">
    {[nombre(catalogo.pueblos, p.origen.pueblo), nombre(catalogo.carreras, p.carrera), hoja.clase]
      .filter(Boolean)
      .join(' · ') || 'Personaje en ciernes'}
  </p>
  <p class={errores ? 'pendiente' : 'listo'}>
    {errores ? `${errores} cosa${errores === 1 ? '' : 's'} por resolver` : '✓ Ficha válida'}
  </p>

  <table class="caracteristicas">
    <tbody>
      <tr
        >{#each CARACTERISTICAS as c (c)}<th>{c}</th>{/each}</tr
      >
      <tr
        >{#each CARACTERISTICAS as c (c)}<td>{caracteristicasActuales(p)[c]}</td>{/each}</tr
      >
    </tbody>
  </table>

  <dl class="atributos">
    <dt>PA</dt>
    <dd>{a.puntosAccion}</dd>
    <dt>Mod. daño</dt>
    <dd>{a.modDano}</dd>
    <dt>Iniciativa</dt>
    <dd>
      {a.iniciativa}{hoja.equipo.carArmadura
        ? ` (${a.iniciativa - Math.ceil(hoja.equipo.carArmadura / 5)} con armadura)`
        : ''}
    </dd>
    <dt>Suerte</dt>
    <dd>{a.suerte}</dd>
    <dt>PM</dt>
    <dd>{a.puntosMagia}</dd>
    <dt>Curación</dt>
    <dd>{a.curacion}</dd>
    <dt>Mod. exp.</dt>
    <dd>{a.modExperiencia >= 0 ? '+' : ''}{a.modExperiencia}</dd>
    <dt>Movimiento</dt>
    <dd>{a.movimiento} m</dd>
  </dl>

  <h3>Localizaciones</h3>
  <table class="localizaciones">
    <tbody>
      {#each LOCALIZACIONES as l (l.id)}
        <tr
          ><td>{l.d20[0]}–{l.d20[1]}</td><td>{l.nombre}</td><td>{a.pg[l.id]} PG</td><td
            >{pa[l.id] ? `${pa[l.id]} PA` : ''}</td
          ></tr
        >
      {/each}
    </tbody>
  </table>

  {#if conPuntos.length}
    <h3>Habilidades</h3>
    <ul class="habilidades">
      {#each conPuntos.slice(0, 18) as h (h.clave)}
        <li><span>{h.nombre}</span><span>{h.total}%</span></li>
      {/each}
      {#if conPuntos.length > 18}<li class="mas">y {conPuntos.length - 18} más…</li>{/if}
    </ul>
  {/if}

  {#if hoja.pasiones.length}
    <h3>Pasiones</h3>
    <ul class="habilidades">
      {#each hoja.pasiones as x, i (i)}<li>
          <span>{x.nombre}</span><span>{x.valor ?? '?'}%</span>
        </li>{/each}
    </ul>
  {/if}

  {#if hoja.fe.puedeObrar}
    <p>Fe {hoja.fe.fe}% · {hoja.fe.pf} PF · ordo {hoja.fe.ordoMaximo || '—'}</p>
  {/if}
  {#if hoja.magia.fuentes.length}
    <p>Fuentes: {hoja.magia.fuentes.map((f) => `${f.nombre} ${f.valor}%`).join(', ')}</p>
  {/if}
  {#if p.dinero.total !== undefined}
    <p>Dinero: {hoja.equipo.restante} de {p.dinero.total} mrs · CAR {hoja.equipo.car}</p>
  {/if}
</div>

<style>
  .hoja {
    border: 1px solid var(--borde);
    background: var(--pergamino);
    padding: 1rem 1.2rem;
    font-size: 0.92rem;
    box-shadow: 0 4px 16px var(--sombra);
  }
  h2 {
    margin: 0;
    font-size: 1.6rem;
  }
  h3 {
    font-size: 1.1rem;
    margin: 0.9rem 0 0.3rem;
  }
  .linea {
    margin: 0.2rem 0;
    font-style: italic;
  }
  .pendiente {
    color: var(--rubrica);
  }
  .listo {
    color: var(--tinta-suave);
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  .caracteristicas th,
  .caracteristicas td {
    text-align: center;
    padding: 0.1rem;
    border: 1px solid var(--borde);
  }
  .caracteristicas th {
    font-size: 0.8em;
    color: var(--tinta-suave);
  }
  .atributos {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 0.8rem;
    margin: 0.6rem 0;
  }
  dt {
    color: var(--tinta-suave);
  }
  dd {
    margin: 0;
  }
  .localizaciones td {
    padding: 0 0.3rem;
    border-bottom: 1px dotted var(--borde);
  }
  .localizaciones td:first-child {
    color: var(--tinta-suave);
    font-size: 0.85em;
  }
  .habilidades {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .habilidades li {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    border-bottom: 1px dotted var(--borde);
  }
  .mas {
    color: var(--tinta-suave);
    font-style: italic;
  }
</style>
