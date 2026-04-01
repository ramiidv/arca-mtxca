// Shared types from common
export type { AccessTicket, ArcaEvent, ServerStatus, SoapCallOptions } from '@ramiidv/arca-common';
import type { ArcaEvent } from '@ramiidv/arca-common';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ArcaMtxcaConfig {
  /** Contenido del certificado X.509 en formato PEM */
  cert: string;
  /** Contenido de la clave privada en formato PEM */
  key: string;
  /** CUIT del contribuyente (sin guiones) */
  cuit: number;
  /** Usar entorno de produccion (default: false = testing/homologacion) */
  production?: boolean;
  /** Timeout para requests HTTP en milisegundos (default: 30000) */
  timeout?: number;
  /** Cantidad de reintentos en caso de error transitorio (default: 1) */
  retries?: number;
  /** Delay inicial entre reintentos en milisegundos, se duplica con cada intento (default: 1000) */
  retryDelayMs?: number;
  /** Callback para eventos del SDK (auth, requests, retries) */
  onEvent?: (event: ArcaEvent) => void;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export interface MtxcaAuth {
  Token: string;
  Sign: string;
  Cuit: number;
}

// ---------------------------------------------------------------------------
// Items (detalle de articulos)
// ---------------------------------------------------------------------------

export interface MtxcaItem {
  /** Codigo/Barcode del producto (EAN, interno, etc.) */
  codigo?: string;
  /** Descripcion del producto/servicio */
  descripcion: string;
  /** Cantidad */
  cantidad: number;
  /** Codigo de unidad de medida (consultarUnidadesMedida) */
  unidadMedida: number;
  /** Precio unitario */
  precioUnitario: number;
  /** Importe total del item (cantidad * precioUnitario - bonificacion) */
  importeItem: number;
  /** Codigo de condicion de IVA del item (usar enum CodigoCondicionIVA) */
  codigoCondicionIVA: number;
  /** Importe de IVA del item */
  importeIVA: number;
  /** Importe de bonificacion/descuento. Default: 0 */
  importeBonificacion?: number;
}

// ---------------------------------------------------------------------------
// Subtotales IVA
// ---------------------------------------------------------------------------

export interface SubtotalIVA {
  /** Codigo de condicion de IVA */
  codigo: number;
  /** Base imponible */
  baseImponible: number;
  /** Importe de IVA */
  importe: number;
}

// ---------------------------------------------------------------------------
// Comprobante asociado
// ---------------------------------------------------------------------------

export interface MtxcaComprobanteAsociado {
  /** Tipo de comprobante asociado */
  codigoTipoComprobante: number;
  /** Punto de venta del comprobante asociado */
  numeroPuntoVenta: number;
  /** Numero de comprobante asociado */
  numeroComprobante: number;
  /** CUIT del emisor */
  cuit?: number;
}

// ---------------------------------------------------------------------------
// Tributo
// ---------------------------------------------------------------------------

export interface MtxcaTributo {
  /** Codigo del tributo */
  codigoTributo: number;
  /** Descripcion del tributo */
  descripcion?: string;
  /** Base imponible */
  baseImponible: number;
  /** Alicuota del tributo */
  alicuota?: number;
  /** Importe del tributo */
  importe: number;
}

// ---------------------------------------------------------------------------
// Invoice (request para autorizarComprobante)
// ---------------------------------------------------------------------------

export interface MtxcaInvoice {
  /** Concepto: 1=Productos, 2=Servicios, 3=Productos y Servicios */
  concepto: number;
  /** Tipo de documento del receptor */
  docTipo: number;
  /** Numero de documento del receptor */
  docNro: number;
  /** Fecha del comprobante (formato YYYY-MM-DD) */
  cbteFch: string;
  /** Items / articulos del comprobante */
  items: MtxcaItem[];
  /** Codigo de moneda (usar enum Moneda). Default: PES */
  codigoMoneda?: string;
  /** Cotizacion de la moneda (1 para pesos) */
  cotizacionMoneda?: number;
  /** Importe gravado */
  importeGravado?: number;
  /** Importe no gravado */
  importeNoGravado?: number;
  /** Importe exento */
  importeExento?: number;
  /** Subtotales de IVA */
  subtotalesIVA?: SubtotalIVA[];
  /** Importe total de tributos */
  importeOtrosTributos?: number;
  /** Detalle de tributos */
  otrosTributos?: MtxcaTributo[];
  /** Importe total del comprobante */
  importeTotal: number;
  /** Comprobantes asociados (para NC/ND) */
  comprobanteAsociado?: MtxcaComprobanteAsociado[];
  /** Fecha desde del servicio (formato YYYY-MM-DD, requerido para servicios) */
  fechaDesde?: string;
  /** Fecha hasta del servicio (formato YYYY-MM-DD, requerido para servicios) */
  fechaHasta?: string;
  /** Fecha de vencimiento de pago (formato YYYY-MM-DD, requerido para servicios) */
  fechaVtoPago?: string;
  /** Observaciones */
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// Invoice result
// ---------------------------------------------------------------------------

export interface MtxcaObservacion {
  code: number;
  msg: string;
}

export interface MtxcaInvoiceResult {
  /** Resultado: "A" = Aprobado, "R" = Rechazado */
  resultado: string;
  /** CAE otorgado (solo si aprobado) */
  cae?: string;
  /** Fecha de vencimiento del CAE (YYYY-MM-DD) */
  caeFchVto?: string;
  /** Numero de comprobante asignado */
  cbteNro: number;
  /** Observaciones de ARCA */
  observaciones: MtxcaObservacion[];
  /** Errores de ARCA */
  errores: MtxcaObservacion[];
}

// ---------------------------------------------------------------------------
// AutorizarRequest
// ---------------------------------------------------------------------------

export interface AutorizarRequest {
  /** Punto de venta */
  ptoVta: number;
  /** Tipo de comprobante (usar enum CbteTipo) */
  cbteTipo: number;
  /** Detalle del comprobante con articulos */
  invoice: MtxcaInvoice;
}

// ---------------------------------------------------------------------------
// ConsultarComprobante result
// ---------------------------------------------------------------------------

export interface MtxcaComprobante {
  codigoTipoComprobante: number;
  numeroPuntoVenta: number;
  numeroComprobante: number;
  fechaEmision: string;
  codigoTipoDocumento: number;
  numeroDocumento: number;
  importeTotal: number;
  importeNoGravado: number;
  importeGravado: number;
  importeExento: number;
  importeOtrosTributos: number;
  importeSubtotal: number;
  codigoMoneda: string;
  cotizacionMoneda: number;
  resultado: string;
  codigoAutorizacion?: string;
  fechaVencimiento?: string;
  observaciones: MtxcaObservacion[];
  items: MtxcaItem[];
}

// ---------------------------------------------------------------------------
// Parameter types (from consultar* methods)
// ---------------------------------------------------------------------------

export interface ParamItem {
  /** ID numerico del parametro */
  Id: number;
  /** Descripcion */
  Desc: string;
  /** Fecha vigencia desde */
  FchDesde?: string;
  /** Fecha vigencia hasta */
  FchHasta?: string;
}

export interface MonedaItem {
  /** Codigo de moneda (ej: "PES", "DOL") */
  Id: string;
  /** Descripcion */
  Desc: string;
  /** Fecha vigencia desde */
  FchDesde?: string;
  /** Fecha vigencia hasta */
  FchHasta?: string;
}

export interface UnidadMedidaItem {
  /** Codigo de unidad de medida */
  Id: number;
  /** Descripcion */
  Desc: string;
  /** Fecha vigencia desde */
  FchDesde?: string;
  /** Fecha vigencia hasta */
  FchHasta?: string;
}

export interface PtoVentaItem {
  /** Numero de punto de venta */
  Nro: number;
  /** Tipo de emision (CAE/CAEA) */
  EmisionTipo: string;
  /** Si esta bloqueado */
  Bloqueado: string;
  /** Fecha de baja */
  FchBaja: string;
}

export interface CotizacionResult {
  /** Codigo de moneda */
  monedaId: string;
  /** Cotizacion */
  cotizacion: number;
  /** Fecha de cotizacion */
  fechaCotizacion: string;
}
