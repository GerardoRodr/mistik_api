import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';

// DTO para actualizacion parcial de clientes
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
