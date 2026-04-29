import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class BookRecordDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  publisherId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  authorIds: string[];

  @IsNotEmpty()
  reviewComment: string;
}
