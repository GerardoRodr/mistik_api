import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed';

const prisma = new PrismaClient();

// Script para restablecimiento total y re-sembrado de la base de datos
async function resetDatabase() {
  console.log('Iniciando reinicio total de la base de datos PostgreSQL...');

  try {
    // Truncar todas las tablas con reinicio de identidad en cascada
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        "audit_logs",
        "payment_records",
        "appointments",
        "visa_processes",
        "service_tasks",
        "passengers",
        "bookings",
        "wholesalers",
        "customers",
        "users"
      RESTART IDENTITY CASCADE;
    `);

    console.log('Todas las tablas han sido vaciadas correctamente.');

    // Ejecutar sembrado de datos de prueba
    console.log('Ejecutando sembrado inicial de datos de prueba...');
    await seedDatabase();

    console.log('Reinicio y sembrado de base de datos finalizado exitosamente.');
  } catch (error) {
    console.error('Error durante el reinicio de la base de datos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
