import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, LoggerService } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

async function bootstrap() {
  // Initialize Sentry before anything else
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
    });
    Logger.log('Sentry initialized', 'Bootstrap');
  } else {
    Logger.warn('SENTRY_DSN not set — Sentry disabled', 'Bootstrap');
  }

  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLogger(),
  });

  app.setGlobalPrefix('api', {
    exclude: ['metrics'],
  });
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Signal Lab API')
    .setDescription('Observability demo API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.BACKEND_PORT || 3001;
  await app.listen(port);
  Logger.log(`Signal Lab backend running on port ${port}`, 'Bootstrap');
}

/**
 * Structured JSON logger for Loki consumption.
 * Outputs JSON to stdout which Promtail picks up.
 */
class StructuredLogger implements LoggerService {
  log(message: any, context?: string) {
    this.writeLog('info', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.writeLog('error', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.writeLog('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.writeLog('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.writeLog('verbose', message, context);
  }

  private writeLog(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ) {
    const logEntry: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level,
      context: context || 'Application',
      app: 'signal-lab',
    };

    if (typeof message === 'object' && message !== null) {
      Object.assign(logEntry, message);
    } else {
      logEntry.message = message;
    }

    if (trace) {
      logEntry.stack = trace;
    }

    const output = JSON.stringify(logEntry);

    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }
}

bootstrap();