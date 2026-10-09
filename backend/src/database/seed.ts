import * as argon2 from 'argon2';
import { UserRole } from '../common/enums';
import dataSource from './data-source';

// Senha de teste documentada no README. Apenas para avaliação do desafio.
const TEST_PASSWORD = 'Senha@123';

const AREAS = ['Tecnologia da Informação', 'Financeiro', 'Recursos Humanos', 'Jurídico'];

const USERS = [
  { name: 'Ana Solicitante', email: 'solicitante@sicredi.test', role: UserRole.REQUESTER },
  { name: 'Bruno Atendente', email: 'atendente@sicredi.test', role: UserRole.AGENT },
  { name: 'Carla Supervisora', email: 'supervisor@sicredi.test', role: UserRole.SUPERVISOR },
];

async function seed() {
  await dataSource.initialize();
  const hash = await argon2.hash(TEST_PASSWORD);

  for (const name of AREAS) {
    await dataSource.query(`INSERT INTO "areas" ("name") VALUES ($1) ON CONFLICT ("name") DO NOTHING`, [name]);
  }
  for (const u of USERS) {
    await dataSource.query(
      `INSERT INTO "users" ("name", "email", "password_hash", "role") VALUES ($1, $2, $3, $4)
       ON CONFLICT ("email") DO NOTHING`,
      [u.name, u.email, hash, u.role],
    );
  }

  await dataSource.destroy();
  console.log('Seed concluído: áreas e usuários de teste criados (idempotente).');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
