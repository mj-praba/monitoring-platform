import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "@app/auth/current-tenant.decorator";
import { JwtAuthGuard } from "@app/auth/jwt-auth.guard";
import { PermissionsGuard } from "@app/auth/permissions.guard";
import { RequirePermission } from "@app/auth/require-permission.decorator";
import { PERMISSION_CODES } from "@app/common/constants/permissions.constant";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("api/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSION_CODES.USERS_MANAGE)
  listUsers(@CurrentTenant() tenantId: string) {
    return this.usersService.findAllInTenant(tenantId);
  }
}
