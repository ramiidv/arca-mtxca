/**
 * Ejemplo: Crear una factura con detalle de articulos (WSMTXCA)
 *
 * A diferencia de WSFE, el servicio WSMTXCA permite informar el detalle
 * de cada articulo: codigo de barras, descripcion, cantidad, precio
 * unitario e IVA por linea.
 *
 * Requisitos:
 *   - Certificado digital (.crt) y clave privada (.key) de ARCA
 *   - CUIT del contribuyente
 *   - Punto de venta habilitado para WSMTXCA
 */

import fs from "fs";
import { ArcaMtxca, CbteTipo, CodigoCondicionIVA } from "@ramiidv/arca-mtxca";

async function main() {
  // 1. Inicializar el SDK
  const mtxca = new ArcaMtxca({
    cuit: 20123456789,
    cert: fs.readFileSync("./certs/certificado.crt", "utf-8"),
    key: fs.readFileSync("./certs/clave.key", "utf-8"),
    production: false,
  });

  // 2. Verificar estado del servicio
  const status = await mtxca.status();
  console.log("Estado del servicio:", status);

  // 3. Autorizar una Factura B con detalle de articulos
  const result = await mtxca.autorizar({
    ptoVta: 1,
    cbteTipo: CbteTipo.FACTURA_B,
    invoice: {
      concepto: 1, // Productos
      docTipo: 99, // Consumidor final
      docNro: 0,
      cbteFch: "2026-03-31",
      importeTotal: 2541,
      importeGravado: 2100,
      items: [
        {
          codigo: "7790001000012",
          descripcion: "Producto A - Pack x6",
          cantidad: 2,
          unidadMedida: 7, // Unidades
          precioUnitario: 500,
          importeItem: 1000,
          codigoCondicionIVA: CodigoCondicionIVA.IVA_21,
          importeIVA: 210,
        },
        {
          codigo: "7790001000029",
          descripcion: "Producto B - 1kg",
          cantidad: 1,
          unidadMedida: 7,
          precioUnitario: 1100,
          importeItem: 1100,
          codigoCondicionIVA: CodigoCondicionIVA.IVA_21,
          importeIVA: 231,
        },
      ],
      subtotalesIVA: [
        {
          codigo: CodigoCondicionIVA.IVA_21,
          baseImponible: 2100,
          importe: 441,
        },
      ],
    },
  });

  // 4. Evaluar resultado
  if (result.resultado === "A") {
    console.log("Factura aprobada!");
    console.log(`  CAE: ${result.cae}`);
    console.log(`  Vencimiento CAE: ${result.caeFchVto}`);
    console.log(`  Comprobante #${result.cbteNro}`);
  } else {
    console.error("Factura rechazada:");
    for (const obs of result.observaciones) {
      console.error(`  [${obs.code}] ${obs.msg}`);
    }
    for (const err of result.errores) {
      console.error(`  Error [${err.code}]: ${err.msg}`);
    }
  }
}

main().catch(console.error);
