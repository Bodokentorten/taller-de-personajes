<script lang="ts">
  import { caracteristicasActuales } from '../../motor/personaje';
  // Ficha propia de la ambientación en tres páginas A4, para imprimir o guardar en PDF desde el navegador.
  import { biblioteca } from '../../almacen/biblioteca.svelte';
  import { catalogo } from '../../datos/catalogo';
  import { CARACTERISTICAS } from '../../datos/tipos';
  import { LOCALIZACIONES } from '../../motor/atributos';
  import { armaduraPorLocalizacion } from '../../motor/equipo';
  import { calcularHoja } from '../../motor/hoja';
  import { claseSocial } from '../../motor/origen';
  import { BONO_PASION } from '../../motor/pasiones';
  import { enlacePaso } from '../ruta.svelte';

  let { id }: { id: string } = $props();

  const CLAVE_OPCIONES = 'taller.impresion';
  function leerOpciones(): { fondo: boolean; casillas: boolean } {
    try {
      return {
        fondo: true,
        casillas: true,
        ...JSON.parse(localStorage.getItem(CLAVE_OPCIONES) ?? '{}'),
      };
    } catch {
      return { fondo: true, casillas: true };
    }
  }
  let opciones = $state(leerOpciones());
  $effect(() => {
    try {
      localStorage.setItem(CLAVE_OPCIONES, JSON.stringify(opciones));
    } catch {
      /* sin almacenamiento */
    }
  });

  const p = $derived(biblioteca.obtener(id));
  const hoja = $derived(p ? calcularHoja(p, catalogo) : undefined);
  const nombre = (lista: { id: string; nombre: string }[], x: string | undefined) =>
    lista.find((y) => y.id === x)?.nombre ?? '';
  const pa = $derived(hoja ? armaduraPorLocalizacion(hoja.equipo) : {});
  const estandar = $derived(
    hoja?.habilidades.filter(
      (h) => h.habilidad.tipo === 'estandar' && h.habilidad.id !== 'estilo-de-combate',
    ) ?? [],
  );
  const estilos = $derived(
    hoja?.habilidades.filter((h) => h.habilidad.id === 'estilo-de-combate') ?? [],
  );
  const profesionales = $derived(
    hoja?.habilidades.filter((h) => h.habilidad.tipo === 'profesional') ?? [],
  );
  const armas = $derived(
    p
      ? p.equipo.flatMap((e) => {
          const [tipo, aid] = e.id.split(':');
          const l =
            tipo === 'arma'
              ? catalogo.armas.cuerpo_a_cuerpo
              : tipo === 'distancia'
                ? catalogo.armas.distancia
                : tipo === 'escudo'
                  ? catalogo.armas.escudos
                  : [];
          const a = l.find((x) => x.id === aid);
          return a ? [a] : [];
        })
      : [],
  );
  const penal = $derived(hoja?.equipo.carArmadura ? Math.ceil(hoja.equipo.carArmadura / 5) : 0);
  const estiloDe = (clave: string) => catalogo.estilos.find((e) => e.id === clave.split(':')[1]);
</script>

{#if !p || !hoja}
  <article class="folio">
    <h1>Personaje no encontrado</h1>
    <p><a href="#/">Volver</a></p>
  </article>
{:else}
  <div class="barra no-imprimir">
    <a href={enlacePaso(p.id, 'concepto')}>← Volver al personaje</a>
    <label><input type="checkbox" bind:checked={opciones.fondo} /> Fondo de pergamino</label>
    <label><input type="checkbox" bind:checked={opciones.casillas} /> Casillas de experiencia</label
    >
    <button class="principal" onclick={() => window.print()}>🖨 Imprimir o guardar en PDF</button>
    <span class="detalle"
      >En el diálogo de impresión: tamaño A4, márgenes «Predeterminados» y, si quieres el fondo,
      «Gráficos de fondo».</span
    >
  </div>

  <div class="ficha" class:fondo={opciones.fondo}>
    <!-- ───────────── Página 1 ───────────── -->
    <section class="a4">
      <header class="titulo">
        <h1>{p.nombre || 'Sin nombre'}</h1>
        <p>{p.concepto}</p>
      </header>
      <dl class="identidad">
        <div>
          <dt>Pueblo</dt>
          <dd>{nombre(catalogo.pueblos, p.origen.pueblo)}</dd>
        </div>
        <div>
          <dt>Reino</dt>
          <dd>{nombre(catalogo.reinos, p.origen.reino)}</dd>
        </div>
        <div>
          <dt>Credo</dt>
          <dd>{nombre(catalogo.credos, p.origen.credo).replace('Credo ', '')}</dd>
        </div>
        <div>
          <dt>Cultura</dt>
          <dd>{nombre(catalogo.culturas, p.origen.cultura)}</dd>
        </div>
        <div>
          <dt>Clase social</dt>
          <dd>{claseSocial(p, catalogo)?.clase ?? ''}</dd>
        </div>
        <div>
          <dt>Carrera</dt>
          <dd>{nombre(catalogo.carreras, p.carrera)}</dd>
        </div>
        <div>
          <dt>Edad</dt>
          <dd>
            {p.edad ?? ''}
            {catalogo.reglas.edades
              .find((e) => e.id === p.categoriaEdad)
              ?.categoria.toLowerCase() ?? ''}
          </dd>
        </div>
        <div>
          <dt>Sexo</dt>
          <dd>{p.sexo === 'varon' ? 'Varón' : p.sexo === 'mujer' ? 'Mujer' : ''}</dd>
        </div>
        <div>
          <dt>Lengua materna</dt>
          <dd>{p.lenguaMaterna}</dd>
        </div>
        <div>
          <dt>Partida · Jugador</dt>
          <dd>{[p.partida, p.jugador].filter(Boolean).join(' · ')}</dd>
        </div>
      </dl>

      <h2>Características</h2>
      <table class="cars">
        <tbody>
          <tr
            >{#each CARACTERISTICAS as c (c)}<th>{c}</th>{/each}</tr
          >
          <tr
            >{#each CARACTERISTICAS as c (c)}<td>{caracteristicasActuales(p)[c]}</td>{/each}</tr
          >
        </tbody>
      </table>

      <h2>Atributos</h2>
      <table class="rejilla atributos">
        <tbody>
          <tr
            ><th>Puntos de Acción</th><td>{hoja.atributos.puntosAccion}</td><th>Iniciativa</th><td
              >{hoja.atributos.iniciativa - penal}{penal ? ` (−${penal} armadura)` : ''}</td
            ></tr
          >
          <tr
            ><th>Mod. de Daño</th><td>{hoja.atributos.modDano}</td><th>Puntos de Suerte</th><td
              >{hoja.atributos.suerte} <span class="caja">&nbsp;</span></td
            ></tr
          >
          <tr
            ><th>Mod. de Experiencia</th><td
              >{hoja.atributos.modExperiencia >= 0 ? '+' : ''}{hoja.atributos.modExperiencia}</td
            ><th>Puntos de Magia</th><td
              >{hoja.atributos.puntosMagia} <span class="caja">&nbsp;</span></td
            ></tr
          >
          <tr
            ><th>Tasa de Curación</th><td>{hoja.atributos.curacion}</td><th>Movimiento</th><td
              >{hoja.atributos.movimiento} m (correr {hoja.atributos.movimiento * 3}, esprintar {hoja
                .atributos.movimiento * 5})</td
            ></tr
          >
          <tr
            ><th>Fatiga</th><td colspan="3"
              >Fresco · Agitado · Cansado · Fatigado · Exhausto · Debilitado · Incapacitado ·
              Semiinconsciente · Comatoso · Muerto</td
            ></tr
          >
        </tbody>
      </table>

      <h2>Localizaciones</h2>
      <table class="rejilla">
        <thead
          ><tr
            ><th>1d20</th><th>Localización</th><th>Armadura</th><th>PA</th><th>PG</th><th
              >Heridas</th
            ></tr
          ></thead
        >
        <tbody>
          {#each [...LOCALIZACIONES].reverse() as l (l.id)}
            <tr>
              <td>{l.d20[0]}–{l.d20[1]}</td><td>{l.nombre}</td>
              <td
                >{hoja.equipo.objetos
                  .filter((o) => o.puesto && o.cubre?.includes(l.id))
                  .map((o) => o.nombre)
                  .join(', ')}</td
              >
              <td>{pa[l.id] ?? 0}</td><td>{hoja.atributos.pg[l.id]}</td><td class="escribir"></td>
            </tr>
          {/each}
        </tbody>
      </table>

      <h2>Armas</h2>
      <table class="rejilla">
        <thead
          ><tr
            ><th>Arma</th><th>Daño</th><th>TAM/Pot.</th><th>Alcance</th><th>PA/PG</th><th
              >Efectos</th
            ></tr
          ></thead
        >
        <tbody>
          {#each armas as a, i (i)}
            <tr
              ><td>{a.nombre}</td><td
                >{a.dano}{a.suma_md !== false && hoja.atributos.modDano !== '+0'
                  ? ` ${hoja.atributos.modDano}`
                  : ''}</td
              ><td>{a.tam ?? a.potencia ?? ''}</td><td>{a.alcance ?? ''}</td><td>{a.pa}/{a.pg}</td
              ><td class="pequeño">{a.efectos.join(', ')}</td></tr
            >
          {/each}
          {#each Array(Math.max(0, 3 - armas.length)) as _, i (i)}<tr class="vacia"
              ><td colspan="6">&nbsp;</td></tr
            >{/each}
        </tbody>
      </table>
    </section>

    <!-- ───────────── Página 2 ───────────── -->
    <section class="a4">
      <h2>Habilidades estándar</h2>
      <table class="rejilla habilidades dos">
        <tbody>
          {#each Array(Math.ceil(estandar.length / 2)) as _, i (i)}
            {@const a = estandar[i]}
            {@const b = estandar[i + Math.ceil(estandar.length / 2)]}
            <tr>
              {#if opciones.casillas}<td class="casilla">☐</td>{/if}<th>{a?.nombre}</th><td
                class="pequeño">{a?.habilidad.formula}</td
              ><td class="total">{a?.total}%</td>
              {#if opciones.casillas}<td class="casilla">{b ? '☐' : ''}</td>{/if}<th
                >{b?.nombre ?? ''}</th
              ><td class="pequeño">{b?.habilidad.formula ?? ''}</td><td class="total"
                >{b ? `${b.total}%` : ''}</td
              >
            </tr>
          {/each}
        </tbody>
      </table>

      <h2>Estilos de combate</h2>
      <table class="rejilla">
        <tbody>
          {#each estilos as h (h.clave)}
            {@const e = estiloDe(h.clave)}
            <tr
              >{#if opciones.casillas}<td class="casilla">☐</td>{/if}<th
                >{e?.nombre ?? h.especialidad}</th
              ><td class="pequeño"
                >{e?.armas.join(', ')} ·
                <em>{e?.rasgos.join(e.rasgos_alternativos ? ' o ' : ', ')}</em></td
              ><td class="total">{h.total}%</td></tr
            >
          {/each}
          {#if !estilos.length}<tr class="vacia"><td colspan="4">&nbsp;</td></tr>{/if}
        </tbody>
      </table>

      <h2>Habilidades profesionales</h2>
      <table class="rejilla">
        <tbody>
          {#each profesionales as h (h.clave)}
            <tr
              >{#if opciones.casillas}<td class="casilla">☐</td>{/if}<th>{h.nombre}</th><td
                class="pequeño">{h.habilidad.formula}</td
              ><td class="total">{h.total}%</td></tr
            >
          {/each}
          {#each Array(Math.max(0, 4 - profesionales.length)) as _, i (i)}<tr class="vacia"
              ><td colspan="4">&nbsp;</td></tr
            >{/each}
        </tbody>
      </table>

      <h2>Pasiones</h2>
      <table class="rejilla">
        <tbody>
          {#each [...p.pasiones].sort((x, y) => x.orden - y.orden) as x, i (i)}
            <tr
              >{#if opciones.casillas}<td class="casilla">☐</td>{/if}<th>{x.nombre}</th><td
                class="pequeño">+{BONO_PASION[x.orden]}</td
              ><td class="total">{hoja.pasiones[p.pasiones.indexOf(x)]?.valor ?? '?'}%</td></tr
            >
          {/each}
          <tr class="vacia"><td colspan="4">&nbsp;</td></tr>
        </tbody>
      </table>
      {#if opciones.casillas}<p class="pequeño">
          ☐ Marca la casilla cuando la habilidad o la Pasión se use con éxito en una situación de
          tensión: al final de la aventura podrá mejorar.
        </p>{/if}
    </section>

    <!-- ───────────── Página 3 ───────────── -->
    <section class="a4">
      <div class="columnas">
        <div>
          <h2>Mente y alma</h2>
          <table class="rejilla">
            <tbody>
              <tr><th>Estrés</th><td>{hoja.estres} <span class="caja ancha">&nbsp;</span></td></tr>
              <tr
                ><th>Corrupción</th><td>{hoja.corrupcion} <span class="caja ancha">&nbsp;</span></td
                ></tr
              >
              <tr
                ><th>Fe</th><td
                  >{hoja.fe.fe ? `${hoja.fe.fe}%` : '—'}{hoja.fe.puedeObrar
                    ? ` · ${hoja.fe.pf} PF`
                    : ''}</td
                ></tr
              >
              <tr><th>Cicatrices</th><td class="escribir"></td></tr>
            </tbody>
          </table>
          {#if hoja.fe.rituales.length}
            <h3>
              Rituales (hasta {catalogo.rituales.find((r) => r.ordo === hoja.fe.ordoMaximo)
                ?.ordo_nombre})
            </h3>
            <p class="pequeño">
              {hoja.fe.rituales.map((r) => `${r.nombre} (${r.pf_requeridos} PF)`).join(' · ')}
            </p>
          {/if}
          {#if hoja.magia.fuentes.length || hoja.magia.formulas.length}
            <h3>Magia</h3>
            {#each hoja.magia.fuentes as f (f.clave)}<p class="pequeño">
                <strong>{f.nombre}</strong>
                {f.valor}% · {f.dominios.join(', ')}
              </p>{/each}
            <table class="rejilla">
              <tbody>
                {#each hoja.magia.formulas as f (f.id)}
                  <tr
                    ><th>{f.nombre}{f.goecia ? ' ✠' : ''}</th><td class="pequeño"
                      >vis {f.vis} · Rango {f.rango} · {f.dominios.join('+')} · {f.forma}</td
                    ></tr
                  >
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
        <div>
          <h2>Equipo</h2>
          <table class="rejilla">
            <tbody>
              {#each hoja.equipo.objetos as o (o.id)}
                <tr
                  ><td>{o.cantidad > 1 ? `${o.cantidad} × ` : ''}{o.nombre}</td><td class="pequeño"
                    >CAR {o.car}</td
                  ></tr
                >
              {/each}
              {#each Array(Math.max(2, 10 - hoja.equipo.objetos.length)) as _, i (i)}<tr
                  class="vacia"><td colspan="2">&nbsp;</td></tr
                >{/each}
            </tbody>
          </table>
          <p>
            Carga: {hoja.equipo.car} de {caracteristicasActuales(p).FUE * 2} · Dinero: {hoja.equipo
              .restante ?? '—'} mrs <span class="caja ancha">&nbsp;</span>
          </p>
        </div>
      </div>

      <h2>Trasfondo</h2>
      <dl class="trasfondo">
        {#if p.trasfondo.padres}<dt>Padres</dt>
          <dd>{p.trasfondo.padres.texto}</dd>{/if}
        {#if p.trasfondo.hermanos}<dt>Hermanos</dt>
          <dd>{p.trasfondo.hermanos.texto}</dd>{/if}
        {#if p.trasfondo.familia_extendida}<dt>Familia</dt>
          <dd>{p.trasfondo.familia_extendida.texto}</dd>{/if}
        {#if p.trasfondo.reputacion}<dt>Reputación</dt>
          <dd>{p.trasfondo.reputacion.texto}</dd>{/if}
        {#if p.trasfondo.conexiones}<dt>Conexiones</dt>
          <dd>{p.trasfondo.conexiones.texto}</dd>{/if}
        {#each p.trasfondo.eventos ?? [] as ev, i (i)}<dt>Evento</dt>
          <dd>{ev.texto}</dd>{/each}
      </dl>
      {#if p.aspecto}<h3>Aspecto y carácter</h3>
        <p>{p.aspecto}</p>{/if}
      <h3>Notas</h3>
      <div class="notas">{p.notas}</div>
    </section>
  </div>
{/if}

<style>
  .barra {
    display: flex;
    gap: 1.2rem;
    align-items: center;
    flex-wrap: wrap;
    padding: 0.8rem 2rem;
  }
  .ficha {
    --tinta-ficha: #1b130b;
    color: var(--tinta-ficha);
    font-size: 10.5pt;
    line-height: 1.3;
  }
  .a4 {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto 1.5rem;
    padding: 12mm 14mm;
    background: white;
    box-shadow: 0 4px 18px var(--sombra);
    box-sizing: border-box;
  }
  .fondo .a4 {
    background: radial-gradient(ellipse at center, #f6ead0 60%, #e9d6ad 100%);
  }
  .titulo {
    text-align: center;
    border-bottom: 2px double #7a1414;
    margin-bottom: 3mm;
  }
  h1 {
    font-size: 26pt;
    margin: 0;
    color: #7a1414;
  }
  .titulo p {
    margin: 0 0 2mm;
    font-style: italic;
  }
  h2 {
    font-size: 14pt;
    margin: 4mm 0 1.5mm;
    color: #7a1414;
    border-bottom: 1px solid #7a1414;
  }
  h3 {
    font-size: 11pt;
    margin: 3mm 0 1mm;
    color: #7a1414;
  }
  .identidad {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0 6mm;
    margin: 0;
  }
  .identidad div {
    display: flex;
    gap: 2mm;
    border-bottom: 1px dotted #8a7550;
  }
  .identidad dt {
    font-weight: 600;
    min-width: 30mm;
  }
  .identidad dd {
    margin: 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  .cars th,
  .cars td {
    border: 1px solid #5a4630;
    text-align: center;
    width: 14.28%;
  }
  .cars td {
    font-size: 15pt;
    padding: 1mm;
  }
  .rejilla th,
  .rejilla td {
    border-bottom: 1px solid #b8a27a;
    padding: 0.6mm 1.5mm;
    text-align: left;
    vertical-align: top;
  }
  .rejilla th {
    font-weight: 600;
  }
  .rejilla thead th {
    font-size: 9pt;
    color: #5a4630;
  }
  .atributos th {
    width: 32mm;
  }
  .total {
    text-align: right !important;
    font-weight: 600;
    white-space: nowrap;
  }
  .casilla {
    width: 5mm;
    color: #5a4630;
  }
  .pequeño {
    font-size: 8.5pt;
    color: #3d2e1c;
  }
  .caja {
    display: inline-block;
    min-width: 12mm;
    border-bottom: 1px solid #5a4630;
  }
  .caja.ancha {
    min-width: 25mm;
  }
  .escribir {
    min-width: 30mm;
  }
  .vacia td {
    height: 5.5mm;
  }
  .columnas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6mm;
  }
  .trasfondo {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1mm 3mm;
    margin: 0;
    font-size: 9.5pt;
  }
  .trasfondo dt {
    font-weight: 600;
  }
  .trasfondo dd {
    margin: 0;
  }
  .notas {
    min-height: 40mm;
    white-space: pre-wrap;
    background: repeating-linear-gradient(transparent 0 6.4mm, #b8a27a 6.4mm 6.6mm);
  }

  @media print {
    :global(body) {
      background: white !important;
    }
    :global(.cabecera) {
      display: none !important;
    }
    .a4 {
      width: auto;
      min-height: 0;
      margin: 0;
      padding: 0;
      box-shadow: none;
      break-after: page;
      background: none;
    }
    .a4:last-child {
      break-after: auto;
    }
    .fondo .a4 {
      background: none;
    }
    .fondo {
      background: #f6ead0;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    table,
    tr {
      break-inside: avoid;
    }
  }
</style>
