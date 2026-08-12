// The shared .env uses the Python/SQLAlchemy-style "postgresql+asyncpg://" scheme;
// node-postgres only understands the plain "postgresql://" scheme.
export function normalizePostgresUrl(url: string): string {
  return url.replace(/^postgresql\+asyncpg:\/\//, "postgresql://");
}
