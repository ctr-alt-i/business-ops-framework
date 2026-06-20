import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseEnvLine(line: string): { key: string; value: string } | undefined {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return undefined;
  }

  const normalized = trimmed.startsWith("export ") ? trimmed.slice("export ".length).trim() : trimmed;
  const separatorIndex = normalized.indexOf("=");

  if (separatorIndex <= 0) {
    return undefined;
  }

  const key = normalized.slice(0, separatorIndex).trim();
  const rawValue = normalized.slice(separatorIndex + 1).trim();

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return undefined;
  }

  return {
    key,
    value: stripWrappingQuotes(rawValue),
  };
}

export async function loadOptionalLocalEnv(repoRoot: string): Promise<string[]> {
  const loadedFiles: string[] = [];
  const candidatePaths = [resolve(repoRoot, ".env.local"), resolve(repoRoot, ".env")];

  for (const path of candidatePaths) {
    if (!(await pathExists(path))) {
      continue;
    }

    const content = await readFile(path, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const entry = parseEnvLine(line);

      if (!entry) {
        continue;
      }

      if (process.env[entry.key] === undefined) {
        process.env[entry.key] = entry.value;
      }
    }

    loadedFiles.push(path);
  }

  return loadedFiles;
}
