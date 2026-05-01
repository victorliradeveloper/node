import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'Notebook Dell XPS' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 8500.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
