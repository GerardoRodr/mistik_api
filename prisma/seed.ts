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

  // Catalogo inicial de consolidadoras mayoristas y aerolineas emisoras
  const initialWholesalers = [
    { code: 'COSTAMAR', name: 'Costamar Travel', type: 'WHOLESALER' },
    { code: 'AGIL', name: 'Agil Viajes', type: 'WHOLESALER' },
    { code: 'EUROAMERICAN', name: 'Euroamerican Travel', type: 'WHOLESALER' },
    { code: 'CTM', name: 'CTM Tours', type: 'WHOLESALER' },
    { code: 'LATAM', name: 'LATAM Airlines', type: 'AIRLINE' },
    { code: 'COPA', name: 'Copa Airlines', type: 'AIRLINE' },
    { code: 'AVIANCA', name: 'Avianca', type: 'AIRLINE' },
  ];

  for (const wholesaler of initialWholesalers) {
    await prisma.wholesaler.upsert({
      where: { code: wholesaler.code },
      update: {
        name: wholesaler.name,
        type: wholesaler.type,
        isActive: true,
      },
      create: {
        code: wholesaler.code,
        name: wholesaler.name,
        type: wholesaler.type,
        isActive: true,
      },
    });
  }

  console.log(`Catalogo inicial de consolidadoras registrado exitosamente (${initialWholesalers.length} registros)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
