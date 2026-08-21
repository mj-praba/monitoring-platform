import { User } from "@app/database/postgres/entities";

export interface UserOut {
  id: string;
  email: string;
  tenant_id: string;
  created_at: string;
}

export function toUserOut(user: User): UserOut {
  return {
    id: user.id,
    email: user.email,
    tenant_id: user.tenantId,
    created_at: new Date(user.createdAt).toISOString(),
  };
}
