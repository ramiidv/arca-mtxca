import { WsaaClient } from '@ramiidv/arca-common';
import type { ArcaEvent, ServerStatus, SoapCallOptions } from '@ramiidv/arca-common';
import { MTXCA_SERVICE_ID } from './constants.js';
import { MtxcaClient } from './mtxca-client.js';
import { validateAutorizarRequest } from './validation.js';
import type {
  ArcaMtxcaConfig,
  MtxcaAuth,
  AutorizarRequest,
  MtxcaInvoiceResult,
  MtxcaComprobante,
  ParamItem,
  MonedaItem,
  UnidadMedidaItem,
  PtoVentaItem,
  CotizacionResult,
} from './types.js';

/**
 * Main orchestrator class for the WSMTXCA web service.
 *
 * Provides high-level methods that handle WSAA authentication automatically.
 * WSMTXCA is used for electronic invoicing WITH item-level detail (barcodes,
 * quantities, unit prices, product descriptions per line).
 *
 * @example
 * ```ts
 * import { ArcaMtxca, CbteTipo, CodigoCondicionIVA } from '@ramiidv/arca-mtxca';
 * import { readFileSync } from 'fs';
 *
 * const mtxca = new ArcaMtxca({
 *   cert: readFileSync('cert.pem', 'utf-8'),
 *   key: readFileSync('key.pem', 'utf-8'),
 *   cuit: 20123456789,
 *   production: false,
 * });
 *
 * const result = await mtxca.autorizar({
 *   ptoVta: 1,
 *   cbteTipo: CbteTipo.FACTURA_B,
 *   invoice: {
 *     concepto: 1,
 *     docTipo: 99,
 *     docNro: 0,
 *     cbteFch: '2026-03-31',
 *     importeTotal: 121,
 *     items: [{
 *       descripcion: 'Producto de ejemplo',
 *       cantidad: 1,
 *       unidadMedida: 7,
 *       precioUnitario: 100,
 *       importeItem: 100,
 *       codigoCondicionIVA: CodigoCondicionIVA.IVA_21,
 *       importeIVA: 21,
 *     }],
 *   },
 * });
 * ```
 */
export class ArcaMtxca {
  /** Low-level WSAA client for direct access */
  public readonly wsaa: WsaaClient;
  /** Low-level MTXCA SOAP client for direct access */
  public readonly client: MtxcaClient;

  private readonly cuit: number;
  private readonly onEvent?: (event: ArcaEvent) => void;

  constructor(config: ArcaMtxcaConfig) {
    const isProduction = config.production ?? false;
    this.cuit = config.cuit;
    this.onEvent = config.onEvent;

    const soapOptions: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'> = {
      timeout: config.timeout,
      retries: config.retries,
      retryDelayMs: config.retryDelayMs,
    };

    this.wsaa = new WsaaClient({
      cert: config.cert,
      key: config.key,
      production: isProduction,
      timeout: config.timeout,
      retries: config.retries,
      retryDelayMs: config.retryDelayMs,
      onEvent: config.onEvent,
    });

    this.client = new MtxcaClient({
      production: isProduction,
      soapOptions,
      onEvent: config.onEvent,
    });
  }

  // =========================================================================
  // Auth helper
  // =========================================================================

  private async getAuth(): Promise<MtxcaAuth> {
    const ticket = await this.wsaa.getAccessTicket(MTXCA_SERVICE_ID);
    return {
      Token: ticket.token,
      Sign: ticket.sign,
      Cuit: this.cuit,
    };
  }

  // =========================================================================
  // Facturacion
  // =========================================================================

  /**
   * Autoriza un comprobante con detalle de articulos.
   * Obtiene automaticamente el numero de comprobante siguiente.
   */
  async autorizar(request: AutorizarRequest): Promise<MtxcaInvoiceResult> {
    validateAutorizarRequest(request);
    const auth = await this.getAuth();
    return this.client.autorizarComprobante(auth, request);
  }

  /**
   * Ultimo numero de comprobante autorizado para un punto de venta y tipo.
   */
  async ultimoComprobante(ptoVta: number, cbteTipo: number): Promise<number> {
    const auth = await this.getAuth();
    return this.client.consultarUltimoComprobanteAutorizado(auth, ptoVta, cbteTipo);
  }

  /**
   * Siguiente numero de comprobante (ultimo + 1).
   */
  async siguienteComprobante(ptoVta: number, cbteTipo: number): Promise<number> {
    const ultimo = await this.ultimoComprobante(ptoVta, cbteTipo);
    return ultimo + 1;
  }

  /**
   * Consulta un comprobante previamente autorizado.
   */
  async consultarComprobante(
    cbteTipo: number,
    ptoVta: number,
    cbteNro: number,
  ): Promise<MtxcaComprobante> {
    const auth = await this.getAuth();
    return this.client.consultarComprobante(auth, cbteTipo, ptoVta, cbteNro);
  }

  // =========================================================================
  // Estado del servicio
  // =========================================================================

  /**
   * Health check del servicio WSMTXCA. No requiere autenticacion.
   */
  async status(): Promise<ServerStatus> {
    return this.client.dummy();
  }

  // =========================================================================
  // Parametros
  // =========================================================================

  /** Tipos de comprobante disponibles. */
  async getTiposComprobante(): Promise<ParamItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarTiposComprobante(auth);
  }

  /** Tipos de documento disponibles. */
  async getTiposDocumento(): Promise<ParamItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarTiposDocumento(auth);
  }

  /** Alicuotas de IVA disponibles. */
  async getAlicuotasIVA(): Promise<ParamItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarAlicuotasIVA(auth);
  }

  /** Condiciones de IVA disponibles. */
  async getCondicionesIVA(): Promise<ParamItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarCondicionesIVA(auth);
  }

  /** Monedas disponibles. */
  async getMonedas(): Promise<MonedaItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarMonedas(auth);
  }

  /** Unidades de medida disponibles. */
  async getUnidadesMedida(): Promise<UnidadMedidaItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarUnidadesMedida(auth);
  }

  /** Puntos de venta habilitados. */
  async getPuntosVenta(): Promise<PtoVentaItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarPuntosVenta(auth);
  }

  /** Puntos de venta habilitados para CAE. */
  async getPuntosVentaCAE(): Promise<PtoVentaItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarPuntosVentaCAE(auth);
  }

  /** Puntos de venta habilitados para CAEA. */
  async getPuntosVentaCAEA(): Promise<PtoVentaItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarPuntosVentaCAEA(auth);
  }

  /** Cotizacion de una moneda. */
  async getCotizacionMoneda(monedaId: string): Promise<CotizacionResult> {
    const auth = await this.getAuth();
    return this.client.consultarCotizacionMoneda(auth, monedaId);
  }

  // =========================================================================
  // Cache management
  // =========================================================================

  /** Invalida el ticket de acceso cacheado. */
  clearAuthCache(): void {
    this.wsaa.clearTicket(MTXCA_SERVICE_ID);
  }
}
