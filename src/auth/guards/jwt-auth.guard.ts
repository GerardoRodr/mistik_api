import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard de autenticacion JWT para proteger rutas del sistema
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
