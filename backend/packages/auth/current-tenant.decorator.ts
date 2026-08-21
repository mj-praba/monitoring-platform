import { createParamDecorator, ExecutionContext } from "@nestjs/common";

// Reads the tenantId JwtAuthGuard attached to request.user — the caller's
// home tenant, used as the default scope target when a route doesn't name
// a more specific workspace/location.
export const CurrentTenant = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest().user?.tenantId;
});
