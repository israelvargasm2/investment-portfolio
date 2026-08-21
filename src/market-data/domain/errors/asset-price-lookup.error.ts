import { AssetType } from '../asset-type.enum';

/**
 * Error de dominio lanzado cuando no se puede obtener el precio de un activo puntual.
 * Se captura por activo para permitir respuestas parciales (unos activos resuelven, otros fallan).
 */
export class AssetPriceLookupError extends Error {
  constructor(
    public readonly assetSymbol: string,
    public readonly assetType: AssetType,
    message: string,
    public readonly rateLimited: boolean = false,
  ) {
    super(message);
    this.name = 'AssetPriceLookupError';
  }
}
