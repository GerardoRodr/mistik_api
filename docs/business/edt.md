# Estructura de Desglose de Trabajo (EDT / WBS)

Este documento contiene la representacion jerarquica estructurada del EDT del proyecto, disenada para proveer contexto completo tanto a agentes automatizados como a revisores del proyecto.

## Informacion General del Proyecto

- **Proyecto (Raiz - Nivel 0)**: Desarrollar un Sistema Web SPA para la Gestión de Citas, Tareas Operativas y Expedientes Turísticos para la empresa MISTIK TOURS & TRAVEL S.A.C.
- **Total de Elementos Registrados**: 165
- **Componentes (Nivel 1)**: 13
- **Productos (Nivel 2)**: 18
- **Entregables (Nivel 3)**: 32
- **Paquetes de Trabajo (Nivel 4)**: 101

## Leyenda de Jerarquia y Convenciones

| Nivel | Tipo EDT | Patron de Codigo | Significado y Alcance |
| :--- | :--- | :--- | :--- |
| Nivel 0 | `ROOT` | `0` | Objetivo general del proyecto del sistema SPA |
| Nivel 1 | `COMPONENTE` | `X.` (ej. `1.`, `2.`) | Fases o areas troncales de gestion y desarrollo |
| Nivel 2 | `PRODUCTO` | `X.Y` (ej. `1.1`, `4.1`) | Modulos, entregables mayores o subconjuntos funcionales |
| Nivel 3 | `ENTREGABLE` | `X.Y.Z` (ej. `1.1.1`, `4.1.1`) | Agrupadores especificos de trabajo (Frontend, Backend, etc.) |
| Nivel 4 | `PAQUETE` | `X.Y.Z.W` (ej. `1.1.1.1`) | Paquetes de trabajo minimos verificables y accionables |

## Resumen de Componentes (Nivel 1)

| Codigo | Componente | Productos | Entregables | Paquetes de Trabajo |
| :--- | :--- | :---: | :---: | :---: |
| **1.** | Gestión del Proyecto | 2 | 5 | 22 |
| **2.** | Análisis de Requerimientos del Sistema | 2 | 3 | 15 |
| **3.** | Diseño de la Arquitectura del Sistema | 2 | 2 | 7 |
| **4.** | Implementación del CRM de Clientes | 1 | 2 | 5 |
| **5.** | Implementación de Seguridad del Sistema | 1 | 2 | 5 |
| **6.** | Implementación de Servicios de Reserva Aérea (PNR) | 1 | 2 | 5 |
| **7.** | Implementación de Trámites Consulares de Visa | 1 | 2 | 5 |
| **8.** | Implementación del Tablero Operativo Kanban | 1 | 2 | 5 |
| **9.** | Automatización de Alertas del Sistema | 1 | 2 | 4 |
| **10.** | Implementación de Servicios de Inteligencia Artificial | 1 | 2 | 6 |
| **11.** | Implementación de Business Intelligence | 1 | 2 | 6 |
| **12.** | Pruebas del Sistema de Despliegue en Producción | 2 | 2 | 7 |
| **13.** | Capacitación al Personal de Cierre del Proyecto | 2 | 4 | 9 |

## Desglose Jerarquico Detallado del EDT

- **[ROOT] 0** Desarrollar un Sistema Web SPA para la Gestión de Citas, Tareas Operativas y Expedientes Turísticos para la empresa MISTIK TOURS & TRAVEL S.A.C.
  - **[COMPONENTE] 1.** Gestión del Proyecto
    - **[PRODUCTO] 1.1** Formalización Inicial del Proyecto
      - **[ENTREGABLE] 1.1.1** Documentación Fundacional
        - `1.1.1.1` [PAQUETE] Acta de Constitución del Proyecto aprobada
        - `1.1.1.2` [PAQUETE] Registro de Stakeholders clave validado
        - `1.1.1.3` [PAQUETE] Business Case formalizado
        - `1.1.1.4` [PAQUETE] Matriz de Consistencia de Tesis estructurada
      - **[ENTREGABLE] 1.1.2** Planes de Línea Base Metodológica
        - `1.1.2.1` [PAQUETE] Especificación del Alcance del Proyecto
        - `1.1.2.2` [PAQUETE] Plan de Calidad con criterios Definition of Done (DoD)
        - `1.1.2.3` [PAQUETE] Diccionario de la Estructura de Desglose de Trabajo
        - `1.1.2.4` [PAQUETE] Cronograma de 16 semanas con ruta crítica
        - `1.1.2.5` [PAQUETE] Presupuesto de Infraestructura Cloud Costo Cero (S/ 0.00)
      - **[ENTREGABLE] 1.1.3** Matrices de Gestión PM4R
        - `1.1.3.1` [PAQUETE] Matriz de Comunicaciones del Proyecto
        - `1.1.3.2` [PAQUETE] Matriz de Responsabilidades RACI con responsable único
        - `1.1.3.3` [PAQUETE] Matriz de Adquisiciones de Recursos Gratuitos
        - `1.1.3.4` [PAQUETE] Matriz de Riesgos Operativos con planes de respuesta
    - **[PRODUCTO] 1.2** Planificación de la Solución Técnica
      - **[ENTREGABLE] 1.2.1** Especificación Técnica Preliminar
        - `1.2.1.1` [PAQUETE] Documento de Requerimientos de Software (SRS)
        - `1.2.1.2` [PAQUETE] Product Backlog priorizado con Historias de Usuario
        - `1.2.1.3` [PAQUETE] Modelo Lógico de Base de Datos Relacional
      - **[ENTREGABLE] 1.2.2** Prototipado de Interfaces en Figma
        - `1.2.2.1` [PAQUETE] Prototipo UI del Directorio de Clientes
        - `1.2.2.2` [PAQUETE] Prototipo UI del Registro de Boletos PNR
        - `1.2.2.3` [PAQUETE] Prototipo UI del Módulo de Visas DS-160
        - `1.2.2.4` [PAQUETE] Prototipo UI del Tablero Kanban
        - `1.2.2.5` [PAQUETE] Prototipo UI del Asistente de Extracción por Inteligencia Artificial
        - `1.2.2.6` [PAQUETE] Prototipo UI del Panel de Business Intelligence
  - **[COMPONENTE] 2.** Análisis de Requerimientos del Sistema
    - **[PRODUCTO] 2.1** Requerimientos Funcionales del Software
      - **[ENTREGABLE] 2.1.1** Requerimientos Transaccionales Base
        - `2.1.1.1` [PAQUETE] Especificación de Autenticación con Roles RBAC
        - `2.1.1.2` [PAQUETE] Especificación de Expedientes de Pasajeros
        - `2.1.1.3` [PAQUETE] Especificación de Validación de Localizadores PNR
        - `2.1.1.4` [PAQUETE] Especificación de Citas Consulares Multianuales
        - `2.1.1.5` [PAQUETE] Especificación del Tablero Operativo Kanban
        - `2.1.1.6` [PAQUETE] Especificación de Alertas Programadas del Sistema
        - `2.1.1.7` [PAQUETE] Especificación de Cobranzas con Enlaces Drive
      - **[ENTREGABLE] 2.1.2** Requerimientos Analíticos de Inteligencia
        - `2.1.2.1` [PAQUETE] Especificación del Extractor de Itinerarios por NLP
        - `2.1.2.2` [PAQUETE] Especificación del Validador Óptico de Pasaportes
        - `2.1.2.3` [PAQUETE] Especificación de Indicadores de Business Intelligence
    - **[PRODUCTO] 2.2** Requerimientos No Funcionales del Software
      - **[ENTREGABLE] 2.2.1** Restricciones Técnicas Regulatorias
        - `2.2.1.1` [PAQUETE] Especificación de Seguridad Cifrada bajo Ley N.° 29733
        - `2.2.1.2` [PAQUETE] Especificación de Rendimiento para Búsqueda menor a 5 Segundos
        - `2.2.1.3` [PAQUETE] Especificación de Latencia de IA menor a 5 Segundos
        - `2.2.1.4` [PAQUETE] Especificación de Tiempo de Carga de BI menor a 2 Segundos
        - `2.2.1.5` [PAQUETE] Especificación de Mantenibilidad bajo Arquitectura Limpia
  - **[COMPONENTE] 3.** Diseño de la Arquitectura del Sistema
    - **[PRODUCTO] 3.1** Arquitectura Tecnológica del Software
      - **[ENTREGABLE] 3.1.1** Modelado Estructural
        - `3.1.1.1` [PAQUETE] Diagrama de Arquitectura Angular 22 con NestJS
        - `3.1.1.2` [PAQUETE] Diagramas UML de Componentes de Software
        - `3.1.1.3` [PAQUETE] Diagrama de Integración del Servicio Externo de IA
    - **[PRODUCTO] 3.2** Persistencia Relacional de Datos
      - **[ENTREGABLE] 3.2.1** Estructuración de la Base de Datos
        - `3.2.1.1` [PAQUETE] Diagrama Entidad Relación en Tercera Forma Normal
        - `3.2.1.2` [PAQUETE] Esquema Prisma Schema con Tipos Fuertes
        - `3.2.1.3` [PAQUETE] Diccionario de Datos Relacional de Tablas Operativas
        - `3.2.1.4` [PAQUETE] Script de Migraciones Iniciales en PostgreSQL
  - **[COMPONENTE] 4.** Implementación del CRM de Clientes
    - **[PRODUCTO] 4.1** Directorio Centralizado de Pasajeros
      - **[ENTREGABLE] 4.1.1** Frontend del Módulo de Clientes
        - `4.1.1.1` [PAQUETE] Formulario de Registro con Máscaras para Documentos
        - `4.1.1.2` [PAQUETE] Pantalla del Expediente 360 Grados del Pasajero
        - `4.1.1.3` [PAQUETE] Buscador Reactivo de Clientes con Angular Signals
      - **[ENTREGABLE] 4.1.2** Backend del Módulo de Clientes
        - `4.1.2.1` [PAQUETE] Servicio NestJS de Gestión de Expedientes
        - `4.1.2.2` [PAQUETE] Consultas Indexadas de Búsqueda en PostgreSQL
  - **[COMPONENTE] 5.** Implementación de Seguridad del Sistema
    - **[PRODUCTO] 5.1** Control de Accesos por Roles (RBAC)
      - **[ENTREGABLE] 5.1.1** Frontend de Control de Sesión
        - `5.1.1.1` [PAQUETE] Interfaz de Inicio de Sesión
        - `5.1.1.2` [PAQUETE] Angular Guards de Protección de Rutas por Perfil
      - **[ENTREGABLE] 5.1.2** Backend de Seguridad de Cifrado
        - `5.1.2.1` [PAQUETE] Servicio NestJS de Autenticación con Tokens JWT
        - `5.1.2.2` [PAQUETE] Cifrado Seguro de Credenciales con Bcrypt
        - `5.1.2.3` [PAQUETE] Interceptor NestJS de Registro Inmutable en AuditLog
  - **[COMPONENTE] 6.** Implementación de Servicios de Reserva Aérea (PNR)
    - **[PRODUCTO] 6.1** Gestor Transaccional de Vuelos
      - **[ENTREGABLE] 6.1.1** Frontend de Boletos de Emisión
        - `6.1.1.1` [PAQUETE] Formulario con Validación de PNR de 6 Caracteres
        - `6.1.1.2` [PAQUETE] Catálogo Seleccionable de Consolidadoras Mayoristas
        - `6.1.1.3` [PAQUETE] Visualizador de Itinerarios de Vuelo
      - **[ENTREGABLE] 6.1.2** Backend de Gestión de Reservas
        - `6.1.2.1` [PAQUETE] Máquina de Transición de Estados del Servicio Aéreo
        - `6.1.2.2` [PAQUETE] Endpoints REST de Consulta de Pasajeros por Reserva
  - **[COMPONENTE] 7.** Implementación de Trámites Consulares de Visa
    - **[PRODUCTO] 7.1** Control Operativo de Solicitudes DS-160
      - **[ENTREGABLE] 7.1.1** Frontend de Seguimiento Consular
        - `7.1.1.1` [PAQUETE] Formulario de Códigos de Confirmación DS-160
        - `7.1.1.2` [PAQUETE] Registro de Pagos de Arancel Consular de 185 Dólares
        - `7.1.1.3` [PAQUETE] Calendario Operativo de Citas Consulares Multianuales
      - **[ENTREGABLE] 7.1.2** Backend de Trámites Consulares
        - `7.1.2.1` [PAQUETE] Servicio de Seguimiento de Fases del Trámite Consular
        - `7.1.2.2` [PAQUETE] Repositorio de Fechas Consulares a Largo Plazo
  - **[COMPONENTE] 8.** Implementación del Tablero Operativo Kanban
    - **[PRODUCTO] 8.1** Bandeja Visual de Flujo Operativo
      - **[ENTREGABLE] 8.1.1** Frontend del Tablero Interactivo
        - `8.1.1.1` [PAQUETE] Columnas de Estados con Angular CDK Drag and Drop
        - `8.1.1.2` [PAQUETE] Selector Obligatorio de Responsable Único por Tarjeta
        - `8.1.1.3` [PAQUETE] Filtros Dinámicos de Tareas por Prioridad
      - **[ENTREGABLE] 8.1.2** Backend de Control de Tareas
        - `8.1.2.1` [PAQUETE] Servicio de Cambio de Estado con Registro de Fechas
        - `8.1.2.2` [PAQUETE] Control de Asignación Exclusiva por Colaborador
  - **[COMPONENTE] 9.** Automatización de Alertas del Sistema
    - **[PRODUCTO] 9.1** Motor de Notificaciones Programadas
      - **[ENTREGABLE] 9.1.1** Servicios de Segundo Plano
        - `9.1.1.1` [PAQUETE] Cron Job de Check-ins Próximos de 24 a 48 Horas
        - `9.1.1.2` [PAQUETE] Cron Job de Alertas Escalonadas de Citas Consulares
      - **[ENTREGABLE] 9.1.2** Canal de Transmisión Instantánea
        - `9.1.2.1` [PAQUETE] Gateway WebSockets en NestJS con Socket.io
        - `9.1.2.2` [PAQUETE] Componente Toast de Notificación Inmediata en SPA
  - **[COMPONENTE] 10.** Implementación de Servicios de Inteligencia Artificial
    - **[PRODUCTO] 10.1** Procesamiento Inteligente de Documentos
      - **[ENTREGABLE] 10.1.1** Extracción de Reservas por Lenguaje Natural
        - `10.1.1.1` [PAQUETE] Interfaz de Carga de Texto de Correos de Reserva
        - `10.1.1.2` [PAQUETE] Servicio de Integración con API Gemini 2.5 Flash
        - `10.1.1.3` [PAQUETE] Parser Backend con Validación de Esquema JSON Estricto
      - **[ENTREGABLE] 10.1.2** Pre-Verificación de Pasaportes por Visión Artificial
        - `10.1.2.1` [PAQUETE] Interfaz de Pre-visualización Óptica de Documentos
        - `10.1.2.2` [PAQUETE] Servicio de Lectura OCR con Visión Computacional
        - `10.1.2.3` [PAQUETE] Algoritmo Preventivo de Vigencia Menor a 6 Meses
  - **[COMPONENTE] 11.** Implementación de Business Intelligence
    - **[PRODUCTO] 11.1** Analítica Visual de Operaciones Financieras
      - **[ENTREGABLE] 11.1.1** Registro Estructurado de Movimientos Financieros
        - `11.1.1.1` [PAQUETE] Formulario de Registro de Metadatos Bancarios
        - `11.1.1.2` [PAQUETE] Vinculador de Enlaces Externos a Google Drive
        - `11.1.1.3` [PAQUETE] Calculador Reactivo de Saldos Deudores por Servicio
      - **[ENTREGABLE] 11.1.2** Paneles Analíticos de Decisión
        - `11.1.2.1` [PAQUETE] Cuadro de Mando de Distribución Financiera con Chart.js
        - `11.1.2.2` [PAQUETE] Gráfico de Embudo de Conversión de Trámites Consulares
        - `11.1.2.3` [PAQUETE] Indicadores de Cuellos de Botella del Tablero Kanban
  - **[COMPONENTE] 12.** Pruebas del Sistema de Despliegue en Producción
    - **[PRODUCTO] 12.1** Verificación de Calidad del Software
      - **[ENTREGABLE] 12.1.1** Ejecución de Baterías de Pruebas
        - `12.1.1.1` [PAQUETE] Batería de Pruebas Unitarias Backend con Jest
        - `12.1.1.2` [PAQUETE] Batería de Pruebas de Integración de Endpoints REST
        - `12.1.1.3` [PAQUETE] Informe de Resultados de Pruebas (Reporte SQA)
        - `12.1.1.4` [PAQUETE] Pruebas de Aceptación del Usuario (UAT) en Agencia
    - **[PRODUCTO] 12.2** Puesta en Operación Cloud a Costo Cero
      - **[ENTREGABLE] 12.2.1** Despliegue de Componentes en la Nube
        - `12.2.1.1` [PAQUETE] Despliegue Continuo de la SPA Angular 22 en Vercel
        - `12.2.1.2` [PAQUETE] Despliegue de la API NestJS en Render
        - `12.2.1.3` [PAQUETE] Instancia Relacional de PostgreSQL en Supabase
  - **[COMPONENTE] 13.** Capacitación al Personal de Cierre del Proyecto
    - **[PRODUCTO] 13.1** Transferencia de Conocimiento Operativo
      - **[ENTREGABLE] 13.1.1** Manuales Técnicos del Sistema
        - `13.1.1.1` [PAQUETE] Manual de Usuario para Asesores Comerciales
        - `13.1.1.2` [PAQUETE] Manual de Usuario para Supervisores de Operaciones
        - `13.1.1.3` [PAQUETE] Manual de Despliegue Técnico del Repositorio
      - **[ENTREGABLE] 13.1.2** Talleres de Adopción Tecnológica
        - `13.1.2.1` [PAQUETE] Taller Práctico de Operación de la SPA con Personal
        - `13.1.2.2` [PAQUETE] Evaluación de Usabilidad Mediante Escala SUS
    - **[PRODUCTO] 13.2** Cierre Administrativo de Titulación Académica
      - **[ENTREGABLE] 13.2.1** Cierre con la Organización Cliente
        - `13.2.1.1` [PAQUETE] Acta de Conformidad Firmada por Gerencia
        - `13.2.1.2` [PAQUETE] Encuesta de Satisfacción del Cliente Concluida
      - **[ENTREGABLE] 13.2.2** Cierre Académico de Tesis
        - `13.2.2.1` [PAQUETE] Informe Final Consolidado según Formato UPN
        - `13.2.2.2` [PAQUETE] Portafolio Final de Evidencias de Práctica de Campo
