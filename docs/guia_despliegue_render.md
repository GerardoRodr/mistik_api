# Guia de Despliegue en Render (Mistik API)

Esta guia describe el procedimiento paso a paso para desplegar la API en **Render** (Web Service) y garantizar su funcionamiento continuo durante la presentacion academica.

---

## 1. Requisitos Previos

1. Repositorio subido a GitHub (publico o privado).
2. Cuenta activa en [render.com](https://render.com).
3. Base de datos PostgreSQL en Supabase activa con las credenciales de tu archivo `.env`:
   - `DATABASE_URL` (cadena con connection pooling / pgbouncer, puerto 6543)
   - `DIRECT_URL` (cadena directa a PostgreSQL, puerto 5432)
4. Clave de API de Google Gemini (`GEMINI_API_KEY`).

---

## 2. Opciones de Despliegue en Render

Tienes dos alternativas para crear el servicio en Render:

### Opcion A: Despliegue Asistido con Blueprint (Recomendado)
Render detectara automaticamente el archivo `render.yaml` incluido en el repositorio:
1. En el panel de Render, haz clic en **New +** y selecciona **Blueprint**.
2. Conecta tu repositorio de GitHub `mistik_api`.
3. Render leera `render.yaml` y te solicitara ingresar los valores de las variables marcadas como secretas (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `GEMINI_API_KEY`).
4. Haz clic en **Apply** para iniciar la compilacion y despliegue.

### Opcion B: Creacion Manual de Web Service
Si prefieres configurarlo manualmente desde la interfaz grafica:
1. En Render, haz clic en **New +** y selecciona **Web Service**.
2. Conecta tu repositorio de GitHub.
3. Configura los siguientes campos:
   - **Name:** `mistik-api`
   - **Region:** Selecciona la mas cercana a tu base de datos (ej. `Ohio (US East)` o `Oregon (US West)`).
   - **Branch:** `main` (o tu rama de trabajo).
   - **Runtime:** `Node`.
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start:prod
     ```
   - **Pre-Deploy Command (en Advanced):**
     ```bash
     npx prisma migrate deploy
     ```
   - **Instance Type:** `Free`.

---

## 3. Configuracion de Variables de Entorno

En la pestana **Environment** del servicio en Render, agrega las siguientes variables:

| Clave | Valor Recomendado | Descripcion |
| :--- | :--- | :--- |
| `NODE_VERSION` | `20` | Version de Node.js en el contenedor de Render |
| `DATABASE_URL` | Copiar de tu `.env` | URL de conexion con pooler de Supabase |
| `DIRECT_URL` | Copiar de tu `.env` | URL directa de Supabase para migraciones Prisma |
| `JWT_SECRET` | Copiar de tu `.env` | Clave secreta para emision de tokens JWT |
| `JWT_EXPIRATION` | `8h` | Duracion extendida para sesiones de prueba |
| `CORS_ORIGIN` | `*` | Permite peticiones de cualquier cliente para la clase |
| `GEMINI_API_KEY` | Copiar de tu `.env` | Clave de Google AI Studio para validaciones OCR |

---

## 4. Verificacion Post-Despliegue

Una vez completado el despliegue (estado `Live`), prueba los siguientes accesos utilizando tu URL publica (ejemplo `https://mistik-api.onrender.com`):

1. **Prueba de Estado:**
   - Abre en el navegador: `https://tu-api.onrender.com/`
   - Respuesta esperada: `Hello World!` (HTTP 200).
2. **Documentacion Swagger OpenAPI:**
   - Abre en el navegador: `https://tu-api.onrender.com/api/docs`
   - Debe cargar la consola interactiva con todos los endpoints del sistema.
3. **Prueba de Autenticacion:**
   - En Swagger, prueba `POST /auth/login` con tus credenciales de prueba.
4. **Prueba de WebSockets:**
   - Comprueba en la consola de tu frontend (o cliente Socket.io) la conexion al namespace `https://tu-api.onrender.com/alerts`.
   - En los logs de Render deberas observar: `Cliente conectado a /alerts: <socket_id>`.

---

## 5. Recomendaciones Criticas para el Dia de la Presentacion

Debido a que el plan gratuito de Render suspende los contenedores tras 15 minutos sin trafico:

1. **Precalentamiento:** 10 minutos antes de comenzar tu exposicion, abre la URL de Swagger (`https://tu-api.onrender.com/api/docs`) en el navegador. Esto asegurara que el contenedor ya este activo y caliente, evitando los ~50 segundos de retraso por arranque en frio.
2. **Mantenerlo Activo (Keep-Alive Opcional):** Puedes utilizar un servicio gratuito de monitoreo como [UptimeRobot](https://uptimerobot.com) o [cron-job.org](https://cron-job.org) apuntando cada 10 minutos a `https://tu-api.onrender.com/` para evitar que el servicio se duerma durante tu clase.
3. **CORS Abierto:** Con `CORS_ORIGIN=*` ya configurado, puedes ejecutar tu frontend de Angular localmente en `http://localhost:4200` o desde cualquier otra maquina sin conflictos de origen cruzado.
