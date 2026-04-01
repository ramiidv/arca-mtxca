# @ramiidv/arca-mtxca

SDK de TypeScript para el web service WSMTXCA de ARCA (ex AFIP). Facturacion electronica con detalle de articulos (item-level detail: codigos de barras, cantidades, precios unitarios, descripciones por linea).

## Caracteristicas

- Zero dependencias SOAP: construye los envelopes SOAP manualmente
- Zero dependencias HTTP: usa `fetch` nativo (Node 18+)
- Firma CMS/PKCS#7 con node-forge (via arca-common)
- ESM only
- TypeScript estricto con tipos completos
- Cache automatico de tokens WSAA
- Reintentos con backoff exponencial
- Sistema de eventos para monitoreo

## Instalacion

```bash
npm install @ramiidv/arca-mtxca
```

## WSMTXCA vs WSFEv1

| Caracteristica | WSFEv1 (`arca-facturacion`) | WSMTXCA (`arca-mtxca`) |
|---|---|---|
| Detalle de items | No | Si (codigo, descripcion, cantidad, precio unitario por linea) |
| Protocolo | SOAP (.NET) | SOAP (Java) |
| Formato fechas | YYYYMMDD | YYYY-MM-DD |
| IVA por item | No (subtotales globales) | Si (codigoCondicionIVA + importeIVA por item) |
| Tipos cbte | A, B, C, E, M, FCE | A, B, M |
| Uso tipico | Facturas sin detalle de productos | Facturas con detalle de productos (ej: retail, e-commerce) |

## Inicio rapido

```typescript
import { readFileSync } from 'fs';
import { ArcaMtxca, CbteTipo, CodigoCondicionIVA } from '@ramiidv/arca-mtxca';

const mtxca = new ArcaMtxca({
  cert: readFileSync('./cert.pem', 'utf-8'),
  key: readFileSync('./key.pem', 'utf-8'),
  cuit: 20123456789,
  production: false, // false = homologacion
});

// Autorizar factura B con detalle de articulos
const result = await mtxca.autorizar({
  ptoVta: 1,
  cbteTipo: CbteTipo.FACTURA_B,
  invoice: {
    concepto: 1, // Productos
    docTipo: 99, // Consumidor Final
    docNro: 0,
    cbteFch: '2026-03-31',
    importeTotal: 121,
    importeGravado: 100,
    importeNoGravado: 0,
    importeExento: 0,
    subtotalesIVA: [
      { codigo: CodigoCondicionIVA.IVA_21, baseImponible: 100, importe: 21 },
    ],
    items: [
      {
        codigo: '7790001000012',
        descripcion: 'Producto de ejemplo',
        cantidad: 2,
        unidadMedida: 7, // unidades
        precioUnitario: 50,
        importeItem: 100,
        codigoCondicionIVA: CodigoCondicionIVA.IVA_21,
        importeIVA: 21,
      },
    ],
  },
});

if (result.resultado === 'A') {
  console.log('CAE:', result.cae);
  console.log('Vencimiento:', result.caeFchVto);
  console.log('Cbte Nro:', result.cbteNro);
}
```

## Configuracion

```typescript
interface ArcaMtxcaConfig {
  /** Certificado X.509 en formato PEM */
  cert: string;
  /** Clave privada RSA en formato PEM */
  key: string;
  /** CUIT del contribuyente (sin guiones) */
  cuit: number;
  /** Usar endpoints de produccion (default: false) */
  production?: boolean;
  /** Timeout en ms (default: 30000) */
  timeout?: number;
  /** Cantidad de reintentos en errores 5xx/red (default: 1) */
  retries?: number;
  /** Delay base en ms para backoff exponencial (default: 1000) */
  retryDelayMs?: number;
  /** Callback de eventos para monitoreo */
  onEvent?: (event: ArcaEvent) => void;
}
```

## API

### Metodos principales

#### `autorizar(request: AutorizarRequest): Promise<MtxcaInvoiceResult>`

Autoriza un comprobante con detalle de articulos. Retorna CAE si fue aprobado.

```typescript
const result = await mtxca.autorizar({
  ptoVta: 1,
  cbteTipo: CbteTipo.FACTURA_A,
  invoice: {
    concepto: 1,
    docTipo: 80, // CUIT
    docNro: 30123456789,
    cbteFch: '2026-03-31',
    importeTotal: 242,
    importeGravado: 200,
    subtotalesIVA: [
      { codigo: CodigoCondicionIVA.IVA_21, baseImponible: 200, importe: 42 },
    ],
    items: [
      {
        codigo: '001',
        descripcion: 'Servicio de consultoria',
        cantidad: 1,
        unidadMedida: 7,
        precioUnitario: 200,
        importeItem: 200,
        codigoCondicionIVA: CodigoCondicionIVA.IVA_21,
        importeIVA: 42,
      },
    ],
  },
});
```

#### `ultimoComprobante(ptoVta, cbteTipo): Promise<number>`

Ultimo numero de comprobante autorizado.

```typescript
const ultimo = await mtxca.ultimoComprobante(1, CbteTipo.FACTURA_B);
```

#### `siguienteComprobante(ptoVta, cbteTipo): Promise<number>`

Siguiente numero de comprobante (ultimo + 1).

```typescript
const siguiente = await mtxca.siguienteComprobante(1, CbteTipo.FACTURA_B);
```

#### `consultarComprobante(cbteTipo, ptoVta, cbteNro): Promise<MtxcaComprobante>`

Consulta un comprobante previamente autorizado, incluyendo el detalle de items.

```typescript
const comprobante = await mtxca.consultarComprobante(CbteTipo.FACTURA_B, 1, 150);
console.log(comprobante.items); // Detalle de articulos
```

#### `status(): Promise<ServerStatus>`

Health check del servicio. No requiere autenticacion.

```typescript
const estado = await mtxca.status();
console.log(estado.appserver); // "OK"
```

### Consulta de parametros

```typescript
const tiposCbte = await mtxca.getTiposComprobante();
const tiposDoc = await mtxca.getTiposDocumento();
const alicuotas = await mtxca.getAlicuotasIVA();
const condiciones = await mtxca.getCondicionesIVA();
const monedas = await mtxca.getMonedas();
const unidades = await mtxca.getUnidadesMedida();
const ptosVenta = await mtxca.getPuntosVenta();
const ptosVentaCAE = await mtxca.getPuntosVentaCAE();
const ptosVentaCAEA = await mtxca.getPuntosVentaCAEA();
const cotizacion = await mtxca.getCotizacionMoneda('DOL');
```

### Acceso a clientes de bajo nivel

Para casos avanzados, se pueden usar los clientes individuales directamente:

```typescript
const mtxca = new ArcaMtxca({ /* ... */ });

// Obtener ticket de acceso manualmente
const ticket = await mtxca.wsaa.getAccessTicket('wsmtxca');

const auth = {
  Token: ticket.token,
  Sign: ticket.sign,
  Cuit: 20123456789,
};

// Llamar directamente al servicio
const result = await mtxca.client.autorizarComprobante(auth, request);
```

## Tipos principales

### MtxcaItem

```typescript
interface MtxcaItem {
  codigo?: string;         // Codigo/barcode del producto
  descripcion: string;     // Descripcion del producto/servicio
  cantidad: number;        // Cantidad
  unidadMedida: number;    // Codigo unidad de medida
  precioUnitario: number;  // Precio unitario
  importeItem: number;     // Importe total del item
  codigoCondicionIVA: number; // Condicion de IVA del item
  importeIVA: number;      // Importe de IVA del item
  importeBonificacion?: number; // Descuento
}
```

### MtxcaInvoiceResult

```typescript
interface MtxcaInvoiceResult {
  resultado: string;     // "A" = Aprobado, "R" = Rechazado
  cae?: string;          // CAE otorgado
  caeFchVto?: string;    // Vencimiento del CAE (YYYY-MM-DD)
  cbteNro: number;       // Numero de comprobante
  observaciones: MtxcaObservacion[];
  errores: MtxcaObservacion[];
}
```

### MtxcaComprobante

```typescript
interface MtxcaComprobante {
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
```

## Manejo de errores

El SDK usa la jerarquia de errores de `@ramiidv/arca-common`:

```
Error
  └── ArcaError (base)
        ├── ArcaAuthError (errores de WSAA)
        ├── ArcaServiceError (errores de negocio)
        └── ArcaSoapError (errores HTTP/transporte)
```

```typescript
import { ArcaAuthError, ArcaServiceError, ArcaSoapError } from '@ramiidv/arca-mtxca';

try {
  await mtxca.autorizar(request);
} catch (error) {
  if (error instanceof ArcaAuthError) {
    // Certificado vencido, servicio no autorizado, WSAA caido
    console.error('Error de autenticacion:', error.message);
  } else if (error instanceof ArcaServiceError) {
    // Errores de negocio (comprobante rechazado, etc.)
    for (const detalle of error.errors) {
      console.error(`[${detalle.code}] ${detalle.msg}`);
    }
  } else if (error instanceof ArcaSoapError) {
    // Errores HTTP/red
    console.error('Error HTTP:', error.statusCode, error.message);
  }
}
```

Ademas, las respuestas de `autorizar()` pueden tener `resultado === 'R'` con observaciones/errores sin lanzar excepcion. Siempre verificar `result.resultado`:

```typescript
const result = await mtxca.autorizar(request);
if (result.resultado !== 'A') {
  console.error('Rechazado:', result.errores);
  console.warn('Observaciones:', result.observaciones);
}
```

## Eventos

```typescript
const mtxca = new ArcaMtxca({
  // ...
  onEvent: (evento) => {
    switch (evento.type) {
      case 'auth:login':
        console.log(`Login para ${evento.service}`);
        break;
      case 'auth:cache-hit':
        console.log(`Token cacheado para ${evento.service}`);
        break;
      case 'request:start':
        console.log(`Inicio ${evento.method}`);
        break;
      case 'request:end':
        console.log(`Fin ${evento.method} (${evento.durationMs}ms)`);
        break;
      case 'request:retry':
        console.log(`Reintento #${evento.attempt}`);
        break;
      case 'request:error':
        console.error(`Error: ${evento.error}`);
        break;
    }
  },
});
```

## Enums utiles

```typescript
import { CbteTipo, Concepto, CodigoCondicionIVA, Moneda } from '@ramiidv/arca-mtxca';

// Tipos de comprobante
CbteTipo.FACTURA_A     // 1
CbteTipo.NOTA_DEBITO_A // 2
CbteTipo.NOTA_CREDITO_A // 3
CbteTipo.FACTURA_B     // 6
CbteTipo.NOTA_DEBITO_B // 7
CbteTipo.NOTA_CREDITO_B // 8

// Concepto
Concepto.PRODUCTOS     // 1
Concepto.SERVICIOS     // 2
Concepto.PRODUCTOS_Y_SERVICIOS // 3

// Condicion IVA del item
CodigoCondicionIVA.NO_GRAVADO // 1
CodigoCondicionIVA.EXENTO     // 2
CodigoCondicionIVA.IVA_0      // 3
CodigoCondicionIVA.IVA_10_5   // 4
CodigoCondicionIVA.IVA_21     // 5
CodigoCondicionIVA.IVA_27     // 6
CodigoCondicionIVA.GRAVADO    // 7
CodigoCondicionIVA.IVA_5      // 8
CodigoCondicionIVA.IVA_2_5    // 9

// Monedas
Moneda.PESOS   // "PES"
Moneda.DOLARES // "DOL"
Moneda.EUROS   // "060"
```

## Requisitos

- Node.js >= 18 (soporte nativo de `fetch`)
- Certificado digital emitido por ARCA/AFIP
- Autorizacion para el servicio `wsmtxca`

## Licencia

MIT
