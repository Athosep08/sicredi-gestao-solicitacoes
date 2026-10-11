import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

// Configuração comum ao servidor real (main.ts) e aos testes e2e, para os testes exercitarem o mesmo comportamento.
export function configureApp(app: INestApplication) {
  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos que não estão no DTO
      forbidNonWhitelisted: true, // e rejeita quem tenta enviar status/solicitante no corpo
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
