# MISTIK TOURS - Backend API (CAPSTONE-TUR-2026)

API REST y Gateway WebSockets del Sistema Web SPA para la Gestion de Citas, Tareas Operativas y Expedientes Turisticos, desarrollado para la empresa MISTIK TOURS & TRAVEL S.A.C. en el marco del curso Capstone Project de la Universidad Privada del Norte (UPN).

---

## Ficha Tecnica del Proyecto

- **Codigo Identificador**: CAPSTONE-TUR-2026
- **Empresa Cliente / Sponsor**: MISTIK TOURS & TRAVEL S.A.C. (RUC: 20608945121, Trujillo, La Libertad)
- **Sponsor Ejecutivo**: Gerencia General / Propietario de Mistik Tours & Travel S.A.C.
- **Sponsor Tecnologico**: Supervisor de Operaciones y Tramites Consulares
- **Asesor Academico**: Docente del curso Capstone Project (INVE1535) - UPN
- **Semestre Academico**: Ciclo 2026-2 (16 semanas)
- **Estado de Desarrollo**: Semana 10 (100% Funcionalidad del Software)

---

## Stack Tecnologico Backend

- **Entorno de Ejecucion**: Node.js LTS (v24.x)
- **Framework Backend**: NestJS (arquitectura modular en CommonJS)
- **Capa de Persistencia**: Prisma ORM v6 sobre PostgreSQL (Supabase)
- **Seguridad y Criptografia**: Passport JWT (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`) y Bcrypt
- **Validacion de Entrada**: `class-validator` y `class-transformer` con `ValidationPipe` global
- **Comunicacion en Tiempo Real**: Socket.io (`@nestjs/websockets`, `@nestjs/platform-socket.io`) sobre namespace `/alerts`
- **Automatizacion y Cron Jobs**: `@nestjs/schedule`
- **Inteligencia Artificial y Vision**: SDK oficial `@google/genai` con modelo `gemini-2.5-flash`
- **Documentacion Interactiva**: Swagger / OpenAPI (`@nestjs/swagger`) en `/api/docs`
- **Pruebas Automatizadas**: Jest (34 suites, 195 pruebas unitarias e integracion)
- **Linter y Calidad de Codigo**: Oxlint (analisis estatico de tipos y sintaxis)

---

## Modelo de Datos Relacional en Tercera Forma Normal (3FN)

El esquema de base de datos esta completamente tipado y normalizado en [prisma/schema.prisma](prisma/schema.prisma):

### Enums
- **Role**: `ADMIN`, `SUPERVISOR`, `AGENT`
- **ServiceType**: `FLIGHT`, `VISA`, `PACKAGE`, `OTHER`
- **BookingStatus**: `PENDING`, `CONFIRMED`, `IN_PROCESS`, `COMPLETED`, `CANCELLED`
- **TaskStatus**: `PENDING`, `IN_PROGRESS`, `UNDER_REVIEW`, `DONE`, `CANCELLED`
- **Priority**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **Currency**: `PEN`, `USD`

### Entidades Normalizadas
1. **User** (`users`): Colaboradores de la agencia con roles RBAC y claves hasheadas con Bcrypt.
2. **Customer** (`customers`): Titulares y clientes registrados con documento de identidad unico.
3. **Booking** (`bookings`): Expedientes y reservas de viaje vinculadas a clientes y usuarios creadores.
4. **Passenger** (`passengers`): Pasajeros individuales desacoplados con localizador PNR y numero de boleto.
5. **ServiceTask** (`service_tasks`): Tareas operativas del flujo Kanban con responsable unico obligatorio.
6. **Appointment** (`appointments`): Citas consulares (CAS / Embajada) u operativas multianuales.
7. **VisaProcess** (`visa_processes`): Control de solicitudes de visa DS-160 y registro de arancel consular.
8. **PaymentRecord** (`payment_records`): Control de cobros y pagos con hipervinculos a Google Drive (costo cero).
9. **AuditLog** (`audit_logs`): Registro inmutable de trazabilidad y auditoria de eventos en el sistema.
10. **Wholesaler** (`wholesalers`): Consolidadoras mayoristas y aerolineas emisoras.

---

## Requisitos Previos

- Node.js LTS (version 20.x o superior)
- npm (version 10.x o superior)
- Acceso a una instancia de PostgreSQL (local o proyecto en Supabase)

---

## Instalacion y Configuracion

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd mistik_api
npm install
```

### 2. Configurar variables de entorno

Crear un archivo `.env` en la raiz del proyecto a partir del archivo de ejemplo `.env.example`:

```bash
cp .env.example .env
```

Configurar los parametros en `.env`:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="mistik_jwt_secret_key_2026_capstone_secure"
JWT_EXPIRATION="1h"
CORS_ORIGIN="http://localhost:4200,http://127.0.0.1:4200"

# Inteligencia Artificial (Google Gemini 2.5 Flash)
GEMINI_API_KEY="tu_api_key_de_gemini_aqui"
```

---

## Comandos Operativos de Prisma ORM

- **Validar sintaxis del esquema relacional**:
  ```bash
  npx prisma validate
  ```

- **Generar cliente fuertemente tipado (`@prisma/client`)**:
  ```bash
  npx prisma generate
  ```

- **Ejecutar migraciones en la base de datos**:
  ```bash
  npx prisma migrate dev --name init_db_schema
  ```

- **Aplicar migraciones en produccion**:
  ```bash
  npx prisma migrate deploy
  ```

- **Sembrar datos iniciales (usuario administrador)**:
  ```bash
  npx prisma db seed
  ```
  Crea el usuario `admin@mistiktours.com` con clave hasheada `Admin2026!`.

---

## Comandos de Compilacion, Ejecucion y Pruebas

- **Compilar el proyecto**:
  ```bash
  npm run build
  ```

- **Iniciar en modo desarrollo (hot-reload)**:
  ```bash
  npm run start:dev
  ```

- **Iniciar en modo produccion**:
  ```bash
  npm run start:prod
  ```

- **Ejecutar suite completa de pruebas con Jest**:
  ```bash
  npm test
  ```

- **Ejecutar analisis estatico y linter (Oxlint)**:
  ```bash
  npm run lint
  ```

---

## Documentacion de la API y Guias de Modulos

Ademas de Swagger, el proyecto cuenta con **documentacion tecnica modular para desarrolladores** en la carpeta `docs/`, donde cada modulo cuenta con su propia guia detallada con ejemplos de payloads JSON, respuestas y comandos `curl`:

- **Indice General y Onboarding**: [docs/indice_documentacion.md](docs/indice_documentacion.md)
- **Modulo de Autenticacion**: [docs/modulo_autenticacion.md](docs/modulo_autenticacion.md)
- **Modulo CRM de Clientes**: [docs/modulo_crm_clientes.md](docs/modulo_crm_clientes.md)
- **Modulo de Reservas Aereas**: [docs/modulo_reservas_aereas.md](docs/modulo_reservas_aereas.md)
- **Modulo de Tramites Consulares**: [docs/modulo_tramites_consulares.md](docs/modulo_tramites_consulares.md)
- **Modulo de Auditoria y Seguridad**: [docs/modulo_auditoria_y_seguridad.md](docs/modulo_auditoria_y_seguridad.md)
- **Modulo de Persistencia (Prisma)**: [docs/modulo_persistencia_prisma.md](docs/modulo_persistencia_prisma.md)
- **Modulo de Tablero Kanban**: [docs/modulo_tablero_kanban.md](docs/modulo_tablero_kanban.md)
- **Modulo de Alertas y WebSockets**: [docs/modulo_alertas_y_websockets.md](docs/modulo_alertas_y_websockets.md)
- **Modulo de Inteligencia Artificial**: [docs/modulo_inteligencia_artificial.md](docs/modulo_inteligencia_artificial.md)
- **Modulo de Pagos y Business Intelligence**: [docs/modulo_pagos_y_analitica.md](docs/modulo_pagos_y_analitica.md)

### Documentacion Interactiva OpenAPI (Swagger)

Una vez iniciado el servidor, la documentacion OpenAPI interactiva se encuentra disponible en:

```text
http://localhost:3000/api/docs
```

Para probar endpoints protegidos desde la interfaz de Swagger:
1. Realizar una peticion a `POST /auth/login` con las credenciales corporativas.
2. Copiar el valor de `accessToken` retornado.
3. Presionar el boton **Authorize** en la esquina superior de Swagger UI.
4. Pegar el token en el campo `JWT-auth` y confirmar.

### Catalogo de Endpoints y Servicios Disponibles

| Metodo | Ruta | Descripcion | Autenticacion | Modulo |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/auth/login` | Iniciar sesion con correo y clave, emite token JWT | Publico | AuthModule |
| `GET` | `/auth/profile` | Consultar perfil del usuario autenticado en sesion | Bearer JWT | AuthModule |
| `GET` | `/api/v1/customers` | Busqueda paginada y filtrado de expedientes (< 5s) | Bearer JWT | CustomersModule |
| `GET` | `/api/v1/customers/:id` | Detalle del expediente 360 del cliente y su historial | Bearer JWT | CustomersModule |
| `POST` | `/api/v1/customers` | Registro de cliente con validacion DTO estricta | Bearer JWT | CustomersModule |
| `PATCH` | `/api/v1/customers/:id` | Actualizacion parcial de datos del expediente | Bearer JWT | CustomersModule |
| `GET` | `/api/v1/bookings` | Consulta y filtro de reservas y vuelos con indices | Bearer JWT | BookingsModule |
| `GET` | `/api/v1/bookings/:id` | Detalle consolidado de expediente de reserva | Bearer JWT | BookingsModule |
| `POST` | `/api/v1/bookings` | Registra nueva reserva con pasajeros asociados | Bearer JWT | BookingsModule |
| `GET` | `/api/v1/bookings/:id/transitions` | Consulta transiciones validas en maquina de estados | Bearer JWT | BookingsModule |
| `POST` | `/api/v1/bookings/:id/transition` | Ejecuta cambio de estado validado en maquina de estados | Bearer JWT | BookingsModule |
| `GET` | `/api/v1/bookings/:idOrPnr/passengers` | Consulta pasajeros por ID de reserva o PNR | Bearer JWT | BookingsModule |
| `POST` | `/api/v1/bookings/:id/payments` | Registra comprobante de pago con URL a Google Drive | Bearer JWT | PaymentsModule |
| `GET` | `/api/v1/bookings/:id/balance` | Retorna calculo reactivo de saldos deudores | Bearer JWT | PaymentsModule |
| `POST` | `/api/v1/visa-processes` | Registra nuevo expediente consular DS-160 | Bearer JWT | VisaProcessesModule |
| `GET` | `/api/v1/visa-processes` | Listado paginado de tramites consulares con filtros | Bearer JWT | VisaProcessesModule |
| `GET` | `/api/v1/visa-processes/:id` | Consulta expediente consular con citas y linea de tiempo | Bearer JWT | VisaProcessesModule |
| `PATCH` | `/api/v1/visa-processes/:id/status` | Avanza fase consular en la maquina de estados | Bearer JWT | VisaProcessesModule |
| `POST` | `/api/v1/visa-processes/:id/appointments` | Registra cita consular y arancel MRV ($185 USD) | Bearer JWT | VisaProcessesModule |
| `GET` | `/api/v1/visa-processes/appointments/multiannual` | Consulta indexada de citas futuras 2026-2027 | Bearer JWT | VisaProcessesModule |
| `GET` | `/api/v1/wholesalers` | Catalogo de consolidadoras mayoristas y aerolineas | Bearer JWT | WholesalersModule |
| `GET` | `/api/v1/wholesalers/:id` | Detalle individual de consolidadora por ID unico | Bearer JWT | WholesalersModule |
| `PATCH` | `/api/v1/tasks/:id/assign` | Asigna colaborador responsable unico a la tarea | Bearer JWT | TasksModule |
| `PATCH` | `/api/v1/tasks/:id/status` | Transiciona estado de tarjeta Kanban con movedAt y WS | Bearer JWT | TasksModule |
| `GET` | `/api/v1/tasks` | Listado de tareas con filtros y agrupacion Kanban | Bearer JWT | TasksModule |
| `GET` | `/api/v1/tasks/:id` | Detalle completo de tarea y siguientes columnas | Bearer JWT | TasksModule |
| `POST` | `/api/v1/tasks` | Registra nueva tarea operativa en estado BACKLOG | Bearer JWT | TasksModule |
| `POST` | `/api/v1/ai/parse-itinerary` | Extraccion NLP estructurada de correos con Gemini | Bearer JWT | AiModule |
| `POST` | `/api/v1/ai/ocr-passport` | Lectura OCR y alerta preventiva de vigencia < 6 meses | Bearer JWT | AiModule |
| `GET` | `/api/v1/analytics/financial-summary` | Resumen financiero de ingresos devengados vs cobrados | Bearer JWT | AnalyticsModule |
| `GET` | `/api/v1/analytics/visa-conversion` | Embudo de conversion de expedientes consulares | Bearer JWT | AnalyticsModule |
| `GET` | `/api/v1/analytics/kanban-bottlenecks` | Diagnostico de limites WIP y cuellos de botella | Bearer JWT | AnalyticsModule |
| `WS` | `/alerts` | Gateway WebSockets Socket.io (`checkin`, `visa`, `task`) | Publico / Bearer | AlertsModule |

---

## Estructura del Codigo Fuente (`src/`)

```text
src/
├── app.controller.spec.ts   # Pruebas unitarias del controlador base
├── app.controller.ts        # Controlador base de comprobacion de salud
├── app.module.ts            # Modulo principal del backend
├── app.service.ts           # Servicio base de la aplicacion
├── main.ts                  # Punto de entrada, ValidationPipe, dotenv y Swagger
├── ai/                      # Modulo de Inteligencia Artificial (Gemini 2.5 Flash)
│   ├── ai.controller.ts     # Endpoints /api/v1/ai/parse-itinerary y /ocr-passport
│   ├── ai.module.ts
│   ├── dto/                 # DTOs de itinerario e imagen base64
│   ├── gemini.service.spec.ts
│   ├── gemini.service.ts    # Integracion @google/genai con modo fallback
│   ├── passport-ocr.service.ts # Orquestador OCR de pasaportes
│   ├── passport-validator.service.spec.ts
│   └── passport-validator.service.ts # Algoritmo de vigencia < 6 meses
├── alerts/                  # Modulo de Alertas Operativas y WebSockets
│   ├── alerts.cron.ts       # Cron Jobs @Cron (check-ins 24-48h y citas consulares)
│   ├── alerts.gateway.spec.ts
│   ├── alerts.gateway.ts    # Gateway Socket.io en namespace /alerts
│   ├── alerts.module.ts     # Modulo exportador de ScheduleModule y Gateway
│   ├── alerts.service.spec.ts
│   └── alerts.service.ts    # Logica de deteccion y emision de eventos
├── analytics/               # Modulo de Business Intelligence y Analitica
│   ├── analytics.controller.ts # Endpoints /api/v1/analytics/*
│   ├── analytics.module.ts
│   ├── analytics.service.spec.ts
│   └── analytics.service.ts # Resumen financiero, embudo visa y limites WIP
├── auth/                    # Modulo de seguridad y autenticacion
│   ├── auth.controller.ts   # Endpoints /auth/login y /auth/profile
│   ├── auth.module.ts
│   ├── auth.service.ts      # Validacion bcrypt y emision de tokens JWT
│   ├── guards/              # JwtAuthGuard y RolesGuard
│   └── strategies/          # Estrategia JwtStrategy
├── bookings/                # Modulo transaccional de reservas y vuelos
│   ├── bookings.controller.ts
│   ├── bookings.module.ts
│   ├── bookings.service.ts  # Maquina de estados de reservas y PNR
│   └── state-machine/       # Invariantes y transiciones de vuelo
├── common/                  # Componentes transversales
│   ├── filters/             # HttpExceptionFilter global
│   └── interceptors/        # AuditLogInterceptor (Ley 29733)
├── customers/               # Modulo CRM de expedientes de clientes
│   ├── customers.controller.ts
│   ├── customers.module.ts
│   └── customers.service.ts # Logica de busqueda rapida indexada (< 5s)
├── payments/                # Modulo de gestion de pagos y comprobantes
│   ├── dto/                 # CreatePaymentDto con regex Google Drive
│   ├── payments.controller.ts # Endpoints /api/v1/bookings/:id/payments y /balance
│   ├── payments.module.ts
│   ├── payments.service.spec.ts
│   └── payments.service.ts  # Calculador reactivo de saldo (PAID/PARTIAL/UNPAID)
├── prisma/                  # Capa de persistencia relacional
│   ├── prisma.module.ts
│   └── prisma.service.ts    # Conexion a Supabase PostgreSQL
├── tasks/                   # Modulo de control de tareas y tablero Kanban
│   ├── dto/                 # AssignTaskDto, CreateTaskDto, TransitionDto
│   ├── task-state.service.ts # Normalizador de estados y columnas Kanban
│   ├── tasks.controller.ts  # Endpoints /api/v1/tasks (incluye :id/assign)
│   ├── tasks.module.ts
│   ├── tasks.service.spec.ts
│   └── tasks.service.ts     # Asignacion exclusiva y emision WebSockets
├── users/                   # Modulo de administracion de usuarios
│   ├── users.module.ts
│   └── users.service.ts
├── visa-processes/          # Modulo de tramites consulares DS-160
│   ├── visa-processes.controller.ts
│   ├── visa-processes.module.ts
│   ├── visa-processes.service.ts # Fases, arancel MRV y citas multianuales
│   └── state-machine/       # Maquina de estados consulares
└── wholesalers/             # Catalogo de consolidadoras y aerolineas
    ├── wholesalers.controller.ts
    ├── wholesalers.module.ts
    └── wholesalers.service.ts
```

---

## Equipo del Proyecto y Matriz de Roles (UPN)

| Integrante | Codigo UPN | Rol en el Proyecto | Responsabilidades Principales |
| :--- | :---: | :--- | :--- |
| **Rodriguez Monzon, Gerardo Manuel** | `N00451719` | Lider de Proyecto / Product Owner & Gestor de Flujo | Alcance tecnico, gestion de politicas Kanban y comunicacion con Sponsor y UPN. |
| **Garcia Lujan, Laura Thalia** | `N00269668` | Analista de Requerimientos & Disenadora UI/UX | Especificacion SRS, prototipado interactivo en Figma y Design System. |
| **Llaccolla Gamboa, Katherine Lisbeth** | `N00287214` | Desarrolladora Frontend SPA (Angular 22) | Arquitectura SPA con Standalone Components, Signals y tablero Drag & Drop. |
| **Portales Villa, Abrhyl Kimberly** | `N00316147` | Desarrolladora Backend & Arquitectura de BD | Normalizacion relacional 3FN, esquema Prisma ORM, APIs RESTful y seguridad JWT. |
| **Oliva Ulloa, Ana Cecilia** | `N00293453` | Analista de Calidad de Software (QA / SQA) & Seguridad | Pruebas unitarias/integracion con Jest, auditoria de seguridad (Ley 29733) y UAT. |

---

## Licencia

Este proyecto esta bajo licencia privada institucional para MISTIK TOURS & TRAVEL S.A.C. y la Universidad Privada del Norte.
