/**
 * Ejemplo: Consultas de parametros del servicio WSMTXCA
 *
 * Consulta tipos de comprobante, monedas, unidades de medida, cotizacion
 * de monedas, puntos de venta y otros parametros del servicio.
 */

import fs from "fs";
import { ArcaMtxca, CbteTipo, Moneda } from "@ramiidv/arca-mtxca";

async function main() {
  const mtxca = new ArcaMtxca({
    cuit: 20123456789,
    cert: fs.readFileSync("./certs/certificado.crt", "utf-8"),
    key: fs.readFileSync("./certs/clave.key", "utf-8"),
    production: false,
  });

  // Tipos de comprobante disponibles
  const tiposCbte = await mtxca.getTiposComprobante();
  console.log("Tipos de comprobante:");
  for (const tipo of tiposCbte) {
    console.log(`  [${tipo.Id}] ${tipo.Desc}`);
  }

  // Tipos de documento
  const tiposDoc = await mtxca.getTiposDocumento();
  console.log("\nTipos de documento:");
  for (const doc of tiposDoc) {
    console.log(`  [${doc.Id}] ${doc.Desc}`);
  }

  // Monedas disponibles
  const monedas = await mtxca.getMonedas();
  console.log("\nMonedas:");
  for (const m of monedas) {
    console.log(`  [${m.Id}] ${m.Desc}`);
  }

  // Cotizacion del dolar
  const cotizacion = await mtxca.getCotizacionMoneda(Moneda.DOLARES);
  console.log(`\nCotizacion USD: ${cotizacion.cotizacion} (${cotizacion.fechaCotizacion})`);

  // Unidades de medida
  const unidades = await mtxca.getUnidadesMedida();
  console.log("\nUnidades de medida:");
  for (const u of unidades) {
    console.log(`  [${u.Id}] ${u.Desc}`);
  }

  // Alicuotas de IVA
  const alicuotas = await mtxca.getAlicuotasIVA();
  console.log("\nAlicuotas IVA:");
  for (const a of alicuotas) {
    console.log(`  [${a.Id}] ${a.Desc}`);
  }

  // Condiciones de IVA
  const condiciones = await mtxca.getCondicionesIVA();
  console.log("\nCondiciones IVA:");
  for (const c of condiciones) {
    console.log(`  [${c.Id}] ${c.Desc}`);
  }

  // Puntos de venta habilitados
  const ptosVenta = await mtxca.getPuntosVenta();
  console.log("\nPuntos de venta:");
  for (const pv of ptosVenta) {
    console.log(`  PtoVta ${pv.Nro} - Tipo: ${pv.EmisionTipo} - Bloqueado: ${pv.Bloqueado}`);
  }

  // Ultimo comprobante autorizado
  const ultimoNro = await mtxca.ultimoComprobante(1, CbteTipo.FACTURA_B);
  console.log(`\nUltimo Factura B en PtoVta 1: #${ultimoNro}`);
}

main().catch(console.error);
