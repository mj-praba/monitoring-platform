import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@app/auth/current-user.decorator";
import { JwtAuthGuard } from "@app/auth/jwt-auth.guard";
import { PermissionsGuard } from "@app/auth/permissions.guard";
import { RequirePermission } from "@app/auth/require-permission.decorator";
import { PERMISSION_CODES } from "@app/common/constants/permissions.constant";
import { User } from "@app/database/postgres/entities";
import { DevicesService } from "./devices.service";
import { PairStartDto } from "./dto/pair-start.dto";
import { PairingClaimDto } from "./dto/pairing-claim.dto";

@ApiTags("devices")
@Controller("api/devices")
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post("pair/start")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSION_CODES.DEVICES_MANAGE)
  pairStart(@CurrentUser() user: User, @Body() dto: PairStartDto) {
    return this.devicesService.pairStart(user, dto.locationId);
  }

  // Unauthenticated on purpose: called by the pairing code itself (shown
  // on a dashboard already authenticated via pairStart) and by the raw
  // device that has no credentials yet.
  @Get("pair/status/:code")
  pairStatus(@Param("code") code: string) {
    return this.devicesService.pairStatus(code);
  }

  @Post("pair/claim")
  pairClaim(@Body() dto: PairingClaimDto) {
    return this.devicesService.pairClaim(dto.code, dto.name, dto.platform, dto.deviceTypeCode);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listDevices(@CurrentUser() user: User) {
    return this.devicesService.listDevices(user);
  }

  @Get(":deviceId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getDevice(@CurrentUser() user: User, @Param("deviceId") deviceId: string) {
    return this.devicesService.getDevice(user, deviceId);
  }

  @Get(":deviceId/metrics/latest")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getLatestMetrics(@CurrentUser() user: User, @Param("deviceId") deviceId: string) {
    return this.devicesService.getLatestMetrics(user, deviceId);
  }
}
