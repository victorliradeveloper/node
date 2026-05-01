import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  token: string;
}
