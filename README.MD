# 🏥 Medical Appointment Backend - Sistema de Agendamiento de Citas Médicas



## 📋 Tabla de Contenidos

- [Descripción del Negocio](#descripción-del-negocio)
- [Arquitectura](#arquitectura)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Requisitos Previos](#requisitos-previos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Principios SOLID y Patrones](#principios-solid-y-patrones)
- [Variables de Entorno](#variables-de-entorno)

##  Descripción del Negocio

Un asegurado desea agendar una cita médica ingresando a la aplicación web donde escoge:
- Centro médico
- Especialidad
- Médico
- Fecha y hora

Al presionar "Agendar", los datos se envían al backend que responde indicando que el agendamiento está en proceso. El sistema procesa la solicitud de forma asíncrona y notifica al usuario cuando la cita ha sido confirmada.

**Sistema multi-país:** Funciona tanto para Perú (PE) como Chile (CL), con procesamiento específico por país.

##  Arquitectura

```
┌─────────────┐
│ Cliente Web │
└──────┬──────┘
       │ 1. POST /appointments
       ▼
┌────────────────┐
│  API Gateway   │
└────────┬───────┘
         │ 2. Invoke
         ▼
┌─────────────────────┐
│  Lambda: Appointment│──────► DynamoDB (status: pending)
└──────────┬──────────┘
           │ 3. Publish
           ▼
   ┌───────┴────────┐
   │                │
   ▼                ▼
┌──────┐        ┌──────┐
│SNS PE│        │SNS CL│
└───┬──┘        └───┬──┘
    │               │
    ▼               ▼
┌──────┐        ┌──────┐
│SQS PE│        │SQS CL│
└───┬──┘        └───┬──┘
    │               │ 4. Process
    ▼               ▼
┌──────────┐   ┌──────────┐
│Lambda PE │   │Lambda CL │
└────┬─────┘   └────┬─────┘
     │              │
     └──────┬───────┘
            │ 5. Save to RDS
            ▼
     ┌────────────┐
     │  RDS MySQL │
     └────────────┘
            │ 6. Publish Event
            ▼
     ┌─────────────┐
     │ EventBridge │
     └──────┬──────┘
            │
            ▼
     ┌────────────┐
     │    SQS     │
     │Confirmation│
     └──────┬─────┘
            │ 7. Update Status
            ▼
     ┌─────────────────────┐
     │Lambda: Confirmation │──────► DynamoDB (status: completed)
     └─────────────────────┘
```

##  Tecnologías Utilizadas

- **Framework:** Serverless Framework v4
- **Runtime:** Node.js 20.x
- **Lenguaje:** TypeScript
- **Servicios AWS:**
  - API Gateway (REST API)
  - Lambda Functions
  - DynamoDB (Estado de citas)
  - RDS MySQL (Datos de citas por país)
  - SNS (Notificaciones por país)
  - SQS (Colas de mensajes)
  - EventBridge (Eventos del sistema)
  - CloudWatch (Logs)

##  Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- AWS CLI configurado
- Cuenta de AWS con permisos administrativos
- Serverless Framework v4 instalado globalmente

```bash
npm install -g serverless
```


### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (no se incluye en el repositorio):

```env
# RDS Peru
RDS_PE_HOST=your-rds-pe-endpoint.rds.amazonaws.com
RDS_PE_PORT=3306
RDS_PE_DATABASE=appointmentspe
RDS_PE_USER=admin
RDS_PE_PASSWORD=your-secure-password

# RDS Chile
RDS_CL_HOST=your-rds-cl-endpoint.rds.amazonaws.com
RDS_CL_PORT=3306
RDS_CL_DATABASE=appointmentscl
RDS_CL_USER=admin
RDS_CL_PASSWORD=your-secure-password
```

### Base de Datos RDS

Ejecuta el script SQL en tus instancias RDS:

```bash
mysql -h your-rds-endpoint -u admin -p < database-schema.sql
```


### Base URL


```
https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
```

### Endpoints

#### 1. Crear Cita (POST /appointments)

**Request:**

```bash
curl -X POST https://your-api-url/dev/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "insuredId": "00123",
    "scheduleId": 100,
    "countryISO": "PE"
  }'
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "message": "Appointment request is being processed"
  }
}
```

#### 2. Consultar Citas (GET /appointments/{insuredId})

**Request:**

```bash
curl https://your-api-url/dev/appointments/00123
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Appointments retrieved successfully",
  "data": {
    "insuredId": "00123",
    "count": 2,
    "appointments": [
      {
        "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
        "scheduleId": 100,
        "countryISO": "PE",
        "status": "completed",
        "createdAt": "2024-12-01T10:00:00Z",
        "updatedAt": "2024-12-01T10:05:00Z"
      },
      {
        "appointmentId": "660e8400-e29b-41d4-a716-446655440001",
        "scheduleId": 101,
        "countryISO": "PE",
        "status": "pending",
        "createdAt": "2024-12-02T14:30:00Z",
        "updatedAt": "2024-12-02T14:30:00Z"
      }
    ]
  }
}
```

### Validaciones

- `insuredId`: Debe ser un string de 5 dígitos (ej: "00123")
- `scheduleId`: Debe ser un número entero positivo
- `countryISO`: Debe ser "PE" o "CL"




## 📁 Estructura del Proyecto

```
medical-appointment-backend/
├── src/
│   ├── functions/
│   │   ├── appointment/
│   │   │   ├── handler.ts          # API Gateway handler
│   │   │   └── confirmation.ts     # Confirmation handler
│   │   ├── appointment-pe/
│   │   │   └── handler.ts          # PE processor
│   │   └── appointment-cl/
│   │       └── handler.ts          # CL processor
│   └── shared/
│       ├── interfaces/
│       │   └── appointment.interface.ts
│       ├── repositories/
│       │   ├── dynamodb.repository.ts
│       │   └── rds.repository.ts
│       ├── services/
│       │   ├── appointment.service.ts
│       │   ├── sns.service.ts
│       │   └── eventbridge.service.ts
│       └── utils/
│           ├── response.util.ts
│           └── validator.util.ts
├── tests/
│   ├── setup.ts
│   ├── validator.test.ts
│   └── appointment.service.test.ts
├── docs/
│   └── openapi.yaml              # Documentación OpenAPI/Swagger
├── serverless.yml                # Configuración de infraestructura
├── database-schema.sql           # Schema de base de datos
├── tsconfig.json
├── jest.config.js
├── package.json
└── README.md
```

## 🎨 Principios SOLID y Patrones

### SOLID Principles

1. **Single Responsibility (S):** Cada clase tiene una única responsabilidad
   - `AppointmentService`: Solo maneja lógica de negocio de citas
   - `DynamoDBRepository`: Solo acceso a DynamoDB
   - `ValidatorUtil`: Solo validaciones

2. **Open/Closed (O):** Abierto para extensión, cerrado para modificación
   - Fácil agregar nuevos países sin modificar código existente

3. **Liskov Substitution (L):** Las interfaces permiten sustituir implementaciones

4. **Interface Segregation (I):** Interfaces específicas y pequeñas

5. **Dependency Inversion (D):** Dependencia de abstracciones, no implementaciones concretas
   - Inyección de dependencias en `AppointmentService`

### Patrones de Diseño

1. **Repository Pattern:** `DynamoDBRepository`, `RDSRepository`
   - Abstrae el acceso a datos

2. **Facade Pattern:** `AppointmentService`
   - Simplifica operaciones complejas

3. **Strategy Pattern:** `SNSService`
   - Selección de topic según país

4. **Observer Pattern:** EventBridge
   - Notificaciones de eventos del sistema

5. **Dependency Injection:** Constructores de servicios
   - Facilita testing y mantenibilidad

## 🔐 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DYNAMODB_TABLE` | Nombre de la tabla DynamoDB | `appointments-dev` |
| `SNS_TOPIC_PE_ARN` | ARN del topic SNS para Perú | `arn:aws:sns:...` |
| `SNS_TOPIC_CL_ARN` | ARN del topic SNS para Chile | `arn:aws:sns:...` |
| `RDS_PE_HOST` | Host de RDS Perú | `xxx.rds.amazonaws.com` |
| `RDS_CL_HOST` | Host de RDS Chile | `yyy.rds.amazonaws.com` |

##  Monitoreo

- **CloudWatch Logs:** Ver logs de todas las lambdas
- **CloudWatch Metrics:** Métricas de invocaciones, errores, duración
- **X-Ray:** Trazabilidad de requests (opcional)




## 👨‍💻 Autor

Backend Team 

