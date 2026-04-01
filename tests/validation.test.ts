import { describe, it, expect } from 'vitest';
import { validateAutorizarRequest, validateMtxcaItem } from '../src/validation.js';
import type { AutorizarRequest, MtxcaItem } from '../src/types.js';

const validItem: MtxcaItem = {
  codigo: '7790001000012',
  descripcion: 'Producto de ejemplo',
  cantidad: 2,
  unidadMedida: 7,
  precioUnitario: 100,
  importeItem: 200,
  codigoCondicionIVA: 5,
  importeIVA: 42,
};

const validRequest: AutorizarRequest = {
  ptoVta: 1,
  cbteTipo: 6,
  invoice: {
    concepto: 1,
    docTipo: 99,
    docNro: 0,
    cbteFch: '2026-03-31',
    importeTotal: 242,
    items: [validItem],
  },
};

describe('validateMtxcaItem', () => {
  it('acepta item valido', () => {
    expect(() => validateMtxcaItem(validItem)).not.toThrow();
  });

  it('acepta item sin codigo (opcional)', () => {
    const { codigo, ...itemSinCodigo } = validItem;
    expect(() => validateMtxcaItem(itemSinCodigo as MtxcaItem)).not.toThrow();
  });

  it('acepta precioUnitario = 0', () => {
    expect(() =>
      validateMtxcaItem({ ...validItem, precioUnitario: 0 }),
    ).not.toThrow();
  });

  it('rechaza descripcion vacia', () => {
    expect(() =>
      validateMtxcaItem({ ...validItem, descripcion: '' }),
    ).toThrow('descripcion');
  });

  it('rechaza cantidad = 0', () => {
    expect(() =>
      validateMtxcaItem({ ...validItem, cantidad: 0 }),
    ).toThrow('cantidad');
  });

  it('rechaza cantidad negativa', () => {
    expect(() =>
      validateMtxcaItem({ ...validItem, cantidad: -1 }),
    ).toThrow('cantidad');
  });

  it('rechaza precioUnitario negativo', () => {
    expect(() =>
      validateMtxcaItem({ ...validItem, precioUnitario: -10 }),
    ).toThrow('precioUnitario');
  });

  it('rechaza unidadMedida = 0', () => {
    expect(() =>
      validateMtxcaItem({ ...validItem, unidadMedida: 0 }),
    ).toThrow('unidadMedida');
  });

  it('rechaza unidadMedida negativa', () => {
    expect(() =>
      validateMtxcaItem({ ...validItem, unidadMedida: -1 }),
    ).toThrow('unidadMedida');
  });

  it('incluye indice en el campo cuando se provee', () => {
    try {
      validateMtxcaItem({ ...validItem, descripcion: '' }, 3);
      expect.unreachable('deberia haber lanzado');
    } catch (e: any) {
      expect(e.details[0].field).toBe('items[3].descripcion');
    }
  });
});

describe('validateAutorizarRequest', () => {
  it('acepta request valido', () => {
    expect(() => validateAutorizarRequest(validRequest)).not.toThrow();
  });

  it('rechaza ptoVta = 0', () => {
    expect(() =>
      validateAutorizarRequest({ ...validRequest, ptoVta: 0 }),
    ).toThrow('ptoVta');
  });

  it('rechaza ptoVta negativo', () => {
    expect(() =>
      validateAutorizarRequest({ ...validRequest, ptoVta: -1 }),
    ).toThrow('ptoVta');
  });

  it('rechaza cbteTipo = 0', () => {
    expect(() =>
      validateAutorizarRequest({ ...validRequest, cbteTipo: 0 }),
    ).toThrow('cbteTipo');
  });

  it('rechaza items vacio', () => {
    expect(() =>
      validateAutorizarRequest({
        ...validRequest,
        invoice: { ...validRequest.invoice, items: [] },
      }),
    ).toThrow('items');
  });

  it('rechaza cbteFch vacio', () => {
    expect(() =>
      validateAutorizarRequest({
        ...validRequest,
        invoice: { ...validRequest.invoice, cbteFch: '' },
      }),
    ).toThrow('cbteFch');
  });

  it('rechaza importeTotal negativo', () => {
    expect(() =>
      validateAutorizarRequest({
        ...validRequest,
        invoice: { ...validRequest.invoice, importeTotal: -1 },
      }),
    ).toThrow('importeTotal');
  });

  it('rechaza items con campos invalidos', () => {
    expect(() =>
      validateAutorizarRequest({
        ...validRequest,
        invoice: {
          ...validRequest.invoice,
          items: [{ ...validItem, descripcion: '', cantidad: -1 }],
        },
      }),
    ).toThrow('descripcion');
  });

  it('acepta importeTotal = 0', () => {
    expect(() =>
      validateAutorizarRequest({
        ...validRequest,
        invoice: { ...validRequest.invoice, importeTotal: 0 },
      }),
    ).not.toThrow();
  });

  it('valida multiples items', () => {
    expect(() =>
      validateAutorizarRequest({
        ...validRequest,
        invoice: {
          ...validRequest.invoice,
          items: [validItem, { ...validItem, cantidad: 0 }],
        },
      }),
    ).toThrow('cantidad');
  });
});
