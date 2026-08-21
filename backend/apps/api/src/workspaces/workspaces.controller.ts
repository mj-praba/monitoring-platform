import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "@app/auth/current-tenant.decorator";
import { JwtAuthGuard } from "@app/auth/jwt-auth.guard";
import { PermissionsGuard } from "@app/auth/permissions.guard";
import { RequirePermission } from "@app/auth/require-permission.decorator";
import { PERMISSION_CODES } from "@app/common/constants/permissions.constant";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { WorkspacesService } from "./workspaces.service";

@ApiTags("workspaces")
@ApiBearerAuth()
@Controller("api/workspaces")
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentTenant() tenantId: string) {
    return this.workspacesService.findAllInTenant(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(PERMISSION_CODES.WORKSPACES_MANAGE)
  create(@Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(dto.tenantId, dto.name, dto.slug);
  }
}
