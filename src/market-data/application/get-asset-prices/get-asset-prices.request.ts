export interface GetAssetPricesRequest {
  stockSymbols: string[];
  cryptoIds: string[];
  targetCurrency: string;
}
