import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../auth/infrastructure/http/public.decorator';
import { ListAssetOptionsUseCase } from '../../application/list-asset-options/list-asset-options.use-case';
import { AssetOptionsResponseDto } from './dto/asset-options-response.dto';

/**
 * Adaptador de entrada HTTP: expone la lista de stocks/criptos disponibles
 * para elegir en watchlist/purchases. Público, igual que /assets/prices —
 * el límite global (ver app.module.ts) alcanza acá: es una lectura en
 * memoria/caché ya refrescada por cron, no reenvía a proveedores externos
 * por request.
 */
@Controller('assets')
export class ListAssetOptionsController {
  constructor(private readonly listAssetOptions: ListAssetOptionsUseCase) {}

  @Public()
  @Get('options')
  async list(): Promise<AssetOptionsResponseDto> {
    const result = await this.listAssetOptions.execute();
    return AssetOptionsResponseDto.fromResult(result);
  }
}
