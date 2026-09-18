import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Script para insertar usuario administrador inicial
async function main() {
  const hashedPassword = await bcrypt.hash('Admin2026!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mistiktours.com' },
    update: {},
    create: {
      email: 'admin@mistiktours.com',
      password: hashedPassword,
      name: 'Administrador Mistik',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(`Usuario administrador inicial configurado: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
