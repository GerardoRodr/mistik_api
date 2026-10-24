import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// Gateway WebSockets para la emision de alertas operativas en tiempo real (WBS 9.1.2.1)
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/alerts',
})
export class AlertsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AlertsGateway.name);

  afterInit() {
    this.logger.log('Alerts WebSockets Gateway inicializado en namespace /alerts');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado a /alerts: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado de /alerts: ${client.id}`);
  }

  // Emite alerta de check-in proximo (24-48 horas)
  emitCheckinAlert(alertData: any) {
    if (this.server) {
      this.server.emit('alert:checkin-due', alertData);
    }
  }

  // Emite alerta escalonada de cita consular (30, 15, 7 dias)
  emitVisaAlert(alertData: any) {
    if (this.server) {
      this.server.emit('alert:visa-appointment', alertData);
    }
  }

  // Emite actualizacion de cambio de estado en tarjeta Kanban
  emitTaskMoved(taskData: any) {
    if (this.server) {
      this.server.emit('task:status-changed', taskData);
    }
  }
}
