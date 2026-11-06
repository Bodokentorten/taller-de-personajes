// Archivo de campaña: lo prepara el DJ y lo comparten los jugadores (enlace #/campana/<código> o JSON).
import { CAMPAÑA_POR_DEFECTO, type Campaña } from '../motor/personaje';

export const FORMATO_CAMPAÑA = 'taller-de-personajes/campaña';

/** Rellena con los valores por defecto lo que falte y descarta lo que no sea del modelo. */
export function normalizarCampaña(dato: unknown): Campaña {
  if (!dato || typeof dato !== 'object') throw new Error('No es un archivo de campaña.');
  const d = dato as Partial<Campaña> & { formato?: string };
  const lista = (x: unknown) =>
    Array.isArray(x) ? x.filter((y): y is string => typeof y === 'string') : undefined;
  const metodosH = lista(d.metodosHabilidades)?.filter((m) => m === 'estandar' || m === 'piramide');
  const metodosC = lista(d.metodosCaracteristicas)?.filter(
    (m) => m === 'compra' || m === 'tirada' || m === 'manual',
  );
  return {
    restriccionesSexo: Boolean(d.restriccionesSexo ?? CAMPAÑA_POR_DEFECTO.restriccionesSexo),
    hidalguiaVasca: Boolean(d.hidalguiaVasca ?? CAMPAÑA_POR_DEFECTO.hidalguiaVasca),
    metodosHabilidades: (metodosH?.length
      ? metodosH
      : CAMPAÑA_POR_DEFECTO.metodosHabilidades) as Campaña['metodosHabilidades'],
    metodosCaracteristicas: (metodosC?.length
      ? metodosC
      : CAMPAÑA_POR_DEFECTO.metodosCaracteristicas) as Campaña['metodosCaracteristicas'],
    permitirMagia: Boolean(d.permitirMagia ?? CAMPAÑA_POR_DEFECTO.permitirMagia),
    repetirTrasfondo: Boolean(d.repetirTrasfondo ?? CAMPAÑA_POR_DEFECTO.repetirTrasfondo),
    ...(typeof d.nombre === 'string' && d.nombre ? { nombre: d.nombre } : {}),
    ...(typeof d.año === 'number' ? { año: d.año } : {}),
    ...(lista(d.carrerasPermitidas)?.length
      ? { carrerasPermitidas: lista(d.carrerasPermitidas) }
      : {}),
    ...(lista(d.pueblosPermitidos)?.length
      ? { pueblosPermitidos: lista(d.pueblosPermitidos) }
      : {}),
  };
}

/** Código para el enlace: JSON en base64url (admite tildes). */
export function codificarCampaña(c: Campaña): string {
  const bytes = new TextEncoder().encode(JSON.stringify(c));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodificarCampaña(codigo: string): Campaña {
  try {
    const b64 = codigo.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return normalizarCampaña(JSON.parse(new TextDecoder().decode(bytes)));
  } catch (e) {
    throw new Error('El enlace de campaña no es válido.', { cause: e });
  }
}

export function serializarCampaña(c: Campaña): string {
  return JSON.stringify({ formato: FORMATO_CAMPAÑA, ...c }, null, 1);
}
