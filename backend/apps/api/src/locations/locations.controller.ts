import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/auth/jwt-auth.guard";
import { PermissionsGuard } from "@app/auth/permissions.guard";
import { RequirePermission } from "@app/auth/require-permission.decorator";
import { PERMISSION_CODES } from "@app/common/constants/permissions.constant";
import { CreateLocationDto } from "./dto/create-location.dto";
import { LocationsService } from "./locations.service";

@ApiTags("locations")
@ApiBearerAuth()
@Controller("api/locations")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Query("workspaceId") workspaceId: string) {
    return this.locationsService.findAllInWorkspace(workspaceId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSION_CODES.LOCATIONS_MANAGE)
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto.workspaceId, dto.name, dto.type);
  }
}
