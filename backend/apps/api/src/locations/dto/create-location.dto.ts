import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

export class CreateLocationDto {
  @ApiProperty()
  @IsString()
  workspaceId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ["home", "work", "other"] })
  @IsIn(["home", "work", "other"])
  type: "home" | "work" | "other";
}
