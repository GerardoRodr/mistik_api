# Modulo CRM de Clientes

Este documento detalla la arquitectura, especificaciones tecnicas y endpoints del modulo `CustomersModule` del backend de Mistik Tours & Travel S.A.C., correspondiente al paquete de trabajo WBS `4.1.2.1` y la historia de usuario `HU-04`.

---

## 1. Descripcion del Modulo

El modulo CRM de clientes administra el ciclo de vida integral y el expediente 360 grados de los clientes de la agencia:

- **Ruta de codigo:** `src/customers/`
- **Controlador principal:** `CustomersController` (`src/customers/customers.controller.ts`)
- **Servicio principal:** `CustomersService` (`src/customers/customers.service.ts`)
- **Entidad de datos:** Modelo `Customer` en `prisma/schema.prisma`
- **Caracteristicas tecnicas:**
  - Busqueda indexada en base de datos que garantiza tiempos de respuesta inferiores a 5 segundos (RNF `2.2.1.2`).
  - Consulta integral de expediente 360 grados conectando clientes con reservas, pasajeros, cobros, tramites de visa y tareas de servicio.
  - Validacion estricta de documentos unicos para evitar duplicidades (`409 Conflict`).
  - Proteccion mediante `JwtAuthGuard` y `RolesGuard` permitiendo acceso a `ADMIN`, `SUPERVISOR`, `AGENT` (y alias `ASESOR`).
  - Intercepcion automatica de mutaciones (`POST`, `PATCH`) mediante `AuditLogInterceptor` para cumplimiento legal de la Ley N. 29733.

---

## 2. Endpoints del Modulo

### 2.1. Listar y Buscar Clientes (Paginado)

- **Ruta:** `/api/v1/customers`
- **Metodo HTTP:** `GET`
- **Modulo:** `CustomersModule`
- **Nivel de Acceso:** Protegido con `JwtAuthGuard` y `RolesGuard` (`ADMIN`, `SUPERVISOR`, `AGENT`)
- **Descripcion:** Retorna un listado paginado de clientes. Soporta filtrado en tiempo real por numero de documento (DNI, Pasaporte), nombres o apellidos, de forma insensible a mayusculas/minusculas (`mode: insensitive`).

#### Parametros de Consulta (Query Parameters)
- `page` (opcional, numero entero): Pagina actual a consultar. Valor por defecto: `1`.
- `limit` (opcional, numero entero): Cantidad de registros por pagina. Valor por defecto: `10`.
- `search` (opcional, texto): Termino de busqueda para coincidencia parcial en documento, nombres o apellidos.

#### Cabeceras de Peticion
```http
Authorization: Bearer <accessToken>
```

#### Respuestas (Responses)

##### 200 OK (Listado obtenido)
```json
{
  "data": [
    {
      "id": "7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
      "documentType": "DNI",
      "documentNumber": "74859612",
      "firstName": "Lucia",
      "lastName": "Mendez",
      "email": "lucia.mendez@gmail.com",
      "phoneNumber": "+51987654321",
      "address": "Av. America Sur 1234, Trujillo",
      "createdAt": "2026-09-26T05:00:00.000Z",
      "updatedAt": "2026-09-26T05:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

##### 401 Unauthorized (Sin autorizacion)
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Unauthorized",
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/api/v1/customers"
}
```

#### Ejemplo de Invocacion con cURL
```bash
# Listado paginado estandar
curl -X GET "http://localhost:3000/api/v1/customers?page=1&limit=10" \
  -H "Authorization: Bearer <accessToken>"

# Busqueda por DNI o nombre
curl -X GET "http://localhost:3000/api/v1/customers?search=74859612" \
  -H "Authorization: Bearer <accessToken>"
```

---

### 2.2. Obtener Expediente 360 Grados de un Cliente

- **Ruta:** `/api/v1/customers/:id`
- **Metodo HTTP:** `GET`
- **Modulo:** `CustomersModule`
- **Nivel de Acceso:** Protegido con `JwtAuthGuard` y `RolesGuard` (`ADMIN`, `SUPERVISOR`, `AGENT`)
- **Descripcion:** Consulta la ficha consolidada 360 grados del cliente mediante su identificador UUID, incluyendo todas sus relaciones historicas: reservas asociadas, registros de pasajeros, cobros efectuados, tareas operativas y procesos de tramite de visa.

#### Parametro de Ruta (Path Parameter)
- `id` (string, UUID): Identificador unico del cliente.

#### Cabeceras de Peticion
```http
Authorization: Bearer <accessToken>
```

#### Respuestas (Responses)

##### 200 OK (Expediente 360 grados encontrado)
```json
{
  "id": "7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
  "documentType": "DNI",
  "documentNumber": "74859612",
  "firstName": "Lucia",
  "lastName": "Mendez",
  "email": "lucia.mendez@gmail.com",
  "phoneNumber": "+51987654321",
  "address": "Av. America Sur 1234, Trujillo",
  "createdAt": "2026-09-26T05:00:00.000Z",
  "updatedAt": "2026-09-26T05:00:00.000Z",
  "bookings": [],
  "passengers": [],
  "payments": [],
  "serviceTasks": [],
  "visaProcesses": []
}
```

##### 404 Not Found (Cliente no existente)
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Cliente con ID 7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d no encontrado",
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/api/v1/customers/7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d"
}
```

#### Ejemplo de Invocacion con cURL
```bash
curl -X GET "http://localhost:3000/api/v1/customers/7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d" \
  -H "Authorization: Bearer <accessToken>"
```

---

### 2.3. Registrar un Nuevo Cliente

- **Ruta:** `/api/v1/customers`
- **Metodo HTTP:** `POST`
- **Modulo:** `CustomersModule`
- **Nivel de Acceso:** Protegido con `JwtAuthGuard` y `RolesGuard` (`ADMIN`, `SUPERVISOR`, `AGENT`)
- **Trazabilidad:** Interceptado de forma automatica por `AuditLogInterceptor` y registrado en la tabla `audit_logs`.
- **Descripcion:** Crea un nuevo registro de cliente en la base de datos previa validacion DTO estricta. Si ya existe un cliente registrado con el mismo tipo y numero de documento, rechaza la peticion con un error de conflicto.

#### Cabeceras de Peticion
```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### Cuerpo de la Peticion (Request Body)
Campos validados por `CreateCustomerDto`:
- `documentType` (string, requerido): Tipo de documento (ej. `DNI`, `PASAPORTE`, `CE`).
- `documentNumber` (string, requerido): Numero de documento oficial.
- `firstName` (string, requerido): Nombres del cliente.
- `lastName` (string, requerido): Apellidos del cliente.
- `email` (string, opcional): Correo electronico con formato valido.
- `phoneNumber` (string, opcional): Numero de telefono o celular.
- `address` (string, opcional): Direccion fisica domiciliaria.

```json
{
  "documentType": "DNI",
  "documentNumber": "74859612",
  "firstName": "Lucia",
  "lastName": "Mendez",
  "email": "lucia.mendez@gmail.com",
  "phoneNumber": "+51987654321",
  "address": "Av. America Sur 1234, Trujillo"
}
```

#### Respuestas (Responses)

##### 201 Created (Cliente registrado exitosamente)
```json
{
  "id": "7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
  "documentType": "DNI",
  "documentNumber": "74859612",
  "firstName": "Lucia",
  "lastName": "Mendez",
  "email": "lucia.mendez@gmail.com",
  "phoneNumber": "+51987654321",
  "address": "Av. America Sur 1234, Trujillo",
  "createdAt": "2026-09-26T05:00:00.000Z",
  "updatedAt": "2026-09-26T05:00:00.000Z"
}
```

##### 400 Bad Request (Fallo en la validacion de campos)
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "documentType no debe estar vacio",
    "documentNumber no debe estar vacio",
    "firstName no debe estar vacio",
    "lastName no debe estar vacio"
  ],
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/api/v1/customers"
}
```

##### 409 Conflict (Documento de cliente ya existente)
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Ya existe un cliente con el documento DNI 74859612",
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/api/v1/customers"
}
```

#### Ejemplo de Invocacion con cURL
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "documentType": "DNI",
    "documentNumber": "74859612",
    "firstName": "Lucia",
    "lastName": "Mendez",
    "email": "lucia.mendez@gmail.com",
    "phoneNumber": "+51987654321",
    "address": "Av. America Sur 1234, Trujillo"
  }'
```

---

### 2.4. Actualizar Parcialmente un Cliente

- **Ruta:** `/api/v1/customers/:id`
- **Metodo HTTP:** `PATCH`
- **Modulo:** `CustomersModule`
- **Nivel de Acceso:** Protegido con `JwtAuthGuard` y `RolesGuard` (`ADMIN`, `SUPERVISOR`, `AGENT`)
- **Trazabilidad:** Interceptado de forma automatica por `AuditLogInterceptor` y registrado en la tabla `audit_logs`.
- **Descripcion:** Actualiza uno o varios atributos del cliente identificado por su UUID. Valida que el cliente exista y que si se modifica el documento, este no colisione con el de otro cliente existente.

#### Parametro de Ruta (Path Parameter)
- `id` (string, UUID): Identificador del cliente.

#### Cabeceras de Peticion
```http
Content-Type: application/json
Authorization: Bearer <accessToken>
```

#### Cuerpo de la Peticion (Request Body)
Campos opcionales manejados por `UpdateCustomerDto` (cualquier subconjunto de campos es valido):

```json
{
  "phoneNumber": "+51999888777",
  "address": "Calle Las Begonias 456, Victor Larco"
}
```

#### Respuestas (Responses)

##### 200 OK (Cliente actualizado exitosamente)
```json
{
  "id": "7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
  "documentType": "DNI",
  "documentNumber": "74859612",
  "firstName": "Lucia",
  "lastName": "Mendez",
  "email": "lucia.mendez@gmail.com",
  "phoneNumber": "+51999888777",
  "address": "Calle Las Begonias 456, Victor Larco",
  "createdAt": "2026-09-26T05:00:00.000Z",
  "updatedAt": "2026-09-26T05:15:00.000Z"
}
```

##### 404 Not Found (Cliente a actualizar no encontrado)
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Cliente con ID 7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d no encontrado",
  "timestamp": "2026-09-26T05:00:00.000Z",
  "path": "/api/v1/customers/7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d"
}
```

#### Ejemplo de Invocacion con cURL
```bash
curl -X PATCH "http://localhost:3000/api/v1/customers/7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "phoneNumber": "+51999888777",
    "address": "Calle Las Begonias 456, Victor Larco"
  }'
```
