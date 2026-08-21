import { AssetOptionsResult } from '../../../application/list-asset-options/list-asset-options.use-case';

export class AssetOptionDto {
  symbol: string;
  name: string;
}

export class AssetOptionsResponseDto {
  stocks: AssetOptionDto[];
  cryptos: AssetOptionDto[];

  static fromResult(result: AssetOptionsResult): AssetOptionsResponseDto {
    const dto = new AssetOptionsResponseDto();
    dto.stocks = result.stocks;
    dto.cryptos = result.cryptos;
    return dto;
  }
}
