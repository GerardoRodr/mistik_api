import {
  BookingStatus,
  Currency,
  Priority,
  PrismaClient,
  Role,
  ServiceType,
  TaskStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Interfaz para el archivo JSON de datos de prueba
interface SeedData {
  users: Array<{
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  }>;
  wholesalers: Array<{
    code: string;
    name: string;
    type: string;
    ruc?: string;
    contactEmail?: string;
    contactPhone?: string;
  }>;
  customers: Array<{
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
  }>;
  bookings: Array<{
    bookingCode: string;
    customerDocument: string;
    wholesalerCode: string | null;
    serviceType: string;
    status: string;
    totalAmount: number;
    currency: string;
    notes: string;
    createdByUserEmail: string;
  }>;
  passengers: Array<{
    bookingCode: string;
    customerDocument: string | null;
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    pnr: string | null;
    ticketNumber: string | null;
    birthDate: string;
    nationality: string;
  }>;
  visaProcesses: Array<{
    bookingCode: string;
    passengerDocument: string;
    confirmationCode: string;
    consularFeePaid: boolean;
    consularFeeAmount: number;
    currency: string;
    currentStep: string;
    casDaysOffset: number;
    embassyDaysOffset: number;
  }>;
  serviceTasks: Array<{
    title: string;
    description: string;
    status: string;
    priority: string;
    bookingCode: string;
    assignedToUserEmail: string;
    daysDue?: number;
    isCompleted?: boolean;
  }>;
  appointments: Array<{
    title: string;
    location: string;
    status: string;
    daysOffset: number;
    bookingCode: string;
  }>;
  paymentRecords: Array<{
    bookingCode: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    operationNumber: string;
    bankName: string;
    driveReceiptUrl: string;
    isVerified: boolean;
  }>;
}

// Carga del archivo JSON externo de datos de prueba
function loadSeedData(): SeedData {
  const jsonPath = path.join(__dirname, 'seed-data.json');
  const fileContent = fs.readFileSync(jsonPath, 'utf-8');
  return JSON.parse(fileContent) as SeedData;
}

// Funcion principal reutilizable para sembrar datos en todas las tablas
export async function seedDatabase() {
  console.log('Cargando datos de prueba desde prisma/seed-data.json...');
  const data = loadSeedData();

  // 1. Usuarios del sistema con roles RBAC
  const defaultPasswordHash = await bcrypt.hash('Admin2026!', 10);
  const userMap = new Map<string, string>();

  for (const u of data.users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role as Role,
        isActive: u.isActive,
      },
      create: {
        email: u.email,
        password: defaultPasswordHash,
        name: u.name,
        role: u.role as Role,
        isActive: u.isActive,
      },
    });
    userMap.set(user.email, user.id);
  }
  console.log(`Usuarios registrados: ${userMap.size}`);

  // 2. Catalogo de consolidadoras mayoristas y aerolineas
  const wholesalerMap = new Map<string, string>();
  for (const w of data.wholesalers) {
    const item = await prisma.wholesaler.upsert({
      where: { code: w.code },
      update: {
        name: w.name,
        type: w.type,
        ruc: w.ruc || null,
        contactEmail: w.contactEmail || null,
        contactPhone: w.contactPhone || null,
        isActive: true,
      },
      create: {
        code: w.code,
        name: w.name,
        type: w.type,
        ruc: w.ruc || null,
        contactEmail: w.contactEmail || null,
        contactPhone: w.contactPhone || null,
        isActive: true,
      },
    });
    wholesalerMap.set(item.code, item.id);
  }
  console.log(`Consolidadoras registradas: ${wholesalerMap.size}`);

  // 3. Clientes CRM
  const customerMap = new Map<string, string>();
  for (const c of data.customers) {
    const customer = await prisma.customer.upsert({
      where: { documentNumber: c.documentNumber },
      update: {
        documentType: c.documentType,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phoneNumber: c.phoneNumber,
        address: c.address,
      },
      create: {
        documentType: c.documentType,
        documentNumber: c.documentNumber,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phoneNumber: c.phoneNumber,
        address: c.address,
      },
    });
    customerMap.set(customer.documentNumber, customer.id);
  }
  console.log(`Clientes CRM registrados: ${customerMap.size}`);

  // 4. Expedientes y reservas de viaje
  const bookingMap = new Map<string, string>();
  for (const b of data.bookings) {
    const customerId = customerMap.get(b.customerDocument);
    if (!customerId) continue;

    const wholesalerId = b.wholesalerCode ? wholesalerMap.get(b.wholesalerCode) || null : null;
    const createdById = userMap.get(b.createdByUserEmail) || null;

    const booking = await prisma.booking.upsert({
      where: { bookingCode: b.bookingCode },
      update: {
        customerId,
        wholesalerId,
        serviceType: b.serviceType as ServiceType,
        status: b.status as BookingStatus,
        totalAmount: b.totalAmount,
        currency: b.currency as Currency,
        notes: b.notes,
        createdById,
      },
      create: {
        bookingCode: b.bookingCode,
        customerId,
        wholesalerId,
        serviceType: b.serviceType as ServiceType,
        status: b.status as BookingStatus,
        totalAmount: b.totalAmount,
        currency: b.currency as Currency,
        notes: b.notes,
        createdById,
      },
    });
    bookingMap.set(booking.bookingCode, booking.id);
  }
  console.log(`Reservas registradas: ${bookingMap.size}`);

  // 5. Pasajeros individuales asociados
  // Limpiamos pasajeros asociados a estas reservas antes de reinsertar para garantizar consistencia
  const bookingIds = Array.from(bookingMap.values());
  await prisma.passenger.deleteMany({
    where: { bookingId: { in: bookingIds } },
  });

  const passengerMap = new Map<string, string>();
  for (const p of data.passengers) {
    const bookingId = bookingMap.get(p.bookingCode);
    if (!bookingId) continue;

    const customerId = p.customerDocument ? customerMap.get(p.customerDocument) || null : null;

    const passenger = await prisma.passenger.create({
      data: {
        bookingId,
        customerId,
        documentType: p.documentType,
        documentNumber: p.documentNumber,
        firstName: p.firstName,
        lastName: p.lastName,
        pnr: p.pnr,
        ticketNumber: p.ticketNumber,
        birthDate: p.birthDate ? new Date(p.birthDate) : null,
        nationality: p.nationality,
      },
    });
    passengerMap.set(`${p.bookingCode}_${p.documentNumber}`, passenger.id);
  }
  console.log(`Pasajeros registrados: ${passengerMap.size}`);

  // 6. Procesos consulares de visa
  await prisma.appointment.deleteMany({
    where: { task: { bookingId: { in: bookingIds } } },
  });
  await prisma.visaProcess.deleteMany({
    where: { bookingId: { in: bookingIds } },
  });

  const now = new Date();
  const visaProcessMap = new Map<string, string>();

  for (const vp of data.visaProcesses) {
    const bookingId = bookingMap.get(vp.bookingCode);
    const passengerId = passengerMap.get(`${vp.bookingCode}_${vp.passengerDocument}`);
    if (!bookingId) continue;

    const casDate = new Date(now.getTime() + vp.casDaysOffset * 24 * 60 * 60 * 1000);
    const embassyDate = new Date(now.getTime() + vp.embassyDaysOffset * 24 * 60 * 60 * 1000);

    const process = await prisma.visaProcess.create({
      data: {
        bookingId,
        passengerId: passengerId || null,
        confirmationCode: vp.confirmationCode,
        consularFeePaid: vp.consularFeePaid,
        consularFeeAmount: vp.consularFeeAmount,
        currency: vp.currency as Currency,
        currentStep: vp.currentStep,
        casDate,
        embassyDate,
      },
    });
    visaProcessMap.set(vp.bookingCode, process.id);
  }
  console.log(`Procesos consulares registrados: ${visaProcessMap.size}`);

  // 7. Tareas operativas Kanban
  await prisma.serviceTask.deleteMany({
    where: { bookingId: { in: bookingIds } },
  });

  const taskMap = new Map<string, string>();
  for (const t of data.serviceTasks) {
    const bookingId = bookingMap.get(t.bookingCode);
    const assignedToId = userMap.get(t.assignedToUserEmail) || null;

    const dueDate = t.daysDue ? new Date(now.getTime() + t.daysDue * 24 * 60 * 60 * 1000) : null;
    const completedAt = t.isCompleted ? new Date() : null;

    const task = await prisma.serviceTask.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status as TaskStatus,
        priority: t.priority as Priority,
        bookingId: bookingId || null,
        assignedToId,
        dueDate,
        completedAt,
      },
    });
    taskMap.set(t.title, task.id);
  }
  console.log(`Tareas operativas Kanban registradas: ${taskMap.size}`);

  // 8. Citas consulares u operativas
  for (const a of data.appointments) {
    const appointmentDate = new Date(now.getTime() + a.daysOffset * 24 * 60 * 60 * 1000);
    const visaProcessId = visaProcessMap.get(a.bookingCode) || null;

    // Vincula a la tarea de visa si existe
    const taskId = taskMap.get('Revision de formulario DS-160 y preparacion de entrevista') || null;

    await prisma.appointment.create({
      data: {
        title: a.title,
        appointmentDate,
        location: a.location,
        status: a.status,
        reminderSent: false,
        taskId,
        visaProcessId,
      },
    });
  }
  console.log(`Citas consulares registradas: ${data.appointments.length}`);

  // 9. Registro de pagos
  await prisma.paymentRecord.deleteMany({
    where: { bookingId: { in: bookingIds } },
  });

  for (const p of data.paymentRecords) {
    const bookingId = bookingMap.get(p.bookingCode);
    if (!bookingId) continue;

    await prisma.paymentRecord.create({
      data: {
        bookingId,
        amount: p.amount,
        currency: p.currency as Currency,
        paymentMethod: p.paymentMethod,
        operationNumber: p.operationNumber,
        bankName: p.bankName,
        driveReceiptUrl: p.driveReceiptUrl,
        isVerified: p.isVerified,
        paymentDate: new Date(),
      },
    });
  }
  console.log(`Registros de pago creados: ${data.paymentRecords.length}`);

  // 10. Auditoria inicial
  const adminId = userMap.get('admin@mistiktours.com');
  await prisma.auditLog.create({
    data: {
      userId: adminId || null,
      action: 'SYSTEM_SEED',
      entityName: 'DATABASE',
      entityId: 'ALL',
      ipAddress: '127.0.0.1',
      userAgent: 'Prisma Seeder Script (JSON Driven)',
      newValues: {
        status: 'SUCCESS',
        description: 'Datos de prueba integrales cargados desde seed-data.json',
      },
    },
  });
  console.log('Auditoria inicial registrada.');
  console.log('Sembrado integral concluido exitosamente.');
}

async function main() {
  await seedDatabase();
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
