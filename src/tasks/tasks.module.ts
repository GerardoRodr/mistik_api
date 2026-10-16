import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStateService } from './task-state.service';
import { AuthModule } from '../auth/auth.module';

// Modulo para control de tareas operativas y tablero Kanban (WBS 8.1.2.1)
@Module({
  imports: [AuthModule],
  controllers: [TasksController],
  providers: [TasksService, TaskStateService],
  exports: [TasksService, TaskStateService],
})
export class TasksModule {}
