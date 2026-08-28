import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reemplaza el modelo "una fila por scope" (all/long_medium/short, tres
 * POSTs por click de "Guardar total actual") por UN SOLO registro con los
 * tres montos juntos (totalAmount/longMediumTermAmount/shortTermAmount).
 *
 * Esta tabla es de una feature agregada en el mismo lote de cambios que
 * introduce esta migración — no hay datos reales de usuarios en producción
 * todavía, y no hay forma confiable de fusionar tres filas sueltas (de
 * scopes distintos, potencialmente con timestamps levemente distintos) en
 * un solo registro por click, así que se vacía la tabla en vez de intentar
 * reconstruirla.
 */
export class RestructureBalanceSnapshotAmounts1755100900000 implements MigrationInterface {
  name = 'RestructureBalanceSnapshotAmounts1755100900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "balance_snapshots"`);
    await queryRunner.query(
      `ALTER TABLE "balance_snapshots" DROP COLUMN "scope"`,
    );
    await queryRunner.query(
      `ALTER TABLE "balance_snapshots" ADD COLUMN "longMediumTermAmount" double precision NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "balance_snapshots" ADD COLUMN "shortTermAmount" double precision NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "balance_snapshots"`);
    await queryRunner.query(
      `ALTER TABLE "balance_snapshots" DROP COLUMN "longMediumTermAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "balance_snapshots" DROP COLUMN "shortTermAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "balance_snapshots" ADD COLUMN "scope" character varying NOT NULL`,
    );
  }
}
