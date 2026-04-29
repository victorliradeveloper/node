import { IsNotEmpty } from 'class-validator';

export class CreatePublisherDto {
  @IsNotEmpty()
  name: string;
}
