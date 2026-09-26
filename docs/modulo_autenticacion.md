# Modulo de Autenticacion y Usuarios

Este documento describe el funcionamiento tecnico, la arquitectura de seguridad y los endpoints expuestos por los modulos `AuthModule` y `UsersModule` del backend de Mistik Tours & Travel S.A.C.

---

## 1. Descripcion del Modulo

Los modulos de autenticacion y usuarios gestionan la identidad, credenciales y sesiones de los colaboradores de la empresa:

- **Ruta de codigo:** `src/auth/` y `src/users/`
- **Controlador principal:** `AuthController` (`src/auth/auth.controller.ts`)
- **Servicios:** `AuthService` (`src/auth/auth.service.ts`) y `UsersService` (`src/users/users.service.ts`)
- **Seguridad:**
  - Hashing criptografico mediante `bcrypt` con costo de 10 rondas de salt.
  - Firma de tokens criptograficos mediante `@nestjs/jwt` con algoritmo HMAC SHA-256.
  - Estrategia de extraccion de token con `passport-jwt` (`JwtStrategy`).
  - Guardia de autenticacion reutilizable `JwtAuthGuard`.
  - Decorador de parametro `@CurrentUser()` para obtener el usuario autenticado desde el contexto de ejecucion.

---

## 2. Cuentas de Prueba Preconfiguradas (Seed)

Para realizar pruebas inmediatas en entornos de desarrollo o integracion, la base de datos incluye tres cuentas de usuario sembradas mediante `prisma/seed.ts`:

| Rol | Correo Electronico | Contrasena | Nombre |
| :--- | :--- | :--- | :--- |
| `ADMIN` | `admin@mistiktours.com` | `Admin2026!` | Administrador Mistik |
| `SUPERVISOR` | `supervisor@mistiktours.com` | `Supervisor2026!` | Supervisor Operaciones |
| `AGENT` (Asesor) | `agente@mistiktours.com` | `Agente2026!` | Asesor Comercial |

---

## 3. Endpoints del Modulo

### 3.1. Iniciar Sesion (Login)

- **Ruta:** `/auth/login`
- **Metodo HTTP:** `POST`
- **Modulo:** `AuthModule`
- **Nivel de Acceso:** Publico (no requiere token de autorizacion)
- **Descripcion:** Valida las credenciales del colaborador contra la tabla `users` de PostgreSQL. Verifica que el usuario exista, que su campo `isActive` sea `true` y que el hash de la contrasena coincida mediante Bcrypt. Si es exitoso, emite un token de acceso JWT y retorna los datos publicos del perfil.

#### Cabeceras de Peticion
```http
Content-Type: application/json
```

#### Cuerpo de la Peticion (Request Body)
Valores requeridos por la clase `LoginDto`:
- `email` (string): Correo electronico con formato valido.
- `password` (string): Contrasena en texto plano (minimo 6 caracteres).

```json
{
  "email": "admin@mistiktours.com",
  "password": "Admin2026!"
}
```

#### Respuestas (Responses)

##### 200 OK (Inicio de sesion exitoso)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMWY3YThiMi00ZDNlLTRiNWEtOWM4ZC0xZTJmM2E0YjVjNmQiLCJlbWFpbCI6ImFkbWluQG1pc3Rpa3RvdXJzLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3NDY4MDAwMCwiZXhwIjoxNzc0NjgzNjAwfQ.signature",
  "user": {
    "id": "c1f7a8b2-4d3e-4b5a-9c8d-1e2f3a4b5c6d",
    "email": "admin@mistiktours.com",
    "name": "Administrador Mistik",
    "role": "ADMIN"
  }
}
```

##### 400 Bad Request (Error de validacion en datos de entrada)
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/auth/login"
}
```

##### 401 Unauthorized (Credenciales invalidas o cuenta inactiva)
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Credenciales invalidas",
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/auth/login"
}
```

#### Ejemplo de Invocacion con cURL
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mistiktours.com",
    "password": "Admin2026!"
  }'
```

---

### 3.2. Obtener Perfil del Usuario Activo

- **Ruta:** `/auth/profile`
- **Metodo HTTP:** `GET`
- **Modulo:** `AuthModule`
- **Nivel de Acceso:** Protegido mediante `JwtAuthGuard` (cualquier rol autenticado)
- **Descripcion:** Lee el token JWT enviado en la cabecera `Authorization`, valida su firma criptografica y fecha de expiracion, e inyecta la identidad del usuario en la sesion mediante el decorador `@CurrentUser()`.

#### Cabeceras de Peticion
```http
Authorization: Bearer <accessToken>
```

#### Respuestas (Responses)

##### 200 OK (Perfil obtenido exitosamente)
```json
{
  "id": "c1f7a8b2-4d3e-4b5a-9c8d-1e2f3a4b5c6d",
  "email": "admin@mistiktours.com",
  "name": "Administrador Mistik",
  "role": "ADMIN",
  "isActive": true
}
```

##### 401 Unauthorized (Token no proporcionado, malformado o expirado)
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/auth/profile"
}
```

#### Ejemplo de Invocacion con cURL
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
