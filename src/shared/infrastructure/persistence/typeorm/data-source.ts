import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildTypeOrmDataSourceOptions } from './typeorm-data-source-options';

/**
 * DataSource usado por el CLI de TypeORM (fuera del contexto de Nest) para generar
 * y ejecutar migrations, ej: npm run migration:generate -- src/.../migrations/NombreMigracion
 */
export default new DataSource(buildTypeOrmDataSourceOptions(process.env));
