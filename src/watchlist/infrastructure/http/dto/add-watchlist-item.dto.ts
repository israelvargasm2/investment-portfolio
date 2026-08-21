import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TrackedAssetType } from '../../../domain/tracked-asset-type.enum';

export class AddWatchlistItemDto {
  @IsString()
  @IsNotEmpty()
  assetSymbol: string;

  @IsEnum(TrackedAssetType)
  assetType: TrackedAssetType;
}
