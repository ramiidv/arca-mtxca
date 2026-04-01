// Main class
export { ArcaMtxca } from './arca-mtxca.js';

// Low-level client
export { MtxcaClient } from './mtxca-client.js';
export type { MtxcaClientConfig } from './mtxca-client.js';

// Errors (re-exported from common)
export {
  ArcaError,
  ArcaAuthError,
  ArcaSoapError,
  ArcaServiceError,
} from '@ramiidv/arca-common';

// Types
export type {
  ArcaMtxcaConfig,
  MtxcaAuth,
  MtxcaItem,
  SubtotalIVA,
  MtxcaComprobanteAsociado,
  MtxcaTributo,
  MtxcaInvoice,
  MtxcaObservacion,
  MtxcaInvoiceResult,
  AutorizarRequest,
  MtxcaComprobante,
  ParamItem,
  MonedaItem,
  UnidadMedidaItem,
  PtoVentaItem,
  CotizacionResult,
  // Common types
  AccessTicket,
  ArcaEvent,
  ServerStatus,
  SoapCallOptions,
} from './types.js';

// Constants and enums
export {
  MTXCA_ENDPOINTS,
  MTXCA_NAMESPACE,
  MTXCA_SERVICE_ID,
  CbteTipo,
  Concepto,
  CodigoCondicionIVA,
  Moneda,
} from './constants.js';

// Validation
export { validateAutorizarRequest, validateMtxcaItem } from './validation.js';

// WSAA (re-exported from common)
export { WsaaClient } from '@ramiidv/arca-common';
export type { WsaaClientConfig } from '@ramiidv/arca-common';
