import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

// Modulo de gestion de usuarios y colaboradores
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
