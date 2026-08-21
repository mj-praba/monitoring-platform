import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Location, Role, UserRoleAssignment, Workspace } from "@app/database/postgres/entities";
import { hasPermission, loadUserAssignments, ScopeTarget } from "./permissions";
import { REQUIRE_PERMISSION_KEY } from "./require-permission.decorator";

// apps/api only. Runs after JwtAuthGuard (guard order:
// @UseGuards(JwtAuthGuard, PermissionsGuard)) so `request.user` is always
// set here — a device-scoped token never reaches this guard at all, it's
// already rejected by JwtAuthGuard.
//
// Resolves a ScopeTarget from the route by convention (documented "initial
// impl" boundary, see packages/auth/README.md): a locationId in
// params/query/body walks up to workspaceId/tenantId via one lookup; a
// workspaceId resolves its tenantId; otherwise the caller's own tenantId
// is the target.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UserRoleAssignment) private readonly assignments: Repository<UserRoleAssignment>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Location) private readonly locations: Repository<Location>,
    @InjectRepository(Workspace) private readonly workspaces: Repository<Workspace>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string | undefined>(REQUIRE_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException("Missing user context");

    const target = await this.resolveScopeTarget(request, user.tenantId);
    const resolvedAssignments = await loadUserAssignments(this.assignments, this.roles, user.id);

    if (!hasPermission(resolvedAssignments, requiredPermission, target)) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }

    return true;
  }

  private async resolveScopeTarget(request: any, callerTenantId: string): Promise<ScopeTarget> {
    const params = { ...request.params, ...request.query, ...(request.body ?? {}) };

    if (params.locationId) {
      const location = await this.locations.findOneBy({ id: params.locationId });
      if (!location) throw new ForbiddenException("Unknown location");
      const workspace = await this.workspaces.findOneBy({ id: location.workspaceId });
      return { tenantId: workspace?.tenantId ?? callerTenantId, workspaceId: location.workspaceId, locationId: location.id };
    }

    if (params.workspaceId) {
      const workspace = await this.workspaces.findOneBy({ id: params.workspaceId });
      return { tenantId: workspace?.tenantId ?? callerTenantId, workspaceId: params.workspaceId };
    }

    return { tenantId: params.tenantId ?? callerTenantId };
  }
}
