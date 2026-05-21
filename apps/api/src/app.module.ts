import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { QueueGateway } from './gateways/queue.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    BullModule.forRoot({ redis: process.env.REDIS_URL || 'redis://localhost:6379' }),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'uploads'), serveRoot: '/files' }),
    PrismaModule,
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
  providers: [QueueGateway],
})
export class AppModule {}
