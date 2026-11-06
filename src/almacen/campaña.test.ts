import { describe, expect, it } from 'vitest';
import { CAMPAÑA_POR_DEFECTO } from '../motor/personaje';
import { codificarCampaña, decodificarCampaña, normalizarCampaña } from './campaña';

describe('archivo de campaña', () => {
  it('ida y vuelta por el enlace, con tildes', () => {
    const c = {
      ...CAMPAÑA_POR_DEFECTO,
      nombre: 'La sombra del Temple · Castilla',
      año: 1366,
      carrerasPermitidas: ['guerrero', 'medico'],
    };
    expect(decodificarCampaña(codificarCampaña(c))).toEqual(c);
    expect(codificarCampaña(c)).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it('rellena lo que falta y descarta lo que no vale', () => {
    const c = normalizarCampaña({
      permitirMagia: false,
      metodosHabilidades: ['piramide', 'trampa'],
      pueblosPermitidos: [],
    });
    expect(c.permitirMagia).toBe(false);
    expect(c.metodosHabilidades).toEqual(['piramide']);
    expect(c.pueblosPermitidos).toBeUndefined();
    expect(c.metodosCaracteristicas).toEqual(CAMPAÑA_POR_DEFECTO.metodosCaracteristicas);
  });
  it('rechaza enlaces rotos', () => {
    expect(() => decodificarCampaña('%%%')).toThrow('no es válido');
  });
});
