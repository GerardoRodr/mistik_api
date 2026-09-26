# MISTIK TOURS - Backend API (CAPSTONE-TUR-2026)

API REST del Sistema Web SPA para la Gestion de Citas, Tareas Operativas y Expedientes Turisticos, desarrollado para la empresa MISTIK TOURS & TRAVEL S.A.C. en el marco del curso Capstone Project de la Universidad Privada del Norte (UPN).

---

## Ficha Tecnica del Proyecto

- **Codigo Identificador**: CAPSTONE-TUR-2026
- **Empresa Cliente / Sponsor**: MISTIK TOURS & TRAVEL S.A.C. (RUC: 20608945121, Trujillo, La Libertad)
- **Sponsor Ejecutivo**: Gerencia General / Propietario de Mistik Tours & Travel S.A.C.
- **Sponsor Tecnologico**: Supervisor de Operaciones y Tramites Consulares
- **Asesor Academico**: Docente del curso Capstone Project (INVE1535) - UPN
- **Semestre Academico**: Ciclo 2026-2 (16 semanas)

---

## Stack Tecnologico Backend

- **Entorno de Ejecucion**: Node.js LTS (v24.x)
- **Framework Backend**: NestJS (arquitectura modular en CommonJS)
- **Capa de Persistencia**: Prisma ORM v6 sobre PostgreSQL (Supabase)
- **Seguridad y Criptografia**: Passport JWT (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`) y Bcrypt
- **Validacion de Entrada**: `class-validator` y `class-transformer` con `ValidationPipe` global
- **Documentacion Interactiva**: Swagger / OpenAPI (`@nestjs/swagger`) en `/api/docs`
- **Pruebas Automatizadas**: Jest (pruebas unitarias y funcionales)
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

- **Ejecutar suite de pruebas con Jest**:
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
- **Modulo de Auditoria y Seguridad**: [docs/modulo_auditoria_y_seguridad.md](docs/modulo_auditoria_y_seguridad.md)
- **Modulo de Persistencia (Prisma)**: [docs/modulo_persistencia_prisma.md](docs/modulo_persistencia_prisma.md)

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

### Catalogo de Endpoints Disponibles

| Metodo | Ruta | Descripcion | Autenticacion | Modulo |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/auth/login` | Iniciar sesion con correo y clave, emite token JWT | Publico | AuthModule |
| `GET` | `/auth/profile` | Consultar perfil del usuario autenticado en sesion | Bearer JWT | AuthModule |
| `GET` | `/api/v1/customers` | Busqueda paginada y filtrado de expedientes (< 5s) | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | CustomersModule |
| `GET` | `/api/v1/customers/:id` | Detalle del expediente 360 del cliente y su historial | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | CustomersModule |
| `POST` | `/api/v1/customers` | Registro de cliente con validacion DTO estricta | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | CustomersModule |
| `PATCH` | `/api/v1/customers/:id` | Actualizacion parcial de datos del expediente | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | CustomersModule |

---

## Estructura del Codigo Fuente (`src/`)

```text
src/
├── app.controller.spec.ts   # Pruebas unitarias del controlador base
├── app.controller.ts        # Controlador base de comprobacion de salud
├── app.module.ts            # Modulo principal del backend
├── app.service.ts           # Servicio base de la aplicacion
├── main.ts                  # Punto de entrada, ValidationPipe y Swagger
├── auth/                    # Modulo de seguridad y autenticacion
│   ├── auth.controller.spec.ts
│   ├── auth.controller.ts   # Endpoints /auth/login y /auth/profile
│   ├── auth.module.ts       # Registro de JwtModule y PassportModule
│   ├── auth.service.spec.ts
│   ├── auth.service.ts      # Validacion bcrypt y emision de tokens
│   ├── auth-verification.spec.ts # Pruebas funcionales de seguridad
│   ├── decorators/
│   │   ├── current-user.decorator.ts # Inyeccion de req.user
│   │   └── roles.decorator.ts        # Decorador @Roles para RBAC
│   ├── dto/
│   │   └── login.dto.ts     # DTO validado con class-validator
│   ├── guards/
│   │   ├── jwt-auth.guard.spec.ts
│   │   ├── jwt-auth.guard.ts # Guard protector basado en JWT
│   │   ├── roles.guard.spec.ts
│   │   └── roles.guard.ts    # Guard RBAC para control por roles
│   └── strategies/
│       ├── jwt.strategy.spec.ts
│       └── jwt.strategy.ts  # Estrategia de extraccion Bearer de Passport
├── common/                  # Componentes transversales
│   ├── filters/
│   │   ├── http-exception.filter.spec.ts
│   │   └── http-exception.filter.ts # Filtro global de respuestas de error
│   └── interceptors/
│       ├── audit-log.interceptor.spec.ts
│       └── audit-log.interceptor.ts # Interceptor inmutable (Ley 29733)
├── customers/               # Modulo CRM de expedientes de clientes
│   ├── customers.controller.spec.ts
│   ├── customers.controller.ts   # Endpoints CRUD /api/v1/customers
│   ├── customers.integration.spec.ts # Pruebas integrales con Supertest
│   ├── customers.module.ts
│   ├── customers.service.spec.ts
│   ├── customers.service.ts      # Logica transaccional y busqueda < 5s
│   └── dto/
│       ├── create-customer.dto.ts
│       ├── query-customer.dto.ts
│       └── update-customer.dto.ts
├── prisma/                  # Capa de persistencia global
│   ├── prisma.module.ts     # Modulo global exportador de PrismaService
│   └── prisma.service.ts    # Cliente Prisma con hooks de conexion
└── users/                   # Modulo de gestion de colaboradores
    ├── users.module.ts      # Modulo de usuarios
    ├── users.service.spec.ts
    └── users.service.ts     # Metodos findByEmail, findById y create
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
