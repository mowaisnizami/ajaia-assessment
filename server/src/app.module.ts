import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsModule } from './documents/documents.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>(
          'DATABASE_URL',
          'postgresql://docflow:docflow_local_password@localhost:5432/docflow',
        ),
        autoLoadEntities: true,
        synchronize: config.get<string>('DATABASE_SYNCHRONIZE', 'false') === 'true',
        ssl:
          config.get<string>('DATABASE_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        retryAttempts: 10,
        retryDelay: 2_000,
      }),
    }),
    UsersModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
