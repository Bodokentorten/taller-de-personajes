<script lang="ts">
  // Escudos de armas simplificados de los cinco reinos.
  interface Props {
    reino: string;
    tamaño?: number;
  }
  let { reino, tamaño = 44 }: Props = $props();
  const QUINAS: [number, number][] = [
    [20, 12],
    [12, 22],
    [20, 22],
    [28, 22],
    [20, 32],
  ];
  const forma = 'M2 2 H38 V22 C38 36 20 46 20 46 C20 46 2 36 2 22 Z';
</script>

<svg width={tamaño} height={tamaño * 1.2} viewBox="0 0 40 48" aria-hidden="true">
  <defs>
    <clipPath id={`escudo-${reino}`}><path d={forma} /></clipPath>
  </defs>
  <g clip-path={`url(#escudo-${reino})`}>
    {#if reino === 'corona-de-castilla'}
      <!-- Cuartelado de castillos y leones -->
      <rect width="40" height="48" fill="#b22222" />
      <rect x="20" width="20" height="24" fill="#f4efe1" />
      <rect y="24" width="20" height="24" fill="#f4efe1" />
      <rect x="6" y="8" width="8" height="9" fill="#d4a017" />
      <rect x="26" y="32" width="8" height="9" fill="#d4a017" />
      <circle cx="30" cy="12" r="4.5" fill="#6b2a7a" />
      <circle cx="10" cy="36" r="4.5" fill="#6b2a7a" />
    {:else if reino === 'corona-de-aragon'}
      <!-- Palos de gules sobre oro -->
      <rect width="40" height="48" fill="#e2b33c" />
      {#each [5, 14, 23, 32] as x (x)}<rect {x} width="4.5" height="48" fill="#b22222" />{/each}
    {:else if reino === 'reino-de-portugal'}
      <!-- Quinas sobre plata, bordura de gules -->
      <rect width="40" height="48" fill="#b22222" />
      <rect x="5" y="5" width="30" height="38" fill="#f4efe1" />
      {#each QUINAS as [x, y] (`${x}-${y}`)}
        <rect x={x - 3} y={y - 4} width="6" height="8" fill="#1f3f8a" />
      {/each}
    {:else if reino === 'reino-de-navarra'}
      <!-- Cadenas de oro sobre gules -->
      <rect width="40" height="48" fill="#b22222" />
      <g stroke="#e2b33c" stroke-width="2.5" fill="none">
        <path d="M2 2 L38 46 M38 2 L2 46 M20 0 V48 M0 22 H40" />
        <circle cx="20" cy="22" r="5" />
      </g>
    {:else}
      <!-- Banda de oro sobre gules (Granada) -->
      <rect width="40" height="48" fill="#b22222" />
      <path d="M-4 6 L44 42 L44 52 L-4 16 Z" fill="#e2b33c" />
      <circle cx="30" cy="14" r="4" fill="#2f7a3a" />
    {/if}
  </g>
  <path d={forma} fill="none" stroke="var(--tinta)" stroke-width="1.5" />
</svg>
