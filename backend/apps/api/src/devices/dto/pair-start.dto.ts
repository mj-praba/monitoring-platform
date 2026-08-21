import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PairStartDto {
  // The location the new device will be placed into once claimed. Checked
  // by PermissionsGuard against devices:manage at this location before
  // the pairing session is created.
  @ApiProperty()
  @IsString()
  locationId: string;
}
