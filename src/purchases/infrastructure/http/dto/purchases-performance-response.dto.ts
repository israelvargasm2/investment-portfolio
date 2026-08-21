import {
  DISPLAY_CURRENCY,
  GetPurchasesPerformanceResult,
} from '../../../application/get-purchases-performance/purchase-performance';
import { PurchaseAssetType } from '../../../domain/purchase-asset-type.enum';

export class PurchasePerformanceItemDto {
  id: string;
  assetSymbol: string;
  assetType: PurchaseAssetType;
  quantity: number;
  // Total pagado por toda la compra (no un precio por unidad), en USD.
  purchasePriceAmount: number;
  currency: string;
  // Moneda/monto tal como los cargó el usuario (ej. una stock de la BMV en
  // MXN): purchasePriceAmount/currency de arriba siempre están en USD para
  // que tablas y gráficas comparen todo en la misma moneda; estos dos campos
  // son los que el formulario de edición usa para no perder el valor original.
  originalPurchasePriceAmount: number;
  originalCurrency: string;
  purchasedAt: string;
  currentPrice: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
}

export class PurchasePerformanceErrorDto {
  purchaseId: string;
  assetSymbol: string;
  message: string;
}

export class PurchasesPerformanceResponseDto {
  purchases: PurchasePerformanceItemDto[];
  errors: PurchasePerformanceErrorDto[];

  static fromResult(
    result: GetPurchasesPerformanceResult,
  ): PurchasesPerformanceResponseDto {
    const dto = new PurchasesPerformanceResponseDto();
    dto.purchases = result.performances.map((performance) => ({
      id: performance.purchase.id,
      assetSymbol: performance.purchase.assetSymbol,
      assetType: performance.purchase.assetType,
      quantity: performance.purchase.quantity,
      purchasePriceAmount: performance.investedAmountUsd,
      currency: DISPLAY_CURRENCY,
      originalPurchasePriceAmount: performance.purchase.purchasePrice.amount,
      originalCurrency: performance.purchase.purchasePrice.currency,
      purchasedAt: performance.purchase.purchasedAt.toISOString(),
      currentPrice: performance.currentPrice.amount,
      currentValue: performance.currentValue,
      gainLoss: performance.gainLoss,
      gainLossPercentage: performance.gainLossPercentage,
    }));
    dto.errors = result.errors.map((error) => ({
      purchaseId: error.purchaseId,
      assetSymbol: error.assetSymbol,
      message: error.message,
    }));
    return dto;
  }
}
