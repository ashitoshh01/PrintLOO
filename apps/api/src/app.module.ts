import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ShopsModule } from './modules/shops/shops.module';
import { PrintersModule } from './modules/printers/printers.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { QueueModule } from './modules/queue/queue.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { QueueGatewayModule } from './gateways/queue-gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          try {
            const url = new URL(redisUrl);
            return {
              redis: {
                host: url.hostname,
                port: parseInt(url.port || '6379', 10),
                password: url.password || undefined,
                username: url.username || undefined,
                tls: url.protocol === 'rediss:' ? {} : undefined,
              },
            };
          } catch (e) {
            console.warn('Failed to parse REDIS_URL, falling back to default localhost:6379');
          }
        }
        return {
          redis: {
            host: '127.0.0.1',
            port: 6379,
          },
        };
      },
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'uploads'), serveRoot: '/files' }),
    PrismaModule,
    QueueGatewayModule,
    AuthModule,
    UsersModule,
    ShopsModule,
    PrintersModule,
    UploadsModule,
    PricingModule,
    OrdersModule,
    PaymentsModule,
    QueueModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
