const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Migration1715232000000 {
  name = "Migration1715232000000";

  async up(queryRunner) {
    await queryRunner.query(
      `CREATE TABLE "genericoauth2" ("userid" integer NOT NULL, "linkedcalendar" boolean NOT NULL DEFAULT false, "sub" character varying NOT NULL, "accesstoken" text NOT NULL, "accesstokenexpiresat" integer NOT NULL, "refreshtoken" text NOT NULL, CONSTRAINT "pk_genericoauth2" PRIMARY KEY ("userid"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_genericoauth2_sub" ON "genericoauth2" ("sub") `,
    );
    await queryRunner.query(
      `ALTER TABLE "genericoauth2" ADD CONSTRAINT "fk_genericoauth2_user" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "genericoauth2" DROP CONSTRAINT "fk_genericoauth2_user"`);
    await queryRunner.query(`DROP TABLE "genericoauth2"`);
  }
};
