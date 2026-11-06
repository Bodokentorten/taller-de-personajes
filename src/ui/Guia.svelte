<script lang="ts">
  // Guía para los jugadores.
</script>

<article class="folio guia">
  <h1>Guía del taller</h1>
  <p class="subtitulo">Cómo crear y llevar tu personaje</p>

  <p class="capitular">
    Este taller te acompaña en la creación de un personaje de Mythras para los reinos hispánicos del
    siglo XIV, lo lleva contigo a la mesa y lo hace crecer con la experiencia. No necesitas cuenta:
    todo se guarda en tu navegador.
  </p>

  <aside class="aviso">
    <strong>Tus personajes solo viven en este navegador.</strong> Si borras los datos del navegador,
    cambias de ordenador o usas una ventana privada, no estarán. Haz de vez en cuando una
    <em>copia de seguridad</em> desde «Mis personajes» (un archivo JSON) y guárdala en lugar seguro.
  </aside>

  <h2>Antes de empezar: la campaña</h2>
  <p>
    Tu DJ puede enviarte un <strong>enlace de campaña</strong>. Ábrelo y pulsa «Usar esta campaña»:
    así el taller sabe qué métodos, carreras y reglas opcionales se usan en vuestra mesa. Puedes
    verla en el menú
    <a href="#/campana">Campaña</a>.
  </p>

  <h2>Crear un personaje</h2>
  <ol>
    <li><strong>Concepto:</strong> nombre, sexo, edad y una idea de quién es.</li>
    <li>
      <strong>Características:</strong> compra de 80 puntos, tirada de dados o, si el DJ lo permite, a
      mano.
    </li>
    <li><strong>Atributos:</strong> se calculan solos; aquí se explica de dónde sale cada uno.</li>
    <li>
      <strong>Origen y cultura:</strong> reino, pueblo, credo, cultura y lengua materna. Los idiomas gratuitos
      de tu pueblo se suman solos.
    </li>
    <li>
      <strong>Trasfondo:</strong> clase social, dinero, familia, conexiones y eventos, con tiradas. Las
      subtiradas (cuántos hermanos y si son mayores o menores, de qué lado son los tíos y los primos,
      qué aliados o rivales) se hacen solas.
    </li>
    <li>
      <strong>Carrera:</strong> solo verás las que tu personaje puede elegir (o todas, con el motivo de
      las que no).
    </li>
    <li>
      <strong>Habilidades:</strong> el método estándar (cultura 100 + carrera 100 + puntos por edad) o
      la pirámide de 15 fichas, que se arrastran o se colocan con dos clics. La pirámide queda fija arriba
      y la lista se desplaza sola si arrastras una ficha hacia el borde de la ventana. Cada habilidad
      lleva la marca «cultura» o «carrera» si es propia de las tuyas (las especialidades concretas aparecen
      como filas propias), y puedes filtrar para ver solo esas.
    </li>
    <li>
      <strong>Pasiones:</strong> hasta tres, con +40, +30 y +20. No olvides la Fe de tu credo.
    </li>
    <li>
      <strong>Magia y fe:</strong> solo aparece si tu carrera la tiene: Fuentes Místicas, fórmulas, ordos
      y rituales.
    </li>
    <li>
      <strong>Equipo:</strong> compra en el mercado con tu dinero inicial y decide dónde va cada cosa:
      encima, en el morral o el saco, o en las alforjas de la montura (lo que va en la montura no pesa
      sobre ti).
    </li>
  </ol>
  <p>
    Cada paso muestra al final lo que falta por resolver. En la columna izquierda verás <span
      class="marca ok">✓</span
    >
    si está completo, <span class="marca aviso">!</span> si tiene avisos y
    <span class="marca error">·</span>
    si le falta algo. A la derecha, el resumen de la ficha se actualiza mientras escribes. Los botones
    <span class="marca">?</span> abren una ficha con el resumen de cada carrera, pueblo, habilidad o fórmula.
  </p>

  <h2>Exportar e imprimir</h2>
  <ul>
    <li>
      <strong>Markdown:</strong> la ficha con la plantilla del vault, para pegarla en la carpeta de la
      partida.
    </li>
    <li>
      <strong>JSON:</strong> la copia exacta de tu personaje; es lo que debes enviar al DJ si te pide
      revisarlo.
    </li>
    <li>
      <strong>Ficha para imprimir:</strong> tres páginas A4. En el diálogo de impresión elige «Guardar
      como PDF» si la quieres en un archivo.
    </li>
  </ul>

  <h2>En la mesa</h2>
  <ul>
    <li>
      <strong>Vista de juego</strong> (⚔ Jugar): PG por localización, Suerte, PM, fatiga, Estrés, pánico,
      munición y notas, todo en una pantalla. Haz clic en una habilidad para tirarla, o en uno de sus
      seis valores (de Muy fácil a Hercúleo) para tirar con esa dificultad; marca la casilla cuando la
      uses con éxito en un momento de tensión.
    </li>
    <li>
      <strong>Mejora:</strong> cuando el DJ conceda tiradas de experiencia, tira las habilidades marcadas
      (1d100 + INT contra el valor). Ahí también se aprenden habilidades nuevas, se entrenan con un maestro
      y se anotan fórmulas y ordos.
    </li>
    <li>
      <strong>Carga:</strong> si vas cargado, «Soltar el morral» deja en el suelo morrales y sacos: ni
      ellos ni lo que llevan pesan hasta que los recojas.
    </li>
    <li>
      <strong>Hechizos:</strong> la calculadora de Magia Caótica da la dificultad de tus fórmulas según
      la zona, la voz, los gestos y la armadura, y la de cualquier hechizo que quieras improvisar. También
      calcula la Resistencia del Hechizo (la dificultad entre 5, redondeando hacia arriba), tu MDE según
      el POD y cuántos intercambios necesitarás más o menos; con un 20% o menos basta una tirada (lanzamiento
      rápido).
    </li>
    <li>
      <strong>Consulta de reglas:</strong> busca cualquier habilidad, carrera, arma, fórmula o ritual
      sin salir del taller.
    </li>
  </ul>

  <h2>Atajos de teclado</h2>
  <dl>
    <dt><kbd>Ctrl</kbd> + <kbd>←</kbd> / <kbd>→</kbd></dt>
    <dd>Paso anterior o siguiente del asistente.</dd>
    <dt><kbd>/</kbd></dt>
    <dd>Ir al buscador de la consulta de reglas.</dd>
    <dt><kbd>Tab</kbd> al cargar la página</dt>
    <dd>«Saltar al contenido», sin pasar por el menú.</dd>
  </dl>
</article>

<style>
  .guia {
    max-width: 50rem;
  }
  li {
    margin: 0.3rem 0;
  }
  .aviso {
    border: 1px solid var(--rubrica);
    border-left-width: 4px;
    padding: 0.6rem 1rem;
    margin: 1rem 0;
  }
  .marca {
    font-weight: 600;
  }
  .ok {
    color: var(--tinta-suave);
  }
  .aviso.marca,
  span.aviso {
    color: var(--oro);
    border: none;
    padding: 0;
  }
  .error {
    color: var(--rubrica);
  }
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.3rem 1rem;
  }
  dd {
    margin: 0;
  }
  kbd {
    border: 1px solid var(--borde-campo);
    border-radius: 3px;
    padding: 0 0.3em;
    font-family: inherit;
  }
</style>
