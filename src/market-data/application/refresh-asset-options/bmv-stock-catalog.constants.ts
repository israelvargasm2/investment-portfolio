import { AssetType } from '../../domain/asset-type.enum';
import { AssetOptionRecord } from '../../domain/ports/asset-option-repository.port';

/**
 * Lista curada a mano de stocks de la Bolsa Mexicana de Valores (BMV),
 * usada por RefreshAssetOptionsUseCase. A diferencia de los stocks de EE.UU.
 * (ver FinnhubStockCatalogAdapter, que trae todo el listado sin tope), acá no
 * hay alternativa dinámica gratuita: el plan gratuito de Finnhub no incluye
 * datos fundamentales de la BMV (por eso RoutedStockPriceAdapter enruta estos
 * símbolos a Yahoo Finance para el precio), así que esta lista se mantiene y
 * expande a mano en el código. Sufijo ".MX" (convención de Yahoo Finance).
 */
export const BMV_STOCK_CATALOG: readonly AssetOptionRecord[] = [
  {
    symbol: 'AMXL.MX',
    name: 'América Móvil, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'WALMEX.MX',
    name: 'Wal-Mart de México, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'FEMSAUBD.MX',
    name: 'Fomento Económico Mexicano, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'GFNORTEO.MX',
    name: 'Grupo Financiero Banorte, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'CEMEXCPO.MX',
    name: 'CEMEX, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'GMEXICOB.MX',
    name: 'Grupo México, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'KIMBERA.MX',
    name: 'Kimberly-Clark de México, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'BIMBOA.MX',
    name: 'Grupo Bimbo, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'ALFAA.MX',
    name: 'Alfa, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'ELEKTRA.MX',
    name: 'Grupo Elektra, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'TLEVISACPO.MX',
    name: 'Grupo Televisa, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'ORBIA.MX',
    name: 'Orbia Advance Corporation, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'GAPB.MX',
    name: 'Grupo Aeroportuario del Pacífico, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'PINFRA.MX',
    name: 'Promotora y Operadora de Infraestructura, S.A.B. de C.V.',
    assetType: AssetType.STOCK,
  },
  {
    symbol: 'IVVPESO.MX',
    name: 'iShares S&P 500 Peso Hedged TRAC',
    assetType: AssetType.STOCK,
  },
];
