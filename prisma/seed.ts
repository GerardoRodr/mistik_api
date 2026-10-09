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

const prisma = new PrismaClient();

// Funcion principal reutilizable para sembrar datos en todas las tablas
export async function seedDatabase() {
  console.log('Sembrando datos en base de datos...');

  // 1. Usuarios del sistema con roles RBAC
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

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@mistiktours.com' },
    update: {},
    create: {
      email: 'supervisor@mistiktours.com',
      password: hashedPassword,
      name: 'Rosa Palacios (Supervisor)',
      role: Role.SUPERVISOR,
      isActive: true,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'asesor@mistiktours.com' },
    update: {},
    create: {
      email: 'asesor@mistiktours.com',
      password: hashedPassword,
      name: 'Mario Vargas (Asesor)',
      role: Role.AGENT,
      isActive: true,
    },
  });

  console.log('Usuarios del sistema configurados (3 colaboradores).');

  // 2. Catalogo de consolidadoras mayoristas y aerolineas
  const initialWholesalers = [
    { code: 'COSTAMAR', name: 'Costamar Travel', type: 'WHOLESALER' },
    { code: 'AGIL', name: 'Agil Viajes', type: 'WHOLESALER' },
    { code: 'EUROAMERICAN', name: 'Euroamerican Travel', type: 'WHOLESALER' },
    { code: 'CTM', name: 'CTM Tours', type: 'WHOLESALER' },
    { code: 'LATAM', name: 'LATAM Airlines', type: 'AIRLINE' },
    { code: 'COPA', name: 'Copa Airlines', type: 'AIRLINE' },
    { code: 'AVIANCA', name: 'Avianca', type: 'AIRLINE' },
  ];

  const wholesalerMap = new Map<string, string>();
  for (const w of initialWholesalers) {
    const item = await prisma.wholesaler.upsert({
      where: { code: w.code },
      update: {
        name: w.name,
        type: w.type,
        isActive: true,
      },
      create: {
        code: w.code,
        name: w.name,
        type: w.type,
        isActive: true,
      },
    });
    wholesalerMap.set(item.code, item.id);
  }

  console.log(`Consolidadoras registradas (${initialWholesalers.length} registros).`);

  // 3. Clientes CRM
  const customer1 = await prisma.customer.upsert({
    where: { documentNumber: '74859612' },
    update: {},
    create: {
      documentType: 'DNI',
      documentNumber: '74859612',
      firstName: 'Lucia',
      lastName: 'Mendez',
      email: 'lucia.mendez@gmail.com',
      phoneNumber: '+51987654321',
      address: 'Av. Larco 456, Trujillo',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { documentNumber: '70112233' },
    update: {},
    create: {
      documentType: 'DNI',
      documentNumber: '70112233',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos.mendoza@hotmail.com',
      phoneNumber: '+51976543210',
      address: 'Jr. Pizarro 789, Trujillo',
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { documentNumber: 'P01234567' },
    update: {},
    create: {
      documentType: 'PASAPORTE',
      documentNumber: 'P01234567',
      firstName: 'Sofia',
      lastName: 'Flores',
      email: 'sofia.flores@yahoo.com',
      phoneNumber: '+51965432109',
      address: 'Calle Los Cedros 123, Lima',
    },
  });

  console.log('Clientes CRM configurados (3 clientes).');

  // 4. Expedientes y reservas de viaje
  const booking1 = await prisma.booking.upsert({
    where: { bookingCode: 'RES-2026-001' },
    update: {},
    create: {
      bookingCode: 'RES-2026-001',
      customerId: customer1.id,
      wholesalerId: wholesalerMap.get('LATAM'),
      serviceType: ServiceType.FLIGHT,
      status: BookingStatus.CONFIRMED,
      totalAmount: 650.0,
      currency: Currency.USD,
      notes: 'Vuelo directo Trujillo - Lima ida y vuelta confirmado',
      createdById: agent.id,
    },
  });

  const booking2 = await prisma.booking.upsert({
    where: { bookingCode: 'RES-2026-002' },
    update: {},
    create: {
      bookingCode: 'RES-2026-002',
      customerId: customer2.id,
      wholesalerId: wholesalerMap.get('COSTAMAR'),
      serviceType: ServiceType.PACKAGE,
      status: BookingStatus.IN_PROCESS,
      totalAmount: 1850.0,
      currency: Currency.USD,
      notes: 'Paquete turistico Cusco Imperial 4D3N todo incluido',
      createdById: supervisor.id,
    },
  });

  const booking3 = await prisma.booking.upsert({
    where: { bookingCode: 'RES-2026-003' },
    update: {},
    create: {
      bookingCode: 'RES-2026-003',
      customerId: customer3.id,
      serviceType: ServiceType.VISA,
      status: BookingStatus.IN_PROCESS,
      totalAmount: 350.0,
      currency: Currency.USD,
      notes: 'Asesoria consular para visa americana B1/B2',
      createdById: agent.id,
    },
  });

  const booking4 = await prisma.booking.upsert({
    where: { bookingCode: 'RES-2026-004' },
    update: {},
    create: {
      bookingCode: 'RES-2026-004',
      customerId: customer1.id,
      wholesalerId: wholesalerMap.get('COPA'),
      serviceType: ServiceType.FLIGHT,
      status: BookingStatus.PENDING,
      totalAmount: 420.0,
      currency: Currency.USD,
      notes: 'Cotizacion preliminar de vuelo Lima - Panama',
      createdById: agent.id,
    },
  });

  console.log('Reservas configuradas (4 expedientes).');

  // 5. Pasajeros individuales asociados
  // Limpiamos pasajeros previos asociados a estas reservas para garantizar idempotencia en desarrollo
  await prisma.passenger.deleteMany({
    where: {
      bookingId: {
        in: [booking1.id, booking2.id, booking3.id, booking4.id],
      },
    },
  });

  const passenger1 = await prisma.passenger.create({
    data: {
      bookingId: booking1.id,
      customerId: customer1.id,
      documentType: customer1.documentType,
      documentNumber: customer1.documentNumber,
      firstName: customer1.firstName,
      lastName: customer1.lastName,
      pnr: 'LIM456',
      ticketNumber: '045-1234567890',
      birthDate: new Date('1995-05-15'),
      nationality: 'Peruana',
    },
  });

  await prisma.passenger.create({
    data: {
      bookingId: booking2.id,
      customerId: customer2.id,
      documentType: customer2.documentType,
      documentNumber: customer2.documentNumber,
      firstName: customer2.firstName,
      lastName: customer2.lastName,
      pnr: 'CUZ789',
      ticketNumber: '045-2345678901',
      birthDate: new Date('1988-11-20'),
      nationality: 'Peruana',
    },
  });

  await prisma.passenger.create({
    data: {
      bookingId: booking2.id,
      documentType: 'DNI',
      documentNumber: '70998877',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      pnr: 'CUZ789',
      ticketNumber: '045-2345678902',
      birthDate: new Date('1990-03-10'),
      nationality: 'Peruana',
    },
  });

  const passengerSofia = await prisma.passenger.create({
    data: {
      bookingId: booking3.id,
      customerId: customer3.id,
      documentType: customer3.documentType,
      documentNumber: customer3.documentNumber,
      firstName: customer3.firstName,
      lastName: customer3.lastName,
      birthDate: new Date('1992-08-25'),
      nationality: 'Peruana',
    },
  });

  console.log('Pasajeros configurados (4 pasajeros).');

  // 6. Proceso Consular de Visa
  // Borramos procesos y citas previas vinculadas para evitar duplicados en re-ejecucion
  await prisma.appointment.deleteMany({
    where: {
      task: { bookingId: { in: [booking1.id, booking2.id, booking3.id] } },
    },
  });
  await prisma.visaProcess.deleteMany({
    where: { bookingId: booking3.id },
  });

  const now = new Date();
  const casDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const embassyDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

  const visaProcess = await prisma.visaProcess.create({
    data: {
      bookingId: booking3.id,
      passengerId: passengerSofia.id,
      confirmationCode: 'AA00B9C8D7',
      consularFeePaid: true,
      consularFeeAmount: 185.0,
      currency: Currency.USD,
      currentStep: 'CONSULAR_APPOINTMENT',
      casDate,
      embassyDate,
    },
  });

  console.log('Proceso de visa configurado (1 expediente consular).');

  // 7. Tareas operativas Kanban
  await prisma.serviceTask.deleteMany({
    where: {
      bookingId: { in: [booking1.id, booking2.id, booking3.id, booking4.id] },
    },
  });

  const task1 = await prisma.serviceTask.create({
    data: {
      title: 'Emision de boletos aereos Lima - Trujillo',
      description: 'Emitir boletos en GDS Latam y enviar correo con confirmacion',
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      bookingId: booking1.id,
      assignedToId: agent.id,
      completedAt: new Date(),
    },
  });

  const task2 = await prisma.serviceTask.create({
    data: {
      title: 'Confirmacion de vouchers de hotel en Cusco',
      description: 'Coordinar con operador Costamar los traslados y hotel Monasterio',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.URGENT,
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      bookingId: booking2.id,
      assignedToId: supervisor.id,
    },
  });

  const task3 = await prisma.serviceTask.create({
    data: {
      title: 'Revision de formulario DS-160 y preparacion de entrevista',
      description: 'Validar confirmacion DS-160 y agendar simulacro de entrevista',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      bookingId: booking3.id,
      assignedToId: agent.id,
    },
  });

  await prisma.serviceTask.create({
    data: {
      title: 'Seguimiento de cotizacion pendiente Copa Airlines',
      description: 'Consultar si el cliente autoriza la emision de vuelos a Panama',
      status: TaskStatus.PENDING,
      priority: Priority.MEDIUM,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      bookingId: booking4.id,
      assignedToId: agent.id,
    },
  });

  console.log('Tareas operativas Kanban configuradas (4 tareas).');

  // 8. Citas Consulares u Operativas
  await prisma.appointment.create({
    data: {
      title: 'Cita CAS Huancavelica - Toma de biometricos',
      appointmentDate: casDate,
      location: 'Centro de Atencion CAS Lima, Av. Primavera 120, Miraflores',
      status: 'SCHEDULED',
      reminderSent: false,
      taskId: task3.id,
      visaProcessId: visaProcess.id,
    },
  });

  await prisma.appointment.create({
    data: {
      title: 'Entrevista Consular Embajada de Estados Unidos',
      appointmentDate: embassyDate,
      location: 'Embajada de EE.UU., Av. La Encalada cdra 17, Surco, Lima',
      status: 'SCHEDULED',
      reminderSent: false,
      taskId: task3.id,
      visaProcessId: visaProcess.id,
    },
  });

  console.log('Citas consulares configuradas (2 citas programadas).');

  // 9. Registro de Pagos
  await prisma.paymentRecord.deleteMany({
    where: {
      bookingId: { in: [booking1.id, booking2.id, booking3.id, booking4.id] },
    },
  });

  await prisma.paymentRecord.create({
    data: {
      bookingId: booking1.id,
      amount: 650.0,
      currency: Currency.USD,
      paymentMethod: 'TRANSFERENCIA_BANCARIA',
      operationNumber: 'OP-98765432',
      bankName: 'BCP',
      driveReceiptUrl:
        'https://drive.google.com/file/d/1a2b3c4d5e_comprobante_bcp_001/view',
      isVerified: true,
      paymentDate: new Date(),
    },
  });

  await prisma.paymentRecord.create({
    data: {
      bookingId: booking2.id,
      amount: 1000.0,
      currency: Currency.USD,
      paymentMethod: 'TARJETA_CREDITO',
      operationNumber: 'OP-45678912',
      bankName: 'BBVA',
      driveReceiptUrl:
        'https://drive.google.com/file/d/2b3c4d5e6f_comprobante_bbva_002/view',
      isVerified: true,
      paymentDate: new Date(),
    },
  });

  await prisma.paymentRecord.create({
    data: {
      bookingId: booking3.id,
      amount: 350.0,
      currency: Currency.USD,
      paymentMethod: 'YAPE',
      operationNumber: 'OP-12345678',
      bankName: 'BCP',
      driveReceiptUrl:
        'https://drive.google.com/file/d/3c4d5e6f7g_comprobante_yape_003/view',
      isVerified: true,
      paymentDate: new Date(),
    },
  });

  console.log('Registros de pagos configurados (3 transacciones).');

  // 10. Auditoria inicial
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_SEED',
      entityName: 'DATABASE',
      entityId: 'ALL',
      ipAddress: '127.0.0.1',
      userAgent: 'Prisma Seeder Script',
      newValues: {
        status: 'SUCCESS',
        description: 'Datos de prueba integrales sembrados exitosamente',
      },
    },
  });

  console.log('Registro de auditoria inicial registrado.');
  console.log('Sembrado integral completado con exito.');
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
