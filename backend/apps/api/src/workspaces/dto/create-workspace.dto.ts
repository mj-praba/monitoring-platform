import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateWorkspaceDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  slug: string;
}
