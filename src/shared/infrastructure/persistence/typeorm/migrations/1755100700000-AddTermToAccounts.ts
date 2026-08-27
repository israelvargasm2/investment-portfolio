import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega el horizonte de la cuenta (corto/mediano/largo plazo, ver
 * domain/account-term.enum.ts) — puramente informativo, no afecta ningún
 * cálculo de rendimiento. Las cuentas cargadas antes de este cambio no
 * tenían este dato, así que se backfillean a "long" (decisión explícita:
 * mejor un valor concreto y editable después que uno "sin definir").
 */
export class AddTermToAccounts1755100700000 implements MigrationInterface {
  name = 'AddTermToAccounts1755100700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD COLUMN "term" character varying`,
    );
    await queryRunner.query(`UPDATE "accounts" SET "term" = 'long'`);
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "term" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "term"`);
  }
}
