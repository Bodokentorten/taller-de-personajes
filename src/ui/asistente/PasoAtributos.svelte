<script lang="ts">
  import { caracteristicasActuales } from '../../motor/personaje';
  import { LOCALIZACIONES } from '../../motor/atributos';
  import type { Hoja } from '../../motor/hoja';
  import type { Personaje } from '../../motor/personaje';

  let { p, hoja }: { p: Personaje; hoja: Hoja } = $props();
  const a = $derived(hoja.atributos);
  const v = $derived(caracteristicasActuales(p));
</script>

<p>
  Los atributos se calculan solos a partir de las características. Aquí se explica de dónde sale
  cada uno.
</p>

<table class="atributos">
  <tbody>
    <tr
      ><th>Puntos de Acción</th><td>{a.puntosAccion}</td><td>Todos los personajes tienen 2.</td></tr
    >
    <tr><th>Modificador de Daño</th><td>{a.modDano}</td><td>FUE + TAM = {v.FUE + v.TAM}</td></tr>
    <tr
      ><th>Modificador de Experiencia</th><td
        >{a.modExperiencia >= 0 ? '+' : ''}{a.modExperiencia}</td
      ><td>Según CAR {v.CAR}</td></tr
    >
    <tr><th>Tasa de Curación</th><td>{a.curacion}</td><td>Según CON {v.CON}</td></tr>
    <tr
      ><th>Iniciativa</th><td>{a.iniciativa}</td><td
        >Media de DES e INT ({v.DES} y {v.INT}), redondeando hacia arriba; la armadura la reduce.</td
      ></tr
    >
    <tr><th>Puntos de Suerte</th><td>{a.suerte}</td><td>Según POD {v.POD}</td></tr>
    <tr><th>Puntos de Magia</th><td>{a.puntosMagia}</td><td>Igual al POD.</td></tr>
    <tr><th>Movimiento</th><td>{a.movimiento} m</td><td>Correr ×3, esprintar ×5.</td></tr>
    <tr
      ><th>Estrés · Corrupción</th><td>{hoja.estres} · {hoja.corrupcion}</td><td>Empiezan en 0.</td
      ></tr
    >
  </tbody>
</table>

<h2>Puntos de Golpe por localización</h2>
<p>Según CON + TAM = {v.CON + v.TAM}.</p>
<table class="atributos">
  <thead><tr><th>1d20</th><th>Localización</th><th>PG</th></tr></thead>
  <tbody>
    {#each LOCALIZACIONES as l (l.id)}
      <tr><td>{l.d20[0]}–{l.d20[1]}</td><th>{l.nombre}</th><td>{a.pg[l.id]}</td></tr>
    {/each}
  </tbody>
</table>

<style>
  .atributos {
    border-collapse: collapse;
    width: 100%;
  }
  .atributos th,
  .atributos td {
    padding: 0.35rem 0.6rem;
    border-bottom: 1px solid var(--borde);
    text-align: left;
    vertical-align: top;
  }
  .atributos td:last-child {
    color: var(--tinta-suave);
  }
</style>
