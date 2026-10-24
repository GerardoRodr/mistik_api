# Modulo de Inteligencia Artificial y Procesamiento de Documentos

Este documento describe la arquitectura, endpoints REST, contratos JSON, integracion con Google Gemini 2.5 Flash y algoritmos de validacion preventiva del modulo `AiModule` del backend de Mistik Tours & Travel S.A.C., correspondiente a los paquetes de trabajo WBS `10.1.1.2`, `10.1.1.3`, `10.1.2.2` y `10.1.2.3` de la Semana 10.

---

## 1. Descripcion del Modulo

El modulo de Inteligencia Artificial automatiza la extraccion y validacion de datos a partir de fuentes no estructuradas (correos de confirmacion de reserva e imagenes de pasaportes) mediante modelos multimodales de lenguaje:

- **Ruta de codigo:** `src/ai/`
- **Controlador principal:** `AiController` (`src/ai/ai.controller.ts`)
- **Servicio Gemini:** `GeminiService` (`src/ai/gemini.service.ts`)
- **Servicio de lectura OCR:** `PassportOcrService` (`src/ai/passport-ocr.service.ts`)
- **Validador consular preventivo:** `PassportValidatorService` (`src/ai/passport-validator.service.ts`)
- **Modulo principal:** `AiModule` (`src/ai/ai.module.ts`)
- **Dependencias tecnologicas:** SDK oficial `@google/genai` (Google Gen AI SDK v2.31+), `dotenv`.
- **Modelo LLM utilizado:** `gemini-2.5-flash` con temperatura determinista `0.1`.

---

## 2. Configuracion de Credenciales y Modo Resiliente

La API key de Gemini se configura en el archivo `.env` mediante la variable:

```env
GEMINI_API_KEY="AIzaSy..."
```

### Modo de Respaldo Determinista (Fallback Mode)
Si la variable `GEMINI_API_KEY` no esta presente o si el servicio de Google experimenta intermitencias de red durante pruebas locales, el servicio activa de forma transparente un extractor heuristico y de expresiones regulares que cumple estrictamente con el contrato JSON acordado, evitando caidas en el entorno de desarrollo o suites de pruebas automatizadas.

---

## 3. Endpoints REST del Modulo

### 3.1. Parser NLP de Correos de Itinerario de Vuelo

- **Ruta:** `/api/v1/ai/parse-itinerary`
- **Metodo HTTP:** `POST`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR` (`JwtAuthGuard`, `RolesGuard`)
- **Descripcion:** Procesa el texto plano sin formato copiado de un correo de confirmacion de vuelo emitido por consolidadoras o aerolineas y extrae un objeto JSON estandarizado.

#### Carga Util de Entrada (Request Body)
```json
{
  "rawEmailText": "Estimado cliente, su reserva con LATAM Airlines ha sido confirmada. Localizador: LIM456. Vuelo Trujillo a Madrid el 2026-11-15T08:30:00Z. Pasajero: JUAN CARLOS PEREZ GOMEZ DNI 74859632. Tarifa total pagada: USD 1250.00."
}
```

#### Respuesta 200 OK (Esquema JSON Estricto)
```json
{
  "pnr": "LIM456",
  "airline": "LATAM Airlines",
  "departureCity": "Trujillo",
  "arrivalCity": "Madrid",
  "departureDate": "2026-11-15T08:30:00.000Z",
  "returnDate": null,
  "passengers": [
    {
      "fullName": "JUAN CARLOS PEREZ GOMEZ",
      "documentNumber": "74859632"
    }
  ],
  "ticketCost": 1250.00,
  "currency": "USD"
}
```

---

### 3.2. OCR Multimodal de Pasaportes y Validacion Preventiva

- **Ruta:** `/api/v1/ai/ocr-passport`
- **Metodo HTTP:** `POST`
- **Nivel de Acceso:** `ADMIN`, `SUPERVISOR`, `AGENT`, `ASESOR` (`JwtAuthGuard`, `RolesGuard`)
- **Descripcion:** Recibe la fotografia del pasaporte codificada en Base64, extrae los campos de identidad y de la zona de lectura mecanica (MRZ), y ejecuta el algoritmo preventivo de vigencia menor a 6 meses respecto a la fecha planeada del viaje o la fecha actual.

#### Carga Util de Entrada (Request Body)
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
  "travelDate": "2026-11-20"
}
```

#### Respuesta 200 OK
```json
{
  "passport": {
    "passportNumber": "P74859632",
    "firstName": "MARIA ELENA",
    "lastName": "RODRIGUEZ SILVA",
    "nationality": "PERUANA",
    "birthDate": "1992-08-24",
    "expirationDate": "2027-02-15",
    "mrz": "P<PERRODRIGUEZ<SILVA<<MARIA<ELENA<<<<<<<<<<<\nP748596327PER9208248F2702158<<<<<<<<<<<<<<04"
  },
  "validity": {
    "expirationDate": "2027-02-15",
    "referenceDate": "2026-11-20",
    "monthsRemaining": 2.9,
    "isExpiringSoon": true,
    "isExpired": false,
    "status": "CRITICO_VIGENCIA_MENOR_6_MESES",
    "alertMessage": "Alerta preventiva: El pasaporte cuenta con vigencia menor a 6 meses para la fecha del viaje o tramite"
  }
}
```

---

## 4. Algoritmo Preventivo de Vigencia Menor a 6 Meses (WBS 10.1.2.3)

Implementado en `PassportValidatorService`, el algoritmo calcula el remanente en meses entre la fecha de vencimiento (`expirationDate`) y la fecha de referencia (`travelDate` o `Date.now()`):

$$\Delta_{\text{meses}} = \frac{T_{\text{expiracion}} - T_{\text{referencia}}}{1000 \times 60 \times 60 \times 24 \times 30.4375}$$

### Reglas de Clasificacion de Estado

| Condicion Matematica | Estado Retornado | Mensaje Preventivo al Asesor | Accion Recomendada |
| :--- | :--- | :--- | :--- |
| $\Delta_{\text{ms}} \le 0$ | `VENCIDO` | Pasaporte se encuentra vencido para la fecha del viaje o tramite | Bloquear emision de boletos / tramite |
| $0 < \Delta_{\text{meses}} < 6$ | `CRITICO_VIGENCIA_MENOR_6_MESES` | Alerta preventiva: Pasaporte con vigencia menor a 6 meses | Sugerir renovacion inmediata ante Migraciones |
| $\Delta_{\text{meses}} \ge 6$ | `VALIDO` | Pasaporte con vigencia conforme | Proceder normalmente con reserva o visado |
