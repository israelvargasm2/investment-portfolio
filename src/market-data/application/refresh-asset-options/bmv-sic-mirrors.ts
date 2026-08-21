import { AssetOptionRecord } from '../../domain/ports/asset-option-repository.port';

const SIC_SUFFIX = '.MX';

/**
 * La BMV opera un "Sistema Internacional de Cotizaciones" (SIC) donde buena
 * parte del catálogo de EE.UU. cotiza también en pesos con el mismo ticker
 * más el sufijo ".MX" (lo que los brokers mexicanos muestran como "QQQ*",
 * por ejemplo — confirmado contra Yahoo Finance para QQQ.MX y AAPL.MX:
 * exchangeName "MEX", moneda MXN, mismo longName que el original de EE.UU.).
 *
 * No hay una API gratuita que liste específicamente cuáles de esos miles de
 * símbolos de EE.UU. tienen espejo real en el SIC (a diferencia del listado
 * de BMV_STOCK_CATALOG, que sí se cura y verifica símbolo por símbolo porque
 * no hay ningún catálogo de origen confiable detrás). Acá, en cambio, sí hay
 * uno: el propio catálogo de EE.UU. de Finnhub, ya confiable. Se generan los
 * espejos a partir de ese catálogo en vez de intentar verificar cada uno a
 * mano — igual que el resto de esta app, la validación real de si un
 * símbolo puntual tiene precio pasa por assetExistsValidator/
 * /assets/prices al momento de guardar, no por este catálogo de sugerencias:
 * un símbolo sin espejo real en el SIC simplemente no va a encontrar
 * precio, y el usuario lo va a ver marcado como "no encontrado", igual que
 * cualquier símbolo mal tipeado.
 */
export function buildBmvSicMirrors(
  usStocks: readonly AssetOptionRecord[],
): AssetOptionRecord[] {
  return usStocks.map((stock) => ({
    symbol: `${stock.symbol}${SIC_SUFFIX}`,
    name: `${stock.name} (BMV, MXN)`,
    assetType: stock.assetType,
  }));
}
