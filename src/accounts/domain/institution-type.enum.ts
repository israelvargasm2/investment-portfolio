/**
 * Definido localmente (mismo criterio que PurchaseAssetType/TrackedAssetType)
 * para que el contexto "accounts" no dependa de otro bounded context.
 */
export enum InstitutionType {
  BANK = 'bank',
  SOFIPO = 'sofipo',
  OTHER = 'other',
}
