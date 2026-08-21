import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmDataSourceOptions } from './typeorm-data-source-options';

/**
 * Módulo global de conexión a base de datos. Los módulos de cada bounded context
 * (ej. market-data) registran sus propias entidades y repositorios con
 * `TypeOrmModule.forFeature([...])`, sin depender de este módulo directamente.
 *
 * Para agregar o cambiar de motor: se crea otro `build<Motor>DataSourceOptions`
 * y se reemplaza (o se agrega) aquí; los repository ports del dominio no cambian.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => buildTypeOrmDataSourceOptions(process.env),
    }),
  ],
})
export class DatabaseModule {}
