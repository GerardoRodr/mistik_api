import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY, RoleType } from '../decorators/roles.decorator';

// Guard para validar roles de usuario en peticiones autenticadas
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Acceso denegado: usuario no autenticado');
    }

    // Normalizar rol en caso de recibirse ASESOR como alias de AGENT
    const userRole = user.role === 'ASESOR' ? Role.AGENT : user.role;

    const hasPermission = requiredRoles.some((role) => {
      const targetRole = role === 'ASESOR' ? Role.AGENT : role;
      return targetRole === userRole;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        'Acceso denegado: no cuenta con los privilegios requeridos',
      );
    }

    return true;
  }
}
