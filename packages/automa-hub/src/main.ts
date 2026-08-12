import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { initCoreDatabases } from '@automa/core';
import * as path from 'path';

async function bootstrap() {
  await initCoreDatabases({
    historyDbPath: 'file:../automa-cli/history.sqlite',
    assetsDbPath: 'file:../automa-cli/assets.sqlite',
    migrationsFolder: path.resolve(__dirname, '../../core/drizzle'),
  });

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

