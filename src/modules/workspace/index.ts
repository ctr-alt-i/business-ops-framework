import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import type {
  RawSourceKind,
  WorkspaceBootstrapResult,
  WorkspaceDefinition,
  WorkspaceLoadResult,
  WorkspacePaths,
  WorkspaceValidationIssue,
  WorkspaceValidationResult,
} from "../../core/types";

export const WORKSPACE_MARKERS = {
  sources: "<!-- sources:auto -->",
  log: "<!-- log:auto -->",
  decisions: "<!-- decisions:auto -->",
  actions: "<!-- actions:auto -->",
  futureWork: "<!-- future-work:auto -->",
} as const;

export interface WorkspaceInitOptions {
  name?: string;
  description?: string;
  overwrite?: boolean;
}

export const REQUIRED_DIRECTORY_RELATIVE_PATHS = [
  "raw/meetings",
  "raw/technical",
  "raw/communications",
  "raw/clients",
  "wiki/sources",
  "wiki/entities",
  "wiki/projects",
  "wiki/topics",
  "wiki/ops",
  "outputs/reports",
  "outputs/recaps",
  "outputs/decks",
  "admin/legal",
  "admin/finance",
  "archive",
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeSlug(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ensureTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readOptionalText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}

export function getWorkspacePaths(root: string): WorkspacePaths {
  const absoluteRoot = resolve(root);

  return {
    root: absoluteRoot,
    agentsFile: join(absoluteRoot, "AGENTS.md"),
    readmeFile: join(absoluteRoot, "README.md"),
    raw: join(absoluteRoot, "raw"),
    rawMeetings: join(absoluteRoot, "raw", "meetings"),
    rawTechnical: join(absoluteRoot, "raw", "technical"),
    rawCommunications: join(absoluteRoot, "raw", "communications"),
    rawClients: join(absoluteRoot, "raw", "clients"),
    wiki: join(absoluteRoot, "wiki"),
    wikiIndexFile: join(absoluteRoot, "wiki", "index.md"),
    wikiLogFile: join(absoluteRoot, "wiki", "log.md"),
    wikiOverviewFile: join(absoluteRoot, "wiki", "overview.md"),
    wikiSources: join(absoluteRoot, "wiki", "sources"),
    wikiEntities: join(absoluteRoot, "wiki", "entities"),
    wikiProjects: join(absoluteRoot, "wiki", "projects"),
    wikiTopics: join(absoluteRoot, "wiki", "topics"),
    wikiOps: join(absoluteRoot, "wiki", "ops"),
    wikiDecisionLogFile: join(absoluteRoot, "wiki", "ops", "decision-log.md"),
    wikiActionTrackerFile: join(absoluteRoot, "wiki", "ops", "action-tracker.md"),
    wikiFutureWorkFile: join(absoluteRoot, "wiki", "ops", "future-work.md"),
    outputs: join(absoluteRoot, "outputs"),
    outputsReports: join(absoluteRoot, "outputs", "reports"),
    outputsRecaps: join(absoluteRoot, "outputs", "recaps"),
    outputsDecks: join(absoluteRoot, "outputs", "decks"),
    admin: join(absoluteRoot, "admin"),
    adminLegal: join(absoluteRoot, "admin", "legal"),
    adminFinance: join(absoluteRoot, "admin", "finance"),
    archive: join(absoluteRoot, "archive"),
  };
}

export function createWorkspaceDefinition(root: string, options: WorkspaceInitOptions = {}): WorkspaceDefinition {
  const absoluteRoot = resolve(root);
  const slug = slugify(basename(absoluteRoot));
  const name = options.name ?? humanizeSlug(slug || "workspace");

  return {
    kind: "engagement",
    name,
    slug,
    root: absoluteRoot,
    description: options.description,
    paths: getWorkspacePaths(absoluteRoot),
  };
}

export function createDefaultWorkspaceFiles(workspace: WorkspaceDefinition): Record<string, string> {
  return {
    "README.md": ensureTrailingNewline(
      `# ${workspace.name}\n\nEngagement-scoped workspace scaffold for file-based ingest, wiki refresh, and rollup generation.`,
    ),
    "AGENTS.md": ensureTrailingNewline(`# Workspace Schema\n\nThis workspace follows the engagement-scoped starter schema used by business-ops-framework.\nKeep the workspace simple, file-based, and easy to inspect.\n\n## Workspace purpose\n\nUse this workspace to demonstrate the core loop:\n\n\`\`\`text\nraw source -> ingest -> wiki update -> later workflow output\n\`\`\`\n\n## Boundary\n\nOne workspace represents **one engagement**.\nDo not use this workspace as a multi-client or global catch-all.\n\n## Directory rules\n\n### \`raw/\`\n\nImmutable source evidence.\nDo not rewrite raw files during normal maintenance.\n\n- \`raw/meetings/\` — meeting transcripts and meeting notes\n- \`raw/technical/\` — requirements and technical reference docs\n- \`raw/communications/\` — emails, chat exports, and similar communication artifacts\n- \`raw/clients/\` — client-provided working materials\n\n### \`wiki/\`\n\nLLM-maintained memory layer.\nAll durable summaries, rollups, and derived context belong here.\n\nRequired files:\n\n- \`wiki/index.md\`\n- \`wiki/log.md\`\n- \`wiki/overview.md\`\n- \`wiki/ops/decision-log.md\`\n- \`wiki/ops/action-tracker.md\`\n- \`wiki/ops/future-work.md\`\n\nRequired page groups:\n\n- \`wiki/sources/\`\n- \`wiki/entities/\`\n- \`wiki/projects/\`\n- \`wiki/topics/\`\n\n### \`outputs/\`\n\nHuman-facing artifacts only.\nUse subfolders by output role:\n\n- \`outputs/recaps/\` — recaps and follow-up summaries\n- \`outputs/reports/\` — status reports and structured reviews\n- \`outputs/decks/\` — presentation-ready artifacts\n\n### \`admin/\`\n\nBusiness records that should stay separate from derived wiki knowledge.\n\n- \`admin/legal/\`\n- \`admin/finance/\`\n\n### \`archive/\`\n\nRetired or superseded material only.\n\n## Naming rules\n\n- use lowercase kebab-case for filenames\n- prefix source-derived files with \`YYYY-MM-DD-\` when a date is known\n- keep one source summary page per ingested source\n- prefer relative markdown links\n\n## Ingest rules for v1\n\nWhen a new source is ingested:\n\n1. validate the workspace scaffold\n2. place or copy the source into the correct \`raw/\` subfolder\n3. analyze the source once through the configured meeting analyzer\n4. persist \`wiki/sources/<source-id>.analysis.md\`\n5. render \`wiki/sources/<source-id>.md\` from the normalized structured result\n6. update \`wiki/index.md\` and \`wiki/log.md\`\n7. refresh ops pages and project/topic rollups from persisted source analyses\n\n## File update conventions\n\n- \`wiki/index.md\` uses \`${WORKSPACE_MARKERS.sources}\` as the Session 1 insertion marker\n- \`wiki/log.md\` uses \`${WORKSPACE_MARKERS.log}\` as the Session 1 insertion marker\n- ops pages may be initialized but left unpopulated until extraction exists\n\n## Evidence rule\n\nEvery durable summary or operational claim should be traceable back to a raw source file.\nWhen possible, link directly to the raw file that supports the claim.\n\n## Session 1 constraints\n\n- markdown-first\n- file-based only\n- no database\n- no vector search requirement\n- no hidden state outside the workspace files`),
    "wiki/index.md": ensureTrailingNewline(`# Index\n\n## Workspace\n- [Overview](overview.md)\n- [Log](log.md)\n\n## Sources\n${WORKSPACE_MARKERS.sources}\n\n## Projects\n_No project pages yet._\n\n## Entities\n_No entity pages yet._\n\n## Topics\n_No topic pages yet._\n\n## Ops\n- [Decision Log](ops/decision-log.md)\n- [Action Tracker](ops/action-tracker.md)\n- [Future Work](ops/future-work.md)`),
    "wiki/log.md": ensureTrailingNewline(`# Log\n\nAppend-only workspace activity log.\n\n${WORKSPACE_MARKERS.log}`),
    "wiki/overview.md": ensureTrailingNewline(`# Overview\n\nShort description of the engagement workspace.\n\n## Current focus\n- current delivery scope\n- current reporting cadence\n- current open operational concerns`),
    "wiki/ops/decision-log.md": ensureTrailingNewline(`# Decision Log\n\n${WORKSPACE_MARKERS.decisions}\n- No decisions recorded yet.`),
    "wiki/ops/action-tracker.md": ensureTrailingNewline(`# Action Tracker\n\n${WORKSPACE_MARKERS.actions}\n- No action items recorded yet.`),
    "wiki/ops/future-work.md": ensureTrailingNewline(`# Future Work\n\n${WORKSPACE_MARKERS.futureWork}\n- No future work items recorded yet.`),
  };
}

export function getRawCollectionPath(workspace: WorkspaceDefinition, kind: RawSourceKind): string {
  switch (kind) {
    case "meeting-transcript":
    case "meeting-notes":
      return workspace.paths.rawMeetings;
    case "technical-doc":
    case "requirements-doc":
    case "backlog-doc":
      return workspace.paths.rawTechnical;
    case "email-thread":
    case "chat-export":
      return workspace.paths.rawCommunications;
    case "client-artifact":
    default:
      return workspace.paths.rawClients;
  }
}

export async function initWorkspace(root: string, options: WorkspaceInitOptions = {}): Promise<WorkspaceBootstrapResult> {
  const workspace = createWorkspaceDefinition(root, options);
  const createdDirectories: string[] = [];
  const createdFiles: string[] = [];

  await mkdir(workspace.root, { recursive: true });

  for (const relativePath of REQUIRED_DIRECTORY_RELATIVE_PATHS) {
    const absolutePath = join(workspace.root, relativePath);
    const existed = await pathExists(absolutePath);

    await mkdir(absolutePath, { recursive: true });

    if (!existed) {
      createdDirectories.push(relativePath);
    }
  }

  const fileMap = createDefaultWorkspaceFiles(workspace);

  for (const [relativePath, content] of Object.entries(fileMap)) {
    const absolutePath = join(workspace.root, relativePath);
    const existed = await pathExists(absolutePath);

    if (!existed || options.overwrite) {
      await writeFile(absolutePath, ensureTrailingNewline(content), "utf8");

      if (!existed) {
        createdFiles.push(relativePath);
      }
    }
  }

  const validation = await validateWorkspace(workspace.root, options);

  return {
    workspace,
    createdDirectories,
    createdFiles,
    validation,
  };
}

export async function loadWorkspace(root: string, options: WorkspaceInitOptions = {}): Promise<WorkspaceLoadResult> {
  const validation = await validateWorkspace(root, options);
  const workspace = validation.workspace;

  return {
    workspace,
    validation,
    files: {
      agents: await readOptionalText(workspace.paths.agentsFile),
      readme: await readOptionalText(workspace.paths.readmeFile),
    },
  };
}

export async function validateWorkspace(
  root: string,
  options: WorkspaceInitOptions = {},
): Promise<WorkspaceValidationResult> {
  const workspace = createWorkspaceDefinition(root, options);
  const issues: WorkspaceValidationIssue[] = [];

  for (const relativePath of REQUIRED_DIRECTORY_RELATIVE_PATHS) {
    const absolutePath = join(workspace.root, relativePath);

    if (!(await pathExists(absolutePath))) {
      issues.push({
        severity: "error",
        path: relativePath,
        message: "Required workspace directory is missing.",
      });
    }
  }

  const fileMap = createDefaultWorkspaceFiles(workspace);

  for (const relativePath of Object.keys(fileMap)) {
    const absolutePath = join(workspace.root, relativePath);

    if (!(await pathExists(absolutePath))) {
      issues.push({
        severity: "error",
        path: relativePath,
        message: "Required workspace file is missing.",
      });
    }
  }

  if (await pathExists(workspace.paths.wikiIndexFile)) {
    const indexText = await readFile(workspace.paths.wikiIndexFile, "utf8");

    if (!indexText.includes(WORKSPACE_MARKERS.sources)) {
      issues.push({
        severity: "warning",
        path: "wiki/index.md",
        message: `Expected marker ${WORKSPACE_MARKERS.sources} was not found.`,
      });
    }
  }

  if (await pathExists(workspace.paths.wikiLogFile)) {
    const logText = await readFile(workspace.paths.wikiLogFile, "utf8");

    if (!logText.includes(WORKSPACE_MARKERS.log)) {
      issues.push({
        severity: "warning",
        path: "wiki/log.md",
        message: `Expected marker ${WORKSPACE_MARKERS.log} was not found.`,
      });
    }
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    workspace,
    issues,
  };
}
