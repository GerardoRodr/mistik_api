import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStateService } from './task-state.service';

// Modulo para control de tareas operativas y tablero Kanban (WBS 8.1.2.1)
@Module({
  imports: [PrismaModule],
  controllers: [TasksController],
  providers: [TasksService, TaskStateService],
  exports: [TasksService, TaskStateService],
})
export class TasksModule {}
