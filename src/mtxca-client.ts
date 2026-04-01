import { afipSoapCall, ensureArray } from '@ramiidv/arca-common';
import type { ArcaEvent, SoapCallOptions, ServerStatus } from '@ramiidv/arca-common';
import { MTXCA_ENDPOINTS, MTXCA_NAMESPACE } from './constants.js';
import type {
  MtxcaAuth,
  AutorizarRequest,
  MtxcaInvoiceResult,
  MtxcaComprobante,
  MtxcaObservacion,
  MtxcaItem,
  ParamItem,
  MonedaItem,
  UnidadMedidaItem,
  PtoVentaItem,
  CotizacionResult,
} from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type R = Record<string, unknown>;

function extractObservaciones(result: R): MtxcaObservacion[] {
  const obs = result['arrayObservaciones'] as R | undefined;
  if (!obs) return [];
  const arr = ensureArray(obs['codigoDescripcion'] as R | R[] | undefined);
  return arr.map((o) => ({
    code: Number(o['codigo'] ?? 0),
    msg: String(o['descripcion'] ?? ''),
  }));
}

function extractErrores(result: R): MtxcaObservacion[] {
  const errs = result['arrayErrores'] as R | undefined;
  if (!errs) return [];
  const arr = ensureArray(errs['codigoDescripcion'] as R | R[] | undefined);
  return arr.map((e) => ({
    code: Number(e['codigo'] ?? 0),
    msg: String(e['descripcion'] ?? ''),
  }));
}

function extractItems(result: R): MtxcaItem[] {
  const items = result['arrayItems'] as R | undefined;
  if (!items) return [];
  const arr = ensureArray(items['item'] as R | R[] | undefined);
  return arr.map((i) => ({
    codigo: i['codigo'] != null ? String(i['codigo']) : undefined,
    descripcion: String(i['descripcion'] ?? ''),
    cantidad: Number(i['cantidad'] ?? 0),
    unidadMedida: Number(i['unidadMedida'] ?? 0),
    precioUnitario: Number(i['precioUnitario'] ?? 0),
    importeItem: Number(i['importeItem'] ?? 0),
    codigoCondicionIVA: Number(i['codigoCondicionIVA'] ?? 0),
    importeIVA: Number(i['importeIVA'] ?? 0),
    importeBonificacion: i['importeBonificacion'] != null
      ? Number(i['importeBonificacion'])
      : undefined,
  }));
}

// ---------------------------------------------------------------------------
// MtxcaClient
// ---------------------------------------------------------------------------

export interface MtxcaClientConfig {
  /** Use production endpoints */
  production: boolean;
  /** SOAP call options */
  soapOptions?: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'>;
  /** Event callback */
  onEvent?: (event: ArcaEvent) => void;
}

/**
 * Low-level client for the WSMTXCA web service.
 * Wraps each SOAP method. Does not handle authentication.
 */
export class MtxcaClient {
  private readonly endpoint: string;
  private readonly soapOptions?: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'>;
  private readonly onEvent?: (event: ArcaEvent) => void;

  constructor(config: MtxcaClientConfig) {
    this.endpoint = config.production
      ? MTXCA_ENDPOINTS.production
      : MTXCA_ENDPOINTS.testing;
    this.soapOptions = config.soapOptions;
    this.onEvent = config.onEvent;
  }

  private call(method: string, params: R): Promise<R> {
    return afipSoapCall(
      this.endpoint,
      MTXCA_NAMESPACE,
      method,
      params,
      { ...this.soapOptions, onEvent: this.onEvent },
    );
  }

  // =========================================================================
  // Facturacion
  // =========================================================================

  /**
   * Autoriza un comprobante con detalle de articulos.
   */
  async autorizarComprobante(
    auth: MtxcaAuth,
    request: AutorizarRequest,
  ): Promise<MtxcaInvoiceResult> {
    const itemsArray = request.invoice.items.map((item) => {
      const mapped: R = {
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        unidadMedida: item.unidadMedida,
        precioUnitario: item.precioUnitario,
        importeItem: item.importeItem,
        codigoCondicionIVA: item.codigoCondicionIVA,
        importeIVA: item.importeIVA,
      };
      if (item.codigo != null) mapped['codigo'] = item.codigo;
      if (item.importeBonificacion != null) mapped['importeBonificacion'] = item.importeBonificacion;
      return mapped;
    });

    const comprobante: R = {
      codigoTipoComprobante: request.cbteTipo,
      numeroPuntoVenta: request.ptoVta,
      codigoConcepto: request.invoice.concepto,
      codigoTipoDocumento: request.invoice.docTipo,
      numeroDocumento: request.invoice.docNro,
      fechaEmision: request.invoice.cbteFch,
      importeTotal: request.invoice.importeTotal,
      arrayItems: {
        item: itemsArray,
      },
    };

    // Optional fields
    if (request.invoice.codigoMoneda != null) {
      comprobante['codigoMoneda'] = request.invoice.codigoMoneda;
    }
    if (request.invoice.cotizacionMoneda != null) {
      comprobante['cotizacionMoneda'] = request.invoice.cotizacionMoneda;
    }
    if (request.invoice.importeGravado != null) {
      comprobante['importeGravado'] = request.invoice.importeGravado;
    }
    if (request.invoice.importeNoGravado != null) {
      comprobante['importeNoGravado'] = request.invoice.importeNoGravado;
    }
    if (request.invoice.importeExento != null) {
      comprobante['importeExento'] = request.invoice.importeExento;
    }
    if (request.invoice.importeOtrosTributos != null) {
      comprobante['importeOtrosTributos'] = request.invoice.importeOtrosTributos;
    }

    // Subtotales de IVA
    if (request.invoice.subtotalesIVA && request.invoice.subtotalesIVA.length > 0) {
      comprobante['arraySubtotalesIVA'] = {
        subtotalIVA: request.invoice.subtotalesIVA.map((s) => ({
          codigo: s.codigo,
          baseImponible: s.baseImponible,
          importe: s.importe,
        })),
      };
    }

    // Otros tributos
    if (request.invoice.otrosTributos && request.invoice.otrosTributos.length > 0) {
      comprobante['arrayOtrosTributos'] = {
        otroTributo: request.invoice.otrosTributos.map((t) => {
          const mapped: R = {
            codigo: t.codigoTributo,
            baseImponible: t.baseImponible,
            importe: t.importe,
          };
          if (t.descripcion != null) mapped['descripcion'] = t.descripcion;
          if (t.alicuota != null) mapped['alicuota'] = t.alicuota;
          return mapped;
        }),
      };
    }

    // Comprobantes asociados
    if (request.invoice.comprobanteAsociado && request.invoice.comprobanteAsociado.length > 0) {
      comprobante['arrayComprobantesAsociados'] = {
        comprobanteAsociado: request.invoice.comprobanteAsociado.map((c) => {
          const mapped: R = {
            codigoTipoComprobante: c.codigoTipoComprobante,
            numeroPuntoVenta: c.numeroPuntoVenta,
            numeroComprobante: c.numeroComprobante,
          };
          if (c.cuit != null) mapped['cuit'] = c.cuit;
          return mapped;
        }),
      };
    }

    // Fechas de servicio
    if (request.invoice.fechaDesde != null) {
      comprobante['fechaDesde'] = request.invoice.fechaDesde;
    }
    if (request.invoice.fechaHasta != null) {
      comprobante['fechaHasta'] = request.invoice.fechaHasta;
    }
    if (request.invoice.fechaVtoPago != null) {
      comprobante['fechaVtoPago'] = request.invoice.fechaVtoPago;
    }

    // Observaciones
    if (request.invoice.observaciones != null) {
      comprobante['observaciones'] = request.invoice.observaciones;
    }

    const result = await this.call('autorizarComprobante', {
      authRequest: {
        token: auth.Token,
        sign: auth.Sign,
        cuitRepresentada: auth.Cuit,
      },
      comprobanteCAERequest: comprobante,
    });

    const comprobanteResponse = (result['comprobanteResponse'] ?? result) as R;

    return {
      resultado: String(comprobanteResponse['resultado'] ?? ''),
      cae: comprobanteResponse['CAE'] != null
        ? String(comprobanteResponse['CAE'])
        : undefined,
      caeFchVto: comprobanteResponse['fechaVencimientoCAE'] != null
        ? String(comprobanteResponse['fechaVencimientoCAE'])
        : undefined,
      cbteNro: Number(comprobanteResponse['numeroComprobante'] ?? 0),
      observaciones: extractObservaciones(result),
      errores: extractErrores(result),
    };
  }

  /**
   * Consulta un comprobante previamente autorizado.
   */
  async consultarComprobante(
    auth: MtxcaAuth,
    cbteTipo: number,
    ptoVta: number,
    cbteNro: number,
  ): Promise<MtxcaComprobante> {
    const result = await this.call('consultarComprobante', {
      authRequest: {
        token: auth.Token,
        sign: auth.Sign,
        cuitRepresentada: auth.Cuit,
      },
      consultaComprobanteRequest: {
        codigoTipoComprobante: cbteTipo,
        numeroPuntoVenta: ptoVta,
        numeroComprobante: cbteNro,
      },
    });

    const comp = (result['comprobante'] ?? result) as R;

    return {
      codigoTipoComprobante: Number(comp['codigoTipoComprobante'] ?? 0),
      numeroPuntoVenta: Number(comp['numeroPuntoVenta'] ?? 0),
      numeroComprobante: Number(comp['numeroComprobante'] ?? 0),
      fechaEmision: String(comp['fechaEmision'] ?? ''),
      codigoTipoDocumento: Number(comp['codigoTipoDocumento'] ?? 0),
      numeroDocumento: Number(comp['numeroDocumento'] ?? 0),
      importeTotal: Number(comp['importeTotal'] ?? 0),
      importeNoGravado: Number(comp['importeNoGravado'] ?? 0),
      importeGravado: Number(comp['importeGravado'] ?? 0),
      importeExento: Number(comp['importeExento'] ?? 0),
      importeOtrosTributos: Number(comp['importeOtrosTributos'] ?? 0),
      importeSubtotal: Number(comp['importeSubtotal'] ?? 0),
      codigoMoneda: String(comp['codigoMoneda'] ?? 'PES'),
      cotizacionMoneda: Number(comp['cotizacionMoneda'] ?? 1),
      resultado: String(comp['resultado'] ?? ''),
      codigoAutorizacion: comp['codigoAutorizacion'] != null
        ? String(comp['codigoAutorizacion'])
        : undefined,
      fechaVencimiento: comp['fechaVencimiento'] != null
        ? String(comp['fechaVencimiento'])
        : undefined,
      observaciones: extractObservaciones(comp),
      items: extractItems(comp),
    };
  }

  /**
   * Consulta el ultimo comprobante autorizado.
   */
  async consultarUltimoComprobanteAutorizado(
    auth: MtxcaAuth,
    ptoVta: number,
    cbteTipo: number,
  ): Promise<number> {
    const result = await this.call('consultarUltimoComprobanteAutorizado', {
      authRequest: {
        token: auth.Token,
        sign: auth.Sign,
        cuitRepresentada: auth.Cuit,
      },
      consultaUltimoComprobanteAutorizadoRequest: {
        codigoTipoComprobante: cbteTipo,
        numeroPuntoVenta: ptoVta,
      },
    });

    return Number(result['numeroComprobante'] ?? 0);
  }

  // =========================================================================
  // Parametros
  // =========================================================================

  /**
   * Health check. No requiere autenticacion.
   */
  async dummy(): Promise<ServerStatus> {
    const result = await this.call('dummy', {});
    return {
      appserver: String(result['appserver'] ?? ''),
      dbserver: String(result['dbserver'] ?? ''),
      authserver: String(result['authserver'] ?? ''),
    };
  }

  async consultarTiposComprobante(auth: MtxcaAuth): Promise<ParamItem[]> {
    return this.getParam(auth, 'consultarTiposComprobante', 'arrayTiposComprobante', 'codigoDescripcion');
  }

  async consultarTiposDocumento(auth: MtxcaAuth): Promise<ParamItem[]> {
    return this.getParam(auth, 'consultarTiposDocumento', 'arrayTiposDocumento', 'codigoDescripcion');
  }

  async consultarAlicuotasIVA(auth: MtxcaAuth): Promise<ParamItem[]> {
    return this.getParam(auth, 'consultarAlicuotasIVA', 'arrayAlicuotasIVA', 'codigoDescripcion');
  }

  async consultarCondicionesIVA(auth: MtxcaAuth): Promise<ParamItem[]> {
    return this.getParam(auth, 'consultarCondicionesIVA', 'arrayCondicionesIVA', 'codigoDescripcion');
  }

  async consultarMonedas(auth: MtxcaAuth): Promise<MonedaItem[]> {
    const result = await this.call('consultarMonedas', {
      authRequest: {
        token: auth.Token,
        sign: auth.Sign,
        cuitRepresentada: auth.Cuit,
      },
    });
    const container = (result['arrayMonedas'] ?? result) as R;
    const arr = ensureArray(container['codigoDescripcion'] as R | R[] | undefined);
    return arr.map((m) => ({
      Id: String(m['codigo'] ?? ''),
      Desc: String(m['descripcion'] ?? ''),
      FchDesde: m['fechaDesde'] != null ? String(m['fechaDesde']) : undefined,
      FchHasta: m['fechaHasta'] != null ? String(m['fechaHasta']) : undefined,
    }));
  }

  async consultarUnidadesMedida(auth: MtxcaAuth): Promise<UnidadMedidaItem[]> {
    const result = await this.call('consultarUnidadesMedida', {
      authRequest: {
        token: auth.Token,
        sign: auth.Sign,
        cuitRepresentada: auth.Cuit,
      },
    });
    const container = (result['arrayUnidadesMedida'] ?? result) as R;
    const arr = ensureArray(container['codigoDescripcion'] as R | R[] | undefined);
    return arr.map((u) => ({
      Id: Number(u['codigo'] ?? 0),
      Desc: String(u['descripcion'] ?? ''),
      FchDesde: u['fechaDesde'] != null ? String(u['fechaDesde']) : undefined,
      FchHasta: u['fechaHasta'] != null ? String(u['fechaHasta']) : undefined,
    }));
  }

  async consultarPuntosVenta(auth: MtxcaAuth): Promise<PtoVentaItem[]> {
    return this.getPtosVenta(auth, 'consultarPuntosVenta', 'arrayPuntosVenta');
  }

  async consultarPuntosVentaCAE(auth: MtxcaAuth): Promise<PtoVentaItem[]> {
    return this.getPtosVenta(auth, 'consultarPuntosVentaCAE', 'arrayPuntosVenta');
  }

  async consultarPuntosVentaCAEA(auth: MtxcaAuth): Promise<PtoVentaItem[]> {
    return this.getPtosVenta(auth, 'consultarPuntosVentaCAEA', 'arrayPuntosVenta');
  }

  async consultarCotizacionMoneda(auth: MtxcaAuth, monedaId: string): Promise<CotizacionResult> {
    const result = await this.call('consultarCotizacionMoneda', {
      authRequest: {
        token: auth.Token,
        sign: auth.Sign,
        cuitRepresentada: auth.Cuit,
      },
      codigoMoneda: monedaId,
    });

    return {
      monedaId: String(result['codigoMoneda'] ?? monedaId),
      cotizacion: Number(result['cotizacionMoneda'] ?? 0),
      fechaCotizacion: String(result['fechaCotizacion'] ?? ''),
    };
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private async getParam(
    auth: MtxcaAuth,
    method: string,
    containerKey: string,
    itemKey: string,
  ): Promise<ParamItem[]> {
    const result = await this.call(method, {
      authRequest: {
        token: auth.Token,
        sign: auth.Sign,
        cuitRepresentada: auth.Cuit,
      },
    });
    const container = (result[containerKey] ?? result) as R;
    const arr = ensureArray(container[itemKey] as R | R[] | undefined);
    return arr.map((item) => ({
      Id: Number(item['codigo'] ?? 0),
      Desc: String(item['descripcion'] ?? ''),
      FchDesde: item['fechaDesde'] != null ? String(item['fechaDesde']) : undefined,
      FchHasta: item['fechaHasta'] != null ? String(item['fechaHasta']) : undefined,
    }));
  }

  private async getPtosVenta(
    auth: MtxcaAuth,
    method: string,
    containerKey: string,
  ): Promise<PtoVentaItem[]> {
    const result = await this.call(method, {
      authRequest: {
        token: auth.Token,
        sign: auth.Sign,
        cuitRepresentada: auth.Cuit,
      },
    });
    const container = (result[containerKey] ?? result) as R;
    const arr = ensureArray(container['puntoVenta'] as R | R[] | undefined);
    return arr.map((pv) => ({
      Nro: Number(pv['numeroPuntoVenta'] ?? 0),
      EmisionTipo: String(pv['tipoEmision'] ?? ''),
      Bloqueado: String(pv['bloqueado'] ?? ''),
      FchBaja: String(pv['fechaBaja'] ?? ''),
    }));
  }
}
