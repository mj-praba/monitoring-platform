import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "@app/auth/current-tenant.decorator";
import { JwtAuthGuard } from "@app/auth/jwt-auth.guard";
import { PermissionsGuard } from "@app/auth/permissions.guard";
import { RequirePermission } from "@app/auth/require-permission.decorator";
import { PERMISSION_CODES } from "@app/common/constants/permissions.constant";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { TenantsService } from "./tenants.service";

@ApiTags("tenants")
@ApiBearerAuth()
@Controller("api/tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMyTenant(@CurrentTenant() tenantId: string) {
    return this.tenantsService.findById(tenantId);
  }

  // Gated on the caller already holding tenants:manage on their OWN
  // tenant (PermissionsGuard falls back to the caller's tenant when no
  // tenantId/workspaceId/locationId is present on the request) — creating
  // a brand-new tenant has no existing scope target to check against.
  // A platform-level superadmin concept is out of scope for this pass.
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSION_CODES.TENANTS_MANAGE)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto.name, dto.slug);
  }
}
