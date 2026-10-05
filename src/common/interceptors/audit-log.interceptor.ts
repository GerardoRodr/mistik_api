import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

// Interceptor para registro inmutable de auditoria en base de datos
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Solo auditar metodos de mutacion
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const url = request.originalUrl || request.url;
    const user = request.user;
    const ipAddress =
      request.headers['x-forwarded-for'] ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown';
    const userAgent = request.headers['user-agent'] || null;
    const entityId = request.params?.id || null;

    // Inferir entidad afectada a partir de la ruta
    const entityName = this.inferEntityName(url);
    const sanitizedBody = this.sanitizePayload(request.body);

    return next.handle().pipe(
      tap({
        next: async (responseData) => {
          try {
            const finalEntityId =
              entityId || responseData?.id || responseData?.data?.id || null;

            await this.prisma.auditLog.create({
              data: {
                userId: user?.id || null,
                action: `${method} ${url}`,
                entityName,
                entityId: finalEntityId ? String(finalEntityId) : null,
                ipAddress: String(ipAddress),
                userAgent: userAgent ? String(userAgent) : null,
                newValues: sanitizedBody,
              },
            });
          } catch (error: any) {
            this.logger.warn(`Error al registrar AuditLog: ${error?.message}`);
          }
        },
      }),
    );
  }

  // Sanitizar campos sensibles para cumplir con la Ley 29733
  private sanitizePayload(data: any): any {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizePayload(item));
    }

    const sensitiveKeys = [
      'password',
      'token',
      'accesstoken',
      'secret',
      'cvv',
      'cardnumber',
    ];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '***CONFIDENCIAL***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizePayload(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // Inferir nombre de entidad segun el segmento de ruta
  private inferEntityName(url: string): string {
    if (url.includes('customers')) return 'Customer';
    if (url.includes('auth')) return 'Auth';
    if (url.includes('bookings')) return 'Booking';
    if (url.includes('visa-processes') || url.includes('visa'))
      return 'VisaProcess';
    if (url.includes('tasks')) return 'ServiceTask';
    return 'General';
  }
}
