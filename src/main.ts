import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // Desactivar parser predeterminado de 100kb para permitir imagenes de pasaporte en base64
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Configurar limite de carga a 50MB para procesamiento OCR y multimedia
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Configuracion de validacion global de entrada
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuracion de CORS para comunicacion con frontend
  const corsOriginEnv = process.env.CORS_ORIGIN;
  const allowedOrigins: string[] = corsOriginEnv
    ? corsOriginEnv.split(',').map((origin) => origin.trim())
    : ['*'];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Permitir peticiones sin cabecera origin o que coincidan con la lista comodin
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
  });

  // Configuracion de documentacion Swagger OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MISTIK TOURS API')
    .setDescription(
      'API REST del Sistema Web SPA para la Gestion de Citas, Tareas Operativas y Expedientes Turisticos (CAPSTONE-TUR-2026)',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT obtenido en /auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Enlazar a 0.0.0.0 para compatibilidad con contenedores y Render
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
