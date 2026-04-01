// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const MTXCA_ENDPOINTS = {
  testing: 'https://fwshomo.afip.gov.ar/wsmtxca/services/MTXCAService',
  production: 'https://serviciosjava.afip.gob.ar/wsmtxca/services/MTXCAService',
} as const;

export const MTXCA_NAMESPACE = 'http://impl.service.wsmtxca.afip.gov.ar/';

/** WSAA service ID for WSMTXCA */
export const MTXCA_SERVICE_ID = 'wsmtxca';

// ---------------------------------------------------------------------------
// Tipos de Comprobante (subset soportado por WSMTXCA)
// ---------------------------------------------------------------------------

export enum CbteTipo {
  FACTURA_A = 1,
  NOTA_DEBITO_A = 2,
  NOTA_CREDITO_A = 3,
  FACTURA_B = 6,
  NOTA_DEBITO_B = 7,
  NOTA_CREDITO_B = 8,
  FACTURA_M = 51,
  NOTA_DEBITO_M = 52,
  NOTA_CREDITO_M = 53,
}

// ---------------------------------------------------------------------------
// Concepto
// ---------------------------------------------------------------------------

export enum Concepto {
  PRODUCTOS = 1,
  SERVICIOS = 2,
  PRODUCTOS_Y_SERVICIOS = 3,
}

// ---------------------------------------------------------------------------
// Condicion de IVA (para items)
// ---------------------------------------------------------------------------

export enum CodigoCondicionIVA {
  NO_GRAVADO = 1,
  EXENTO = 2,
  IVA_0 = 3,
  IVA_10_5 = 4,
  IVA_21 = 5,
  IVA_27 = 6,
  GRAVADO = 7,
  IVA_5 = 8,
  IVA_2_5 = 9,
}

// ---------------------------------------------------------------------------
// Monedas
// ---------------------------------------------------------------------------

export enum Moneda {
  PESOS = 'PES',
  DOLARES = 'DOL',
  EUROS = '060',
  REALES = '012',
  PESOS_URUGUAYOS = '011',
  PESOS_CHILENOS = '033',
  GUARANIES = '031',
  BOLIVIANOS = '029',
  PESOS_COLOMBIANOS = '032',
  PESOS_MEXICANOS = '010',
  LIBRAS_ESTERLINAS = '021',
  YENES = '019',
  FRANCOS_SUIZOS = '009',
  DOLARES_CANADIENSES = '018',
  YUANES = '064',
}
