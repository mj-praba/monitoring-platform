import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { DEVICE_TYPE_CODES } from "@app/common/constants/device.constant";

export class PairingClaimDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsString()
  name: string = "Android device";

  @ApiPropertyOptional()
  @IsString()
  platform: string = "android";

  @ApiPropertyOptional({ enum: Object.values(DEVICE_TYPE_CODES) })
  @IsOptional()
  @IsIn(Object.values(DEVICE_TYPE_CODES))
  deviceTypeCode: string = DEVICE_TYPE_CODES.MOBILE;
}
