# Modulo de Auditoria, Seguridad y Filtros Transversales

Este documento describe la arquitectura y funcionamiento de los componentes transversales de seguridad, trazabilidad legal y gestion estandarizada de errores del backend de Mistik Tours & Travel S.A.C.

---

## 1. Interceptor de Auditoria Inmutable (WBS 5.1.2.3 / HU-03)

El backend incorpora un interceptor global inmutable (`AuditLogInterceptor`), ubicado en `src/common/interceptors/audit-log.interceptor.ts`, responsable de registrar de forma automatica y asincrona toda operacion de cambio o mutacion en el sistema.

### 1.1. Alcance de Intercepcion
- Intercepta unicamente peticiones HTTP con metodos de mutacion: `POST`, `PUT`, `PATCH` y `DELETE`.
- Las peticiones de solo lectura (`GET`, `OPTIONS`, `HEAD`) son ignoradas para evitar sobrecarga innecesaria en la base de datos.

### 1.2. Cumplimiento de la Ley N. 29733 (Proteccion de Datos Personales)
En estricto cumplimiento del marco legal peruano sobre privacidad y proteccion de datos:
- El interceptor ejecuta una funcion interna de sanitizacion recursiva (`sanitizePayload`) antes de persistir cualquier registro.
- Se eliminan de manera automatica campos con datos sensibles como: `password`, `passwordConfirm`, `accessToken`, `token`, `secret`, `creditCard` y similares.

### 1.3. Estructura del Registro en la Tabla `audit_logs`

Cada registro de auditoria contiene la siguiente estructura inmutable en PostgreSQL:

| Campo | Tipo | Descripcion |
| :--- | :--- | :--- |
| `id` | `UUID` | Clave primaria unica e irrepetible generada con `gen_random_uuid()` |
| `userId` | `UUID` | Identificador del usuario que origino la mutacion (extraido del token JWT) |
| `action` | `String` | Verbo y ruta invocada (ej. `POST /api/v1/customers` o `PATCH /api/v1/customers/:id`) |
| `entityName` | `String` | Nombre inferido de la entidad afectada (ej. `Customer`, `Booking`) |
| `entityId` | `String` | Identificador UUID del registro afectado (extraido de parametros o del resultado) |
| `oldValues` | `JSON` | Estado previo de la entidad antes de la modificacion (si aplica) |
| `newValues` | `JSON` | Payload sanitizado que origino la mutacion |
| `ipAddress` | `String` | Direccion IP del cliente solicitante |
| `userAgent` | `String` | Encabezado User-Agent del navegador o cliente HTTP |
| `createdAt` | `DateTime` | Marca temporal inmutable en formato UTC |

#### Ejemplo de Registro Persistido
```json
{
  "id": "9b1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e",
  "userId": "c1f7a8b2-4d3e-4b5a-9c8d-1e2f3a4b5c6d",
  "action": "POST /api/v1/customers",
  "entityName": "Customer",
  "entityId": "7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
  "ipAddress": "127.0.0.1",
  "userAgent": "PostmanRuntime/7.43.0",
  "newValues": {
    "documentType": "DNI",
    "documentNumber": "74859612",
    "firstName": "Lucia",
    "lastName": "Mendez",
    "email": "lucia.mendez@gmail.com",
    "phoneNumber": "+51987654321",
    "address": "Av. America Sur 1234, Trujillo"
  },
  "createdAt": "2026-09-26T05:00:00.000Z"
}
```

---

## 2. Control de Acceso Basado en Roles (RBAC)

El sistema implementa seguridad declarativa mediante el guardia `RolesGuard` (`src/auth/guards/roles.guard.ts`) y el decorador `@Roles()` (`src/auth/decorators/roles.decorator.ts`).

### 2.1. Jerarquia y Equivalencias de Roles
Los roles oficiales del sistema se definen en el enum `Role` de Prisma:

- `ADMIN`: Administrador general con acceso total a configuraciones, auditoria y expedientes.
- `SUPERVISOR`: Supervisor de operaciones y calidad turistica.
- `AGENT`: Asesor comercial y de ventas turisticas.

> **Nota de compatibilidad:** El decorador `@Roles()` soporta de forma transparente tanto el rol de base de datos `AGENT` como el alias funcional `ASESOR`, homologandolos en tiempo de ejecucion.

### 2.2. Uso en Controladores
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR', 'AGENT')
@Get()
findAll() {
  // Solo usuarios autenticados con los roles indicados pueden acceder
}
```

Si el usuario autenticado no posee el rol autorizado, el sistema rechaza la peticion con un error `403 Forbidden`:

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Acceso denegado: rol insuficiente",
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/api/v1/customers"
}
```

---

## 3. Filtro Estandarizado de Errores (HttpExceptionFilter)

Ubicado en `src/common/filters/http-exception.filter.ts`, este filtro global intercepta cualquier excepcion lanzada por los controladores, servicios o pipes de validacion de NestJS, garantizando un contrato de respuesta JSON predecible.

### 3.1. Estructura Base de Errores
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Descripcion del error ocurrido",
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/api/v1/customers"
}
```

### 3.2. Catalogo de Codigos de Error del Backend

| Codigo HTTP | Nombre | Escenario Tipico |
| :--- | :--- | :--- |
| `400` | Bad Request | Faltan campos obligatorios o formato invalido en DTOs |
| `401` | Unauthorized | Token JWT expirado, ausente o credenciales de login erroneas |
| `403` | Forbidden | El usuario no cuenta con el rol requerido para el endpoint |
| `404` | Not Found | El recurso consultado (ej. cliente por UUID) no existe en la base de datos |
| `409` | Conflict | Registro duplicado (ej. numero de documento o email ya registrado) |
| `500` | Internal Server Error | Falla no controlada del servidor o desconexion de base de datos |
