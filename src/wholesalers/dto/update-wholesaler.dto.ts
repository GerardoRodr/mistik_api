import { PartialType } from '@nestjs/swagger';
import { CreateWholesalerDto } from './create-wholesaler.dto';

// DTO para la actualizacion parcial de una consolidadora existente
export class UpdateWholesalerDto extends PartialType(CreateWholesalerDto) {}
