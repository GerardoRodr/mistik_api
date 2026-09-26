# Modulo de Persistencia y Base de Datos (Prisma ORM)

Este documento describe la arquitectura relacional, los modelos de datos en Tercera Forma Normal (3FN) y las instrucciones operativas de base de datos para desarrolladores backend de Mistik Tours & Travel S.A.C.

---

## 1. Descripcion del Modulo de Persistencia

El backend utiliza **Prisma ORM v6** como capa de abstraccion de base de datos sobre un cluster relacional **PostgreSQL** alojado en la infraestructura en la nube de **Supabase**:

- **Archivo de esquema:** `prisma/schema.prisma`
- **Servicio y modulo:** `PrismaService` (`src/prisma/prisma.service.ts`) y `PrismaModule` (`src/prisma/prisma.module.ts`)
- **Alcance de inyeccion:** Modulo marcado como `@Global()`, disponible en todos los modulos de la aplicacion (`AuthModule`, `UsersModule`, `CustomersModule`) sin necesidad de reimportarlo.
- **Ciclo de vida:** Gestiona la conexion inicial en el arranque mediante `onModuleInit` (`$connect()`) y el cierre de conexiones en apagado mediante `onModuleDestroy` (`$disconnect()`).

---

## 2. Enums del Sistema

El esquema define 6 enumeraciones tipadas a nivel de base de datos:

| Enum | Valores Permitidos | Proposito |
| :--- | :--- | :--- |
| `Role` | `ADMIN`, `SUPERVISOR`, `AGENT` | Roles de seguridad RBAC para colaboradores |
| `ServiceType` | `FLIGHT`, `HOTEL`, `PACKAGE`, `VISA`, `INSURANCE`, `TRANSFER`, `TOUR` | Tipos de servicios turisticos ofrecidos |
| `BookingStatus` | `DRAFT`, `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` | Estados del flujo de vida de una reserva |
| `TaskStatus` | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` | Estados de tareas operativas y de seguimiento |
| `Priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` | Prioridad para citas y tareas operativas |
| `Currency` | `USD`, `PEN` | Monedas oficiales soportadas para transacciones |

---

## 3. Catalogo de Entidades y Modelos (3FN)

El modelo relacional esta normalizado en Tercera Forma Normal (3FN), compuesto por 9 entidades principales:

### 3.1. `User` (Tabla: `users`)
Almacena los colaboradores internos que acceden al backend.
- Campos clave: `id` (UUID), `email` (unico), `password` (hash Bcrypt), `name`, `role` (`Role`), `isActive` (boolean), `createdAt`, `updatedAt`.
- Relaciones: Creador de reservas, asignatario de tareas, auditor de eventos.

### 3.2. `Customer` (Tabla: `customers`)
Expediente unificado del cliente para el CRM.
- Campos clave: `id` (UUID), `documentType`, `documentNumber`, `firstName`, `lastName`, `email`, `phoneNumber`, `address`, `createdAt`, `updatedAt`.
- Restriccion unica: `[documentType, documentNumber]`.
- Relaciones 360 grados: `bookings`, `passengers`, `payments`, `serviceTasks`, `visaProcesses`.

### 3.3. `Booking` (Tabla: `bookings`)
Registra las reservas de servicios turisticos contratados.
- Campos clave: `id` (UUID), `code` (unico), `customerId` (FK), `userId` (FK), `serviceType`, `status`, `totalAmount`, `currency`, `travelDate`, `returnDate`, `notes`.
- Relaciones: Vinculada a `Customer`, `User`, `Passenger`, `PaymentRecord` y `ServiceTask`.

### 3.4. `Passenger` (Tabla: `passengers`)
Pasajeros individuales que viajan bajo una reserva especifica.
- Campos clave: `id` (UUID), `bookingId` (FK), `customerId` (FK opcional), `firstName`, `lastName`, `documentType`, `documentNumber`, `birthDate`, `nationality`.

### 3.5. `ServiceTask` (Tabla: `service_tasks`)
Tareas operativas asignadas a colaboradores para atender clientes o reservas.
- Campos clave: `id` (UUID), `title`, `description`, `status` (`TaskStatus`), `priority` (`Priority`), `dueDate`, `assignedToId` (FK User), `customerId` (FK), `bookingId` (FK).

### 3.6. `Appointment` (Tabla: `appointments`)
Citas de atencion comercial o de asesoria consular agendadas.
- Campos clave: `id` (UUID), `customerId` (FK), `userId` (FK), `scheduledAt`, `durationMinutes`, `status`, `notes`.

### 3.7. `VisaProcess` (Tabla: `visa_processes`)
Expedientes de asesoria y tramite de visados consulares.
- Campos clave: `id` (UUID), `customerId` (FK), `country`, `visaType`, `status`, `appointmentDate`, `submissionDate`, `resolutionDate`, `notes`.

### 3.8. `PaymentRecord` (Tabla: `payment_records`)
Registro transaccional de pagos efectuados por clientes hacia sus reservas.
- Campos clave: `id` (UUID), `bookingId` (FK), `customerId` (FK), `amount`, `currency` (`Currency`), `paymentMethod`, `transactionRef`, `status`, `paidAt`.

### 3.9. `AuditLog` (Tabla: `audit_logs`)
Pistas de auditoria inmutables generadas por `AuditLogInterceptor`.
- Campos clave: `id` (UUID), `userId` (FK opcional), `action`, `entityName`, `entityId`, `oldValues` (JSON), `newValues` (JSON), `ipAddress`, `userAgent`, `createdAt`.

---

## 4. Guia de Comandos Operativos

A continuacion se listan los comandos de terminal necesarios para operar y mantener la base de datos:

```bash
# 1. Validar la sintaxis del archivo schema.prisma
npx prisma validate

# 2. Formatear el archivo de esquema
npx prisma format

# 3. Generar el cliente fuertemente tipado de Prisma
npx prisma generate

# 4. Crear y aplicar una nueva migracion SQL en desarrollo
npx prisma migrate dev --name <nombre_descriptivo_de_migracion>

# 5. Ejecutar el sembrado de datos iniciales (Seed con usuarios de prueba)
npm run prisma:seed

# 6. Abrir la interfaz grafica interactiva de navegacion (Prisma Studio)
npx prisma studio
```
