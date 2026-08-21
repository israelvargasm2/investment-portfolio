import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

// Sufijo reservado para entidades ORM (distinto de "*.entity.ts", que se usa
// para entidades de dominio puras que no deben registrarse en TypeORM).
const ENTITIES_GLOB = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '**',
  '*.orm-entity{.ts,.js}',
);
const MIGRATIONS_GLOB = join(__dirname, 'migrations', '*{.ts,.js}');

/**
 * Construye las opciones de conexión de TypeORM a partir de variables de entorno.
 * Se reutiliza tanto en el bootstrap de Nest (TypeOrmModule) como en el DataSource
 * del CLI de migrations, para no duplicar la configuración de conexión.
 *
 * Si en el futuro se agrega o cambia el motor de base de datos, este es el único
 * lugar que debería tocarse: el dominio y la aplicación nunca dependen de TypeORM
 * ni de Postgres directamente, solo de los repository ports.
 */
export function buildTypeOrmDataSourceOptions(
  env: NodeJS.ProcessEnv,
): DataSourceOptions {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    ssl: env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    entities: [ENTITIES_GLOB],
    migrations: [MIGRATIONS_GLOB],
    migrationsTableName: 'migrations',
    // Las migrations son la única forma de cambiar el esquema; nunca se sincroniza
    // automáticamente para evitar pérdidas de datos accidentales en Supabase.
    synchronize: false,
    logging: env.DATABASE_LOGGING === 'true',
  };
}
