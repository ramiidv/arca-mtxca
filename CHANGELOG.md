# Changelog

## 0.1.0 (2026-03-31)

### Features
- Initial release
- Authorize invoices with item-level detail (barcodes, quantities, unit prices) via `autorizar()`
- Query last authorized comprobante number via `ultimoComprobante()`
- Compute next comprobante number via `siguienteComprobante()`
- Retrieve previously authorized comprobantes via `consultarComprobante()`
- Query parameter tables: tipos comprobante, tipos documento, alicuotas IVA, condiciones IVA, monedas, unidades de medida, puntos de venta, cotizacion de monedas
- Input validation for `autorizar()` request and item-level fields
- Enum helpers for CbteTipo, Concepto, CodigoCondicionIVA, and Moneda
- Service health check via `status()`
- Automatic WSAA authentication with ticket caching
- Full TypeScript support with strict types
