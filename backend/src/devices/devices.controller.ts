import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtUserGuard } from "../auth/jwt-user.guard";
import { User } from "../entities/user.entity";
import { PairingClaimDto } from "./dto/pairing-claim.dto";
import { DevicesService } from "./devices.service";

@Controller("api/devices")
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post("pair/start")
  @UseGuards(JwtUserGuard)
  pairStart(@CurrentUser() user: User) {
    return this.devicesService.pairStart(user);
  }

  @Get("pair/status/:code")
  pairStatus(@Param("code") code: string) {
    return this.devicesService.pairStatus(code);
  }

  @Post("pair/claim")
  pairClaim(@Body() dto: PairingClaimDto) {
    return this.devicesService.pairClaim(dto.code, dto.name, dto.platform);
  }

  @Get()
  @UseGuards(JwtUserGuard)
  listDevices(@CurrentUser() user: User) {
    return this.devicesService.listDevices(user);
  }

  @Get(":deviceId")
  @UseGuards(JwtUserGuard)
  getDevice(@CurrentUser() user: User, @Param("deviceId") deviceId: string) {
    return this.devicesService.getDevice(user, deviceId);
  }
}
