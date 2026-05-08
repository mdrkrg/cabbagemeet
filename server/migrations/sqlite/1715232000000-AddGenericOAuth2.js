const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Migration1715232000000 {
  name = "Migration1715232000000";

  async up(queryRunner) {
    await queryRunner.query(
      `CREATE TABLE "GenericOAuth2" ("UserID" integer PRIMARY KEY NOT NULL, "LinkedCalendar" boolean NOT NULL DEFAULT (0), "Sub" varchar NOT NULL, "AccessToken" text NOT NULL, "AccessTokenExpiresAt" integer NOT NULL, "RefreshToken" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_genericoauth2_sub" ON "GenericOAuth2" ("Sub") `,
    );
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX "IDX_genericoauth2_sub"`);
    await queryRunner.query(`DROP TABLE "GenericOAuth2"`);
  }
};
