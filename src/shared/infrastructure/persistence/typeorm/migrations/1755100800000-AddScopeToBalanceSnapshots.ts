import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega el alcance de la foto (todas las cuentas / largo+mediano plazo /
 * corto plazo, ver domain/balance-snapshot-scope.enum.ts) — hasta ahora
 * "Guardar total actual" solo guardaba una foto de TODAS las cuentas, así
 * que las fotos existentes se backfillean a "all" (es lo que efectivamente
 * eran).
 */
export class AddScopeToBalanceSnapshots1755100800000 implements MigrationInterface {
  name = 'AddScopeToBalanceSnapshots1755100800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "balance_snapshots" ADD COLUMN "scope" character varying`,
    );
    await queryRunner.query(`UPDATE "balance_snapshots" SET "scope" = 'all'`);
    await queryRunner.query(
      `ALTER TABLE "balance_snapshots" ALTER COLUMN "scope" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "balance_snapshots" DROP COLUMN "scope"`,
    );
  }
}
