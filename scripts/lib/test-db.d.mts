export type TestDbConfig = {
  url: string;
  unpooled: string;
  label: string;
  maskedHost: string;
  raw: Record<string, string | undefined>;
};

export function assertTestDb(options?: {
  connect?: boolean;
  quiet?: boolean;
}): Promise<TestDbConfig>;

export function loadTestEnv(): {
  url?: string;
  unpooled?: string;
  confirm?: string;
  label?: string;
  prodUrls: string[];
  raw: Record<string, string | undefined>;
};

export function readEnvFile(path: string): Record<string, string>;
export function sameDatabase(a: string, b: string): boolean;
export function maskHost(value: string): string;
