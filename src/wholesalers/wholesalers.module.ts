import { Module } from '@nestjs/common';
import { WholesalersService } from './wholesalers.service';
import { WholesalersController } from './wholesalers.controller';
import { AuthModule } from '../auth/auth.module';

// Modulo para gestion de consolidadoras mayoristas y aerolineas emisoras
@Module({
  imports: [AuthModule],
  controllers: [WholesalersController],
  providers: [WholesalersService],
  exports: [WholesalersService],
})
export class WholesalersModule {}
