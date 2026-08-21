import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../auth/infrastructure/http/public.decorator';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

/**
 * Endpoint público para monitoreo/uptime checks (ej. curl manual tras un
 * deploy, o un servicio externo de uptime apuntando acá). No chequea la base
 * de datos ni proveedores externos: solo confirma que el proceso Node está
 * levantado y respondiendo — una falla de Postgres/Finnhub/etc. no debería
 * hacer que esto reporte "caído" y dispare una alerta equivocada.
 */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): HealthResponse {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
