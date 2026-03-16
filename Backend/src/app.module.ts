import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { PriceGroupsModule } from './modules/price-groups/price-groups.module';
import { ShopsModule } from './modules/shops/shops.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OrderTemplatesModule } from './modules/order-templates/order-templates.module';
import { StaffModule } from './modules/staff/staff.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    ProductsModule,
    PriceGroupsModule,
    ShopsModule,
    OrdersModule,
    OrderTemplatesModule,
    StaffModule,
    PaymentsModule,
    NotificationsModule,
    ReportsModule,
    SettingsModule,
  ],
})
export class AppModule {}
