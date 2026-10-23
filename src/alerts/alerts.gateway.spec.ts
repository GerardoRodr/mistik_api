import { Test, TestingModule } from '@nestjs/testing';
import { AlertsGateway } from './alerts.gateway';

describe('AlertsGateway (WBS 9.1.2.1)', () => {
  let gateway: AlertsGateway;

  const mockServer = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsGateway],
    }).compile();

    gateway = module.get<AlertsGateway>(AlertsGateway);
    gateway.server = mockServer as any;
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(gateway).toBeDefined();
  });

  it('debe emitir evento alert:checkin-due', () => {
    const payload = { pnr: 'AB12CD', passengerName: 'Juan Perez' };
    gateway.emitCheckinAlert(payload);
    expect(mockServer.emit).toHaveBeenCalledWith('alert:checkin-due', payload);
  });

  it('debe emitir evento alert:visa-appointment', () => {
    const payload = { daysRemaining: 15, applicantName: 'Maria Silva' };
    gateway.emitVisaAlert(payload);
    expect(mockServer.emit).toHaveBeenCalledWith('alert:visa-appointment', payload);
  });

  it('debe emitir evento task:status-changed', () => {
    const payload = { taskId: 'task-1', targetStatus: 'IN_PROGRESS' };
    gateway.emitTaskMoved(payload);
    expect(mockServer.emit).toHaveBeenCalledWith('task:status-changed', payload);
  });
});
