import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS if needed (optional)
  app.enableCors();

  // ✅ Use global validation pipes for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown fields
      forbidNonWhitelisted: true, // Throw error if extra fields provided
      transform: true, // Auto-transform payloads to DTO types
    }),
  );
  // app.use(new ClsMiddleware({}).use);
  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Chat Api')
    .setDescription('API documentation with JWT Authentication')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token in the format: Bearer <token>',
        in: 'header',
      },
      'access-token', // This key name must match the one used in @ApiBearerAuth()
    )
    .addTag('auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: false}, // Keeps token after page refresh
  });
  const PORT=process.env.PORT_NAME || 50000
  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📘 Swagger available at http://localhost:${PORT}/api`);
}
bootstrap();
