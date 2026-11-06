<script lang="ts">
  // Campo numérico con botones − y +.
  interface Props {
    valor: number;
    min?: number;
    max?: number;
    paso?: number;
    etiqueta: string;
    alCambiar: (v: number) => void;
  }
  let { valor, min = 0, max = 999, paso = 1, etiqueta, alCambiar }: Props = $props();

  function fijar(v: number) {
    if (!Number.isFinite(v)) return;
    alCambiar(Math.min(max, Math.max(min, Math.round(v))));
  }
</script>

<span class="numero">
  <button
    type="button"
    aria-label={`Menos ${etiqueta}`}
    disabled={valor <= min}
    onclick={() => fijar(valor - paso)}>−</button
  >
  <input
    type="number"
    aria-label={etiqueta}
    {min}
    {max}
    value={valor}
    onchange={(e) => fijar(Number((e.currentTarget as HTMLInputElement).value))}
  />
  <button
    type="button"
    aria-label={`Más ${etiqueta}`}
    disabled={valor >= max}
    onclick={() => fijar(valor + paso)}>+</button
  >
</span>

<style>
  .numero {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
  }
  button {
    padding: 0 0.5em;
  }
  input {
    width: 3.4em;
    text-align: center;
    font: inherit;
    font-variant-numeric: tabular-nums;
    background: transparent;
    color: var(--tinta);
    border: 1px solid var(--borde-campo);
    border-radius: 3px;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
</style>
