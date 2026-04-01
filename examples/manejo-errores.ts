/**
 * Ejemplo: Manejo de errores
 *
 * El SDK provee clases de error especificas para catch granular:
 *   - ArcaAuthError: falla de autenticacion WSAA
 *   - ArcaSoapError: error HTTP/SOAP (timeout, servidor caido)
 *   - ArcaServiceError: error de negocio de ARCA (con codigos)
 *   - ArcaValidationError: datos de entrada invalidos
 */

import fs from "fs";
import {
  ArcaMtxca,
  CbteTipo,
  CodigoCondicionIVA,
  ArcaAuthError,
  ArcaSoapError,
  ArcaServiceError,
} from "@ramiidv/arca-mtxca";
import { ArcaValidationError } from "@ramiidv/arca-common";

async function main() {
  const mtxca = new ArcaMtxca({
    cuit: 20123456789,
    cert: fs.readFileSync("./certs/certificado.crt", "utf-8"),
    key: fs.readFileSync("./certs/clave.key", "utf-8"),
    production: false,
    timeout: 60_000,
  });

  try {
    const result = await mtxca.autorizar({
      ptoVta: 1,
      cbteTipo: CbteTipo.FACTURA_B,
      invoice: {
        concepto: 1,
        docTipo: 99,
        docNro: 0,
        cbteFch: "2026-03-31",
        importeTotal: 121,
        items: [
          {
            descripcion: "Producto de ejemplo",
            cantidad: 1,
            unidadMedida: 7,
            precioUnitario: 100,
            importeItem: 100,
            codigoCondicionIVA: CodigoCondicionIVA.IVA_21,
            importeIVA: 21,
          },
        ],
      },
    });

    if (result.resultado !== "A") {
      console.error("Factura rechazada:");
      for (const obs of result.observaciones) {
        console.error(`  [${obs.code}] ${obs.msg}`);
      }
      return;
    }

    console.log(`CAE: ${result.cae}`);
  } catch (e) {
    if (e instanceof ArcaValidationError) {
      // Datos de entrada invalidos (se detecta antes de llamar al servicio)
      console.error("Error de validacion:", e.message);
      for (const detail of e.details) {
        console.error(`  Campo: ${detail.field} - ${detail.message}`);
      }
    } else if (e instanceof ArcaAuthError) {
      // Certificado invalido, expirado, o respuesta WSAA inesperada
      console.error("Error de autenticacion:", e.message);
      mtxca.clearAuthCache();
    } else if (e instanceof ArcaServiceError) {
      // Error de negocio con codigos de ARCA
      for (const err of e.errors) {
        console.error(`ARCA [${err.code}]: ${err.msg}`);
      }
    } else if (e instanceof ArcaSoapError) {
      // Timeout, HTTP 500, SOAP Fault
      console.error("Error de conexion:", e.message);
      if (e.statusCode) console.error("HTTP status:", e.statusCode);
    } else {
      throw e;
    }
  }
}

main().catch(console.error);
