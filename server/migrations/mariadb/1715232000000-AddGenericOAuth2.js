const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Migration1715232000000 {
  name = "Migration1715232000000";

  async up(queryRunner) {
    await queryRunner.query(
      "CREATE TABLE `GenericOAuth2` (`UserID` int NOT NULL, `LinkedCalendar` tinyint NOT NULL DEFAULT 0, `Sub` varchar(255) NOT NULL, `AccessToken` text NOT NULL, `AccessTokenExpiresAt` int NOT NULL, `RefreshToken` text NOT NULL, UNIQUE INDEX `IDX_genericoauth2_sub` (`Sub`), PRIMARY KEY (`UserID`)) ENGINE=InnoDB",
    );
    await queryRunner.query(
      "ALTER TABLE `GenericOAuth2` ADD CONSTRAINT `FK_genericoauth2_user` FOREIGN KEY (`UserID`) REFERENCES `User`(`ID`) ON DELETE CASCADE ON UPDATE NO ACTION",
    );
  }

  async down(queryRunner) {
    await queryRunner.query("ALTER TABLE `GenericOAuth2` DROP FOREIGN KEY `FK_genericoauth2_user`");
    await queryRunner.query("DROP INDEX `IDX_genericoauth2_sub` ON `GenericOAuth2`");
    await queryRunner.query("DROP TABLE `GenericOAuth2`");
  }
};
