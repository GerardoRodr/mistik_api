### 📌 1. Ficha General del Proyecto y Cliente

* **Título Oficial del Proyecto:** Sistema Web SPA para la Gestión de Citas, Tareas Operativas y Expedientes Turísticos.
* **Código Identificador:** `CAPSTONE-TUR-2026`.
* **Empresa Cliente / Sponsor:** **MISTIK TOURS & TRAVEL S.A.C.** (RUC: 20608945121), agencia PyME del rubro de turismo, emisión de pasajes aéreos y trámites consulares con sede en Trujillo, La Libertad.
* **Sponsor Ejecutivo:** Gerencia General / Propietario de Mistik Tours & Travel S.A.C..
* **Sponsor Tecnológico / Operativo:** Supervisor(a) de Operaciones y Trámites Consulares.
* **Asesor Académico / Docente:** Docente del curso Capstone Project (INVE1535) – Universidad Privada del Norte (UPN).
* **Duración y Semestre:** 16 semanas académicas (Ciclo 2026-2).

---

### 👥 2. Equipo del Proyecto y Matriz de Roles (UPN)

El equipo de ingeniería de software está integrado por 5 miembros con responsabilidades específicas y codificación WBS asignada:

| Integrante | Código UPN | Rol Principal en el Proyecto | Responsabilidades Específicas de Ingeniería |
| :--- | :---: | :--- | :--- |
| **Rodriguez Monzon, Gerardo Manuel** | `N00451719` | **Líder de Proyecto / Product Owner & Gestor de Flujo (Kanban)** | Gestión del alcance técnico, priorización del Product Backlog, control de políticas de flujo Kanban (límites WIP), gestión de riesgos y canal formal con el Sponsor y UPN. |
| **Garcia Lujan, Laura Thalia** | `N00269668` | **Analista de Requerimientos & Diseñadora UI/UX** | Especificación formal del SRS, modelado de requerimientos, diseño del Design System y prototipado interactivo de alta fidelidad en Figma (W-01 a W-09). |
| **Llaccolla Gamboa, Katherine Lisbeth** | `N00287214` | **Desarrolladora Frontend SPA (Angular 22)** | Arquitectura de la SPA con Standalone Components y Signals, maquetación responsiva, tablero Kanban (Drag & Drop con `@angular/cdk`) e integración WebSockets. |
| **Portales Villa, Abrhyl Kimberly** | `N00316147` | **Desarrolladora Backend & Arquitectura de BD (NestJS / Prisma)** | Diseño y normalización de PostgreSQL en 3FN, esquema Prisma ORM, APIs RESTful modulares con NestJS, autenticación JWT/RBAC y Cron Jobs para alertas. |
| **Oliva Ulloa, Ana Cecilia** | `N00293453` | **Analista de Calidad de Software (QA / SQA) & Seguridad** | Plan de pruebas unitarias/integración con Jest, matriz de trazabilidad, auditoría de seguridad y protección de datos (Ley N.° 29733) y pruebas UAT. |

---

### 🛠️ 3. Diagnóstico Situacional y Problema Central (Línea de Base)

* **Situación Actual (AS-IS):** La agencia opera la totalidad de sus reservas, PNR de vuelos, trámites de visas DS-160 y cobros mediante una única hoja de cálculo en Excel no normalizada (`SERVICIOS PENDIENTES 2026.xlsx`).
* **Problemas Identificados:**
  1. *Dirty Data y Celdas Combinadas:* Un 42% de celdas combinan pasajeros, itinerarios y pagos en texto libre.
  2. *Riesgo en Citas Consulares (2026–2027):* Seguimiento manual sin alertas automáticas para citas agendadas hasta a 18 meses vista.
  3. *Ausencia de Trazabilidad:* Tareas asignadas a múltiples personas ("MAGALY Y ALICIA") o sin responsable (`NaN`), sin registros de auditoría (*AuditLog*).
  4. *Ineficiencia Operativa:* Búsqueda manual de expedientes toma de 3 a 5 minutos por cliente.
* **Objetivo del Software (TO-BE):** Desarrollar e implementar una Single Page Application (SPA) transaccional que reduzca el tiempo de búsqueda a menos de 5 segundos, garantice el 0% de omisiones en citas y check-ins, y asigne un único responsable por tarea operativa.

---

### 💻 4. Solución Propuesta y Stack Tecnológico

* **Paradigma:** Single Page Application (SPA) reactiva con arquitectura limpia de 3 capas.
* **Frontend:** Angular v22.0.x, Standalone Components, gestión de estado con **Signals**, `@angular/cdk` (Drag & Drop) y Chart.js / ngx-charts para Business Intelligence (BI).
* **Backend:** NestJS v11.0.x (Node.js LTS), DTOs con `class-validator`, Cron Jobs (`@nestjs/schedule`) y WebSockets (`Socket.io`).
* **Base de Datos & ORM:** PostgreSQL v16.4 administrado mediante Prisma ORM v6.16.1.
* **Servicios de Inteligencia Artificial (IA):** API de **Google Gemini 2.5 Flash** (vía `@google/genai`) para parsing NLP de itinerarios/PNR y pre-verificación OCR de pasaportes.
* **Estrategia de Costo Cero de Almacenamiento:** No almacena archivos binarios pesados en la nube; los comprobantes se referencian mediante metadatos bancarios e hipervínculos a carpetas de Google Drive.
* **Infraestructura Cloud:** Despliegue en Vercel (Frontend), Render (API REST) y Supabase (PostgreSQL).

---

### 📊 5. Estructura de la EDT, Presupuesto y Cronograma

* **Desglose WBS (`edt.md`):** 165 elementos en total, distribuidos en **13 Componentes**, **18 Productos**, **32 Entregables** y **101 Paquetes de Trabajo**.
* **Presupuesto Comercial Real:** **S/ 40,173.00 PEN** (S/ 35,200.00 en mano de obra de 800 HH, S/ 2,760.00 en cloud anual, S/ 300.00 en tokens IA y S/ 1,913.00 de contingencia).
* **Cronograma (`cronograma_final.md`):** 16 semanas. Semanas 1–4 para diseño y arquitectura; desarrollo paralelo de los Componentes 4 al 11 entre las Semanas 5 y 13; SQA, despliegue y cierre en Semanas 14–16.

---

### 🔬 6. Marco Metodológico de Investigación (Tesis UPN)

* **Diseño Experimental:** Pre-experimental con diseño \\(G \quad O_1 \quad X \quad O_2\\) (medición Pre-Test \\(O_1\\) en Excel, estímulo \\(X\\) con el software SPA y medición Post-Test \\(O_2\\)).
* **Variable Independiente (VI):** Sistema Web SPA.
* **Variable Dependiente (VD):** Gestión operativa y control financiero de servicios turísticos.
* **Unidad de Análisis:** Registros digitales/operativos de servicios turísticos, citas consulares y cobros (no personas).
* **Población y Muestra:**
  * \\(N_1\\): Registros de trámites consulares y citas de visado 2026–2027.
  * \\(N_2\\): Registros de reservas aéreas (PNR) y transacciones de cobro.
  * Total muestral: \\(T = N_1 + N_2\\).