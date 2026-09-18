import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Modulo global para proveer PrismaService en toda la aplicacion
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
