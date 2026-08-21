export type TokenScope = "user" | "device";

// Deliberately slim: roles/permissions are resolved fresh from
// user_role_assignments on every request (see @app/auth/permissions),
// not trusted from the token, so a permission change takes effect
// immediately instead of waiting for token expiry/reissue.
export interface TokenPayload {
  sub: string;
  scope: TokenScope;
  tenantId?: string;
  exp: number;
}
