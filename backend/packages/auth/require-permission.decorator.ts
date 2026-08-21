import { SetMetadata } from "@nestjs/common";

export const REQUIRE_PERMISSION_KEY = "requirePermission";

// apps/api only. Pair with PermissionsGuard: @UseGuards(JwtAuthGuard,
// PermissionsGuard) @RequirePermission(PERMISSION_CODES.DEVICES_MANAGE).
export const RequirePermission = (code: string) => SetMetadata(REQUIRE_PERMISSION_KEY, code);
