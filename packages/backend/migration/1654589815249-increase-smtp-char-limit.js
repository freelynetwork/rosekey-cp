export class increaseSmtpCharLimit1654589815249 {
    name = 'increaseSmtpCharLimit1654589815249'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "smtpHost" TYPE character varying(256)`);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "smtpUser" TYPE character varying(256)`);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "smtpPass" TYPE character varying(256)`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "smtpHost" TYPE character varying(128)`);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "smtpUser" TYPE character varying(128)`);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "smtpPass" TYPE character varying(128)`);
    }
}
