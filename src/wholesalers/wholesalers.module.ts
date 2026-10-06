import { Module } from '@nestjs/common';
import { WholesalersService } from './wholesalers.service';
import { WholesalersController } from './wholesalers.controller';

// Modulo para gestion de consolidadoras mayoristas y aerolineas emisoras
@Module({
  controllers: [WholesalersController],
  providers: [WholesalersService],
  exports: [WholesalersService],
})
export class WholesalersModule {}
