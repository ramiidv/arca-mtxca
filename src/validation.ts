import { ArcaValidationError } from '@ramiidv/arca-common';
import type { ValidationErrorDetail } from '@ramiidv/arca-common';
import type { AutorizarRequest, MtxcaItem } from './types.js';

/**
 * Validates a single MTXCA item (line-level detail).
 *
 * @throws ArcaValidationError if any field is invalid
 */
export function validateMtxcaItem(item: MtxcaItem, index?: number): void {
  const errors: ValidationErrorDetail[] = [];
  const prefix = index != null ? `items[${index}].` : '';

  if (!item.descripcion) {
    errors.push({
      field: `${prefix}descripcion`,
      message: 'descripcion es requerido',
      value: item.descripcion,
    });
  }

  if (item.cantidad == null || item.cantidad <= 0) {
    errors.push({
      field: `${prefix}cantidad`,
      message: 'cantidad debe ser > 0',
      value: item.cantidad,
    });
  }

  if (item.precioUnitario == null || item.precioUnitario < 0) {
    errors.push({
      field: `${prefix}precioUnitario`,
      message: 'precioUnitario debe ser >= 0',
      value: item.precioUnitario,
    });
  }

  if (item.unidadMedida == null || item.unidadMedida <= 0) {
    errors.push({
      field: `${prefix}unidadMedida`,
      message: 'unidadMedida debe ser > 0',
      value: item.unidadMedida,
    });
  }

  if (errors.length > 0) {
    throw new ArcaValidationError(
      `Validacion de item fallida: ${errors.map((e) => e.message).join('; ')}`,
      errors,
    );
  }
}

/**
 * Validates the full autorizar request (ptoVta, cbteTipo, invoice fields, and items).
 *
 * @throws ArcaValidationError if any field is invalid
 */
export function validateAutorizarRequest(request: AutorizarRequest): void {
  const errors: ValidationErrorDetail[] = [];

  if (request.ptoVta == null || request.ptoVta <= 0) {
    errors.push({
      field: 'ptoVta',
      message: 'ptoVta debe ser > 0',
      value: request.ptoVta,
    });
  }

  if (request.cbteTipo == null || request.cbteTipo <= 0) {
    errors.push({
      field: 'cbteTipo',
      message: 'cbteTipo debe ser > 0',
      value: request.cbteTipo,
    });
  }

  if (!request.invoice) {
    errors.push({
      field: 'invoice',
      message: 'invoice es requerido',
      value: request.invoice,
    });
    // Cannot validate further without invoice
    throw new ArcaValidationError(
      `Validacion de AutorizarRequest fallida: ${errors.map((e) => e.message).join('; ')}`,
      errors,
    );
  }

  const inv = request.invoice;

  if (!inv.cbteFch) {
    errors.push({
      field: 'invoice.cbteFch',
      message: 'cbteFch es requerido',
      value: inv.cbteFch,
    });
  }

  if (inv.importeTotal == null || inv.importeTotal < 0) {
    errors.push({
      field: 'invoice.importeTotal',
      message: 'importeTotal debe ser >= 0',
      value: inv.importeTotal,
    });
  }

  if (!inv.items || inv.items.length === 0) {
    errors.push({
      field: 'invoice.items',
      message: 'items no puede estar vacio',
      value: inv.items,
    });
  } else {
    // Validate each item, collecting errors
    for (let i = 0; i < inv.items.length; i++) {
      try {
        validateMtxcaItem(inv.items[i], i);
      } catch (e) {
        if (e instanceof ArcaValidationError) {
          errors.push(...e.details);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new ArcaValidationError(
      `Validacion de AutorizarRequest fallida: ${errors.map((e) => e.message).join('; ')}`,
      errors,
    );
  }
}
