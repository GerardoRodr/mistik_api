import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Conectar a la base de datos al inicializar el modulo
  async onModuleInit() {
    await this.$connect();
  }

  // Desconectar de la base de datos al destruir el modulo
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
