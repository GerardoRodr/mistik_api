# Indice de Documentacion Tecnica del Backend

Bienvenido a la documentacion tecnica de la API backend de Mistik Tours & Travel S.A.C. Este directorio contiene las especificaciones modulares para desarrolladores backend, desarrolladores frontend o integradores externos que requieran interactuar con el sistema, comprender su arquitectura o consumir sus endpoints.

---

## 1. Arquitectura General del Backend

El backend esta construido sobre una arquitectura modular basada en el framework NestJS:

- **Lenguaje:** TypeScript v5.7
- **Framework:** NestJS v11 (CommonJS / Node.js)
- **Capa de Persistencia:** Prisma ORM v6 con PostgreSQL (Supabase)
- **Seguridad:** Autenticacion JWT con Passport, hashing de contrasenas con Bcrypt (costo 10) y control de acceso basado en roles (RBAC)
- **Validacion:** Pipes globales con `class-validator` y `class-transformer` (`whitelist: true`, `forbidNonWhitelisted: true`)
- **Trazabilidad:** Interceptor inmutable de auditoria en base de datos bajo la Ley N. 29733
- **Documentacion Interactiva:** Swagger / OpenAPI disponible en `/api/docs`

---

## 2. Convenciones Globales de la API

### 2.1. Entorno y Direccion Base
- Servidor de Desarrollo Local: `http://localhost:3000`
- Prefijo de endpoints de dominio: `/api/v1/`
- Prefijo de endpoints de autenticacion: `/auth/`
- Interfaz interactiva Swagger: `http://localhost:3000/api/docs`

### 2.2. Cabeceras Obligatorias (Headers)
Para interactuar con la API se utilizan las siguientes cabeceras estandar:
- `Content-Type: application/json` (requerido en peticiones con cuerpo: POST, PUT, PATCH).
- `Authorization: Bearer <token_jwt>` (requerido en endpoints protegidos).

### 2.3. Formato Unificado de Respuesta de Error
Todas las excepciones HTTP del sistema son capturadas por el filtro global `HttpExceptionFilter` y transformadas a una estructura uniforme:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "documentNumber no debe estar vacio",
    "email debe ser un correo electronico valido"
  ],
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/api/v1/customers"
}
```

---

## 3. Matriz General de Endpoints por Modulo

La siguiente tabla resume todos los endpoints disponibles en el backend, indicando el modulo responsable, su proposito y el nivel de acceso requerido:

| Metodo | Ruta | Modulo Responsable | Descripcion de la Operacion | Acceso / Roles | Documento Detallado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | `AuthModule` | Inicia sesion y devuelve el token JWT con datos de usuario | Publico | [modulo_autenticacion.md](modulo_autenticacion.md) |
| `GET` | `/auth/profile` | `AuthModule` | Retorna la informacion del usuario autenticado actual | Bearer JWT (Cualquier rol) | [modulo_autenticacion.md](modulo_autenticacion.md) |
| `GET` | `/api/v1/customers` | `CustomersModule` | Consulta paginada y busqueda rapida de clientes (< 5s) | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_crm_clientes.md](modulo_crm_clientes.md) |
| `GET` | `/api/v1/customers/:id` | `CustomersModule` | Obtiene el expediente 360 grados de un cliente y su historial | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_crm_clientes.md](modulo_crm_clientes.md) |
| `POST` | `/api/v1/customers` | `CustomersModule` | Registra un nuevo cliente validando documento unico | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_crm_clientes.md](modulo_crm_clientes.md) |
| `PATCH` | `/api/v1/customers/:id` | `CustomersModule` | Actualiza de forma parcial los datos de un cliente | Bearer JWT (ADMIN, SUPERVISOR, AGENT) | [modulo_crm_clientes.md](modulo_crm_clientes.md) |

---

## 4. Indice de Documentos Modulares

Para consultar la especificacion completa de cada componente del backend, accede a los siguientes archivos:

1. [Modulo de Autenticacion y Usuarios](modulo_autenticacion.md): Gestion de credenciales, login, perfil, DTOs y tokens JWT.
2. [Modulo CRM de Clientes](modulo_crm_clientes.md): Gestion de expedientes 360, busqueda rapida, DTOs de creacion y actualizacion.
3. [Modulo de Auditoria y Seguridad](modulo_auditoria_y_seguridad.md): Interceptor inmutable (Ley 29733), guardias RBAC y filtro de errores.
4. [Modulo de Persistencia y Prisma](modulo_persistencia_prisma.md): Modelo de datos relacional 3FN, enums, migraciones y seed.
