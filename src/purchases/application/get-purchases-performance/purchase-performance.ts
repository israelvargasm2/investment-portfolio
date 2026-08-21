import { Money } from '../../../shared/domain/value-objects/money.vo';
import { Purchase } from '../../domain/entities/purchase.entity';

// Moneda en la que se muestran precios/ganancia en tablas y gráficas, sin
// importar en qué moneda se cargó cada compra (ej. una stock de la BMV
// cargada en MXN). `purchase.purchasePrice` conserva la moneda original tal
// como la tipeó el usuario, para poder editar la compra sin perder ese valor.
export const DISPLAY_CURRENCY = 'USD';

export interface PurchasePerformance {
  purchase: Purchase;
  // Total pagado por toda la compra (purchase.purchasePrice.amount, que ya
  // es un total, no un precio por unidad), convertido a DISPLAY_CURRENCY.
  investedAmountUsd: number;
  currentPrice: Money;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
}

export interface PurchasePerformanceError {
  purchaseId: string;
  assetSymbol: string;
  message: string;
}

export interface GetPurchasesPerformanceResult {
  performances: PurchasePerformance[];
  errors: PurchasePerformanceError[];
}
