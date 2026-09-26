import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;
  let prismaService: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaService = mockPrismaService as unknown as PrismaService;
    interceptor = new AuditLogInterceptor(prismaService);
  });

  it('debe estar definido', () => {
    expect(interceptor).toBeDefined();
  });

  it('debe ignorar peticiones GET sin registrar en AuditLog', (done) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/api/v1/customers',
        }),
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () => of({ success: true }),
    };

    interceptor.intercept(context, next).subscribe({
      next: (val) => {
        expect(val).toEqual({ success: true });
        expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('debe interceptar peticiones POST y persistir datos sanitizados bajo la Ley 29733', (done) => {
    const mockRequest = {
      method: 'POST',
      url: '/api/v1/customers',
      originalUrl: '/api/v1/customers',
      user: { id: 'user-uuid-1' },
      headers: {
        'user-agent': 'Jest-Test-Agent',
      },
      ip: '127.0.0.1',
      params: {},
      body: {
        firstName: 'Carlos',
        password: 'ClaveSecreta123',
        token: 'token-privado',
        documentNumber: '12345678',
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () => of({ id: 'customer-new-1', firstName: 'Carlos' }),
    };

    interceptor.intercept(context, next).subscribe({
      next: async (val) => {
        expect(val).toEqual({ id: 'customer-new-1', firstName: 'Carlos' });

        // Dar un breve tiempo a la resolucion asincrona de tap
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: {
            userId: 'user-uuid-1',
            action: 'POST /api/v1/customers',
            entityName: 'Customer',
            entityId: 'customer-new-1',
            ipAddress: '127.0.0.1',
            userAgent: 'Jest-Test-Agent',
            newValues: {
              firstName: 'Carlos',
              password: '***CONFIDENCIAL***',
              token: '***CONFIDENCIAL***',
              documentNumber: '12345678',
            },
          },
        });
        done();
      },
    });
  });
});
