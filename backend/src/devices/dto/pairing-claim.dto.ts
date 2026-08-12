import { IsString } from "class-validator";

export class PairingClaimDto {
  @IsString()
  code: string;

  @IsString()
  name: string = "Android device";

  @IsString()
  platform: string = "android";
}
