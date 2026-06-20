import { access, copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";

import type { IngestResult, RawSourceKind, WorkspaceDefinition } from "../../src/core/types";
import { ingestSource } from "../../src/modules/ingest";
import { loadPersistedMeetingAnalyses, rebuildWorkspaceWiki } from "../../src/modules/wiki";
import { getRawCollectionPath, initWorkspace } from "../../src/modules/workspace";

import { loadOptionalLocalEnv } from "./env";

const DEFAULT_TRANSCRIPT_DIR = "test/transcripts";
const DEFAULT_WORKSPACE_DIR = "test/workspace";
const DEFAULT_REPORT_BASENAME = "local-sandbox-report";
const DEFAULT_WORKSPACE_NAME = "Local Sandbox Workspace";
const DEFAULT_WORKSPACE_DESCRIPTION = "Manual local sandbox for transcript ingest, wiki review, and wiki-first Q&A.";

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".gz",
  ".tar",
  ".mp3",
  ".mp4",
  ".mov",
  ".wav",
  ".m4a",
]);

interface PredictedSource {
  inputPath: string;
  relativeInputPath: string;
  kind: RawSourceKind;
  title: string;
  slug: string;
  sourceDate: string;
  sourceId: string;
  rawAbsolutePath: string;
  rawRelativePath: string;
  summaryAbsolutePath: string;
  summaryRelativePath: string;
  analysisAbsolutePath: string;
  analysisRelativePath: string;
}

interface GeneratedReportPaths {
  html: string;
  json: string;
}

function ensureTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function toPosixPath(value: string): string {
  return value.split(sep).join("/");
}

function relativeFromRepo(repoRoot: string, absolutePath: string): string {
  return toPosixPath(relative(repoRoot, absolutePath));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linkFromReport(reportPath: string, targetPath: string): string {
  return toPosixPath(relative(dirname(reportPath), targetPath));
}

function stripExtension(filename: string): string {
  const extension = extname(filename);
  return extension ? filename.slice(0, -extension.length) : filename;
}

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

function normalizeBaseName(inputPath: string): string {
  return stripExtension(basename(inputPath)).replace(/^(20\d{2}-\d{2}-\d{2})[-_]?/, "");
}

function inferSourceDate(inputPath: string): string | undefined {
  return inputPath.match(/(20\d{2}-\d{2}-\d{2})/)?.[1];
}

function inferSandboxKind(inputPath: string): RawSourceKind {
  const normalized = toPosixPath(inputPath).toLowerCase();

  if (normalized.includes("notes")) {
    return "meeting-notes";
  }

  return "meeting-transcript";
}

function isLikelyTextFile(path: string): boolean {
  return !BINARY_EXTENSIONS.has(extname(path).toLowerCase());
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function listVisibleFiles(root: string): Promise<string[]> {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = resolve(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listVisibleFiles(absolutePath)));
      continue;
    }

    files.push(absolutePath);
  }

  return files.sort();
}

function looksLikeTranscriptFixture(path: string): boolean {
  const filename = basename(path).toLowerCase();
  return filename.endsWith("-transcript.txt") || (filename.includes("transcript") && filename.endsWith(".txt"));
}

function companionStem(path: string): string {
  return stripExtension(basename(path))
    .replace(/[-_ ]summary$/i, "")
    .replace(/[-_ ]transcript$/i, "")
    .trim()
    .toLowerCase();
}

function selectSandboxInputs(files: string[]): { selectedFiles: string[]; skippedCompanionFiles: string[] } {
  const transcriptCompanionStems = new Set(files.filter(looksLikeTranscriptFixture).map(companionStem));
  const selectedFiles: string[] = [];
  const skippedCompanionFiles: string[] = [];

  for (const file of files) {
    const baseName = stripExtension(basename(file));
    const isSummaryCompanion = /[-_ ]summary$/i.test(baseName);

    if (isSummaryCompanion && transcriptCompanionStems.has(companionStem(file))) {
      skippedCompanionFiles.push(file);
      continue;
    }

    selectedFiles.push(file);
  }

  return {
    selectedFiles: selectedFiles.sort(),
    skippedCompanionFiles: skippedCompanionFiles.sort(),
  };
}

async function seedTranscriptDirectory(repoRoot: string, transcriptDir: string): Promise<string[]> {
  const existingFiles = await listVisibleFiles(transcriptDir);

  if (existingFiles.length > 0) {
    return [];
  }

  const legacyTranscriptDir = resolve(repoRoot, "tests", "transcripts");

  if (!(await pathExists(legacyTranscriptDir))) {
    return [];
  }

  const legacyFiles = (await listVisibleFiles(legacyTranscriptDir)).filter(isLikelyTextFile);
  const preferredFiles = legacyFiles.filter(looksLikeTranscriptFixture);
  const selectedFiles = (preferredFiles.length > 0 ? preferredFiles : legacyFiles).sort();
  const seededFiles: string[] = [];

  await mkdir(transcriptDir, { recursive: true });

  for (const file of selectedFiles) {
    const destinationPath = resolve(transcriptDir, basename(file));

    if (await pathExists(destinationPath)) {
      continue;
    }

    await copyFile(file, destinationPath);
    seededFiles.push(destinationPath);
  }

  return seededFiles.sort();
}

async function buildExistingSourceDateMap(workspace: WorkspaceDefinition): Promise<Map<string, string>> {
  const existingSourceDates = new Map<string, string>();

  if (!(await pathExists(workspace.paths.wikiSources))) {
    return existingSourceDates;
  }

  const files = (await readdir(workspace.paths.wikiSources)).filter((file) => file.endsWith(".analysis.md")).sort();

  for (const file of files) {
    const sourceId = file.replace(/\.analysis\.md$/, "");
    const match = sourceId.match(/^(20\d{2}-\d{2}-\d{2})-(.+)$/);

    if (!match) {
      continue;
    }

    const [, sourceDate, slug] = match;

    if (!existingSourceDates.has(slug)) {
      existingSourceDates.set(slug, sourceDate);
    }
  }

  return existingSourceDates;
}

function predictSource(
  repoRoot: string,
  workspace: WorkspaceDefinition,
  inputPath: string,
  existingSourceDates: Map<string, string>,
  fallbackSourceDate: string,
): PredictedSource {
  const absoluteInputPath = resolve(inputPath);
  const kind = inferSandboxKind(absoluteInputPath);
  const normalizedBaseName = normalizeBaseName(absoluteInputPath);
  const title = humanizeSlug(normalizedBaseName || "source");
  const slug = slugify(title || normalizedBaseName || "source");
  const sourceDate = inferSourceDate(absoluteInputPath) ?? existingSourceDates.get(slug) ?? fallbackSourceDate;
  const sourceId = `${sourceDate}-${slug}`;
  const extension = extname(absoluteInputPath) || ".md";
  const rawAbsolutePath = resolve(join(getRawCollectionPath(workspace, kind), `${sourceId}${extension}`));
  const summaryRelativePath = `wiki/sources/${sourceId}.md`;
  const analysisRelativePath = `wiki/sources/${sourceId}.analysis.md`;

  return {
    inputPath: absoluteInputPath,
    relativeInputPath: relativeFromRepo(repoRoot, absoluteInputPath),
    kind,
    title,
    slug,
    sourceDate,
    sourceId,
    rawAbsolutePath,
    rawRelativePath: toPosixPath(relative(workspace.root, rawAbsolutePath)),
    summaryAbsolutePath: resolve(workspace.root, summaryRelativePath),
    summaryRelativePath,
    analysisAbsolutePath: resolve(workspace.root, analysisRelativePath),
    analysisRelativePath,
  };
}

async function canSkipIngest(prediction: PredictedSource): Promise<boolean> {
  if (!(await pathExists(prediction.rawAbsolutePath)) || !(await pathExists(prediction.analysisAbsolutePath))) {
    return false;
  }

  const [inputContent, stagedRawContent] = await Promise.all([
    readFile(prediction.inputPath, "utf8"),
    readFile(prediction.rawAbsolutePath, "utf8"),
  ]);

  return inputContent === stagedRawContent;
}

function hasConfiguredMeetingAnalyzer(): boolean {
  const apiKey = process.env.MEETING_ANALYZER_API_KEY ?? process.env.OPENAI_API_KEY;
  const model = process.env.MEETING_ANALYZER_MODEL ?? process.env.OPENAI_MODEL;
  return Boolean(apiKey && model);
}

async function readOptionalText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return undefined;
  }
}

async function renderLinkedPage(reportPath: string, title: string, targetPath: string): Promise<string> {
  const content = await readOptionalText(targetPath);

  if (!content) {
    return "";
  }

  return `
    <section class="panel">
      <h2>${escapeHtml(title)}</h2>
      <p class="muted"><a href="${escapeHtml(linkFromReport(reportPath, targetPath))}">${escapeHtml(toPosixPath(targetPath))}</a></p>
      <pre>${escapeHtml(content)}</pre>
    </section>`;
}

async function renderExpandableLinkedPage(reportPath: string, title: string, targetPath: string): Promise<string> {
  const content = await readOptionalText(targetPath);

  if (!content) {
    return "";
  }

  return `
    <section class="panel">
      <details>
        <summary><strong>${escapeHtml(title)}</strong> <span class="muted">(${escapeHtml(toPosixPath(targetPath))})</span></summary>
        <p class="muted"><a href="${escapeHtml(linkFromReport(reportPath, targetPath))}">${escapeHtml(toPosixPath(targetPath))}</a></p>
        <pre>${escapeHtml(content)}</pre>
      </details>
    </section>`;
}

async function writeLocalSandboxReport(options: {
  repoRoot: string;
  transcriptDir: string;
  workspace: WorkspaceDefinition;
  seededFiles: string[];
  scannedFiles: string[];
  skippedPredictions: PredictedSource[];
  ingestResults: IngestResult[];
}): Promise<GeneratedReportPaths> {
  const { repoRoot, transcriptDir, workspace, seededFiles, scannedFiles, skippedPredictions, ingestResults } = options;
  const analyses = await loadPersistedMeetingAnalyses(workspace);
  const reportHtmlPath = resolve(workspace.paths.outputsReports, `${DEFAULT_REPORT_BASENAME}.html`);
  const reportJsonPath = resolve(workspace.paths.outputsReports, `${DEFAULT_REPORT_BASENAME}.json`);
  const projectFiles = (await readdir(workspace.paths.wikiProjects)).filter((file) => file.endsWith(".md")).sort();
  const topicFiles = (await readdir(workspace.paths.wikiTopics)).filter((file) => file.endsWith(".md")).sort();
  const sourceRows = analyses
    .map((analysis) => {
      const sourceId = analysis.sourceSummary.sourceId;
      const sourceIngestResult = ingestResults.find((result) => result.source.id === sourceId);
      const skippedPrediction = skippedPredictions.find((prediction) => prediction.sourceId === sourceId);
      const status = sourceIngestResult ? "ingested" : skippedPrediction ? "skipped (unchanged)" : "present";
      const summaryPath = resolve(workspace.root, `wiki/sources/${sourceId}.md`);
      const analysisPath = resolve(workspace.root, `wiki/sources/${sourceId}.analysis.md`);
      const rawPath = resolve(workspace.root, analysis.sourceSummary.rawPath);

      return `
        <tr>
          <td>${escapeHtml(analysis.sourceSummary.title)}</td>
          <td><code>${escapeHtml(sourceId)}</code></td>
          <td>${escapeHtml(status)}</td>
          <td><a href="${escapeHtml(linkFromReport(reportHtmlPath, rawPath))}">${escapeHtml(analysis.sourceSummary.rawPath)}</a></td>
          <td><a href="${escapeHtml(linkFromReport(reportHtmlPath, summaryPath))}">wiki/sources/${escapeHtml(sourceId)}.md</a></td>
          <td><a href="${escapeHtml(linkFromReport(reportHtmlPath, analysisPath))}">wiki/sources/${escapeHtml(sourceId)}.analysis.md</a></td>
        </tr>`;
    })
    .join("");

  const sourceSummarySections = await Promise.all(
    analyses.map((analysis) =>
      renderLinkedPage(
        reportHtmlPath,
        `Source Summary — ${analysis.sourceSummary.title}`,
        resolve(workspace.root, `wiki/sources/${analysis.sourceSummary.sourceId}.md`),
      ),
    ),
  );

  const analysisArtifactSections = await Promise.all(
    analyses.map((analysis) =>
      renderExpandableLinkedPage(
        reportHtmlPath,
        `Analysis Artifact — ${analysis.sourceSummary.title}`,
        resolve(workspace.root, `wiki/sources/${analysis.sourceSummary.sourceId}.analysis.md`),
      ),
    ),
  );

  const projectSections = await Promise.all(
    projectFiles.map((file) => renderLinkedPage(reportHtmlPath, `Project Rollup — ${stripExtension(file)}`, resolve(workspace.paths.wikiProjects, file))),
  );
  const topicSections = await Promise.all(
    topicFiles.map((file) => renderLinkedPage(reportHtmlPath, `Topic Rollup — ${stripExtension(file)}`, resolve(workspace.paths.wikiTopics, file))),
  );
  const opsSections = await Promise.all([
    renderLinkedPage(reportHtmlPath, "Wiki Index", workspace.paths.wikiIndexFile),
    renderLinkedPage(reportHtmlPath, "Wiki Log", workspace.paths.wikiLogFile),
    renderLinkedPage(reportHtmlPath, "Overview", workspace.paths.wikiOverviewFile),
    renderLinkedPage(reportHtmlPath, "Decision Log", workspace.paths.wikiDecisionLogFile),
    renderLinkedPage(reportHtmlPath, "Action Tracker", workspace.paths.wikiActionTrackerFile),
    renderLinkedPage(reportHtmlPath, "Future Work", workspace.paths.wikiFutureWorkFile),
  ]);

  const entryPoints = [
    workspace.paths.wikiIndexFile,
    workspace.paths.wikiLogFile,
    workspace.paths.wikiOverviewFile,
    workspace.paths.wikiDecisionLogFile,
    workspace.paths.wikiActionTrackerFile,
    workspace.paths.wikiFutureWorkFile,
  ];
  const reportJson = {
    generatedAt: new Date().toISOString(),
    transcriptDir: relativeFromRepo(repoRoot, transcriptDir),
    workspaceRoot: relativeFromRepo(repoRoot, workspace.root),
    reportHtmlPath: relativeFromRepo(repoRoot, reportHtmlPath),
    reportJsonPath: relativeFromRepo(repoRoot, reportJsonPath),
    seededFiles: seededFiles.map((path) => relativeFromRepo(repoRoot, path)),
    scannedFiles: scannedFiles.map((path) => relativeFromRepo(repoRoot, path)),
    ingestedSources: ingestResults.map((result) => ({
      sourceId: result.source.id,
      title: result.source.title,
      rawPath: result.source.rawPath,
      summaryPath: result.source.summaryPath,
      analysisPath: result.source.analysisPath,
    })),
    skippedSources: skippedPredictions.map((prediction) => ({
      sourceId: prediction.sourceId,
      title: prediction.title,
      inputPath: prediction.relativeInputPath,
      rawPath: prediction.rawRelativePath,
      summaryPath: prediction.summaryRelativePath,
      analysisPath: prediction.analysisRelativePath,
    })),
    entryPoints: entryPoints.map((path) => relativeFromRepo(repoRoot, path)),
    projectPages: projectFiles.map((file) => `wiki/projects/${file}`),
    topicPages: topicFiles.map((file) => `wiki/topics/${file}`),
    sourceCount: analyses.length,
  };

  await writeFile(reportJsonPath, `${JSON.stringify(reportJson, null, 2)}\n`, "utf8");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Local Sandbox Report</title>
  <style>
    :root {
      --bg: #0b1020;
      --panel: #121933;
      --panel-2: #0f1630;
      --text: #ecf2ff;
      --muted: #9fb0d1;
      --accent: #7cc4ff;
      --good: #7fe3a1;
      --border: #263152;
      --code: #0a1126;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    a { color: var(--accent); }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }
    h1, h2, h3 { line-height: 1.2; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 18px;
      overflow: hidden;
    }
    .metric {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 8px 0 2px;
    }
    .good { color: var(--good); }
    .muted { color: var(--muted); }
    code {
      background: var(--code);
      border-radius: 6px;
      padding: 2px 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      background: var(--code);
      border-radius: 10px;
      padding: 14px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }
    th, td {
      border-bottom: 1px solid var(--border);
      padding: 10px 8px;
      text-align: left;
      vertical-align: top;
    }
    th { color: var(--muted); }
    ul { margin: 10px 0 0; }
    details summary { cursor: pointer; }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <h1>Local Sandbox Report</h1>
      <p class="muted">Generated from <code>${escapeHtml(relativeFromRepo(repoRoot, transcriptDir))}</code> into <code>${escapeHtml(relativeFromRepo(repoRoot, workspace.root))}</code>.</p>
      <p class="muted">Use <code>npm run sandbox:ask -- \"your question\"</code> to answer questions from generated wiki artifacts only.</p>
    </section>

    <section class="grid">
      <div class="panel">
        <div class="muted">Transcript files scanned</div>
        <div class="metric">${scannedFiles.length}</div>
      </div>
      <div class="panel">
        <div class="muted">Sources analyzed this run</div>
        <div class="metric good">${ingestResults.length}</div>
      </div>
      <div class="panel">
        <div class="muted">Skipped as unchanged</div>
        <div class="metric">${skippedPredictions.length}</div>
      </div>
      <div class="panel">
        <div class="muted">Generated source pages</div>
        <div class="metric">${analyses.length}</div>
      </div>
      <div class="panel">
        <div class="muted">Project rollups</div>
        <div class="metric">${projectFiles.length}</div>
      </div>
      <div class="panel">
        <div class="muted">Topic rollups</div>
        <div class="metric">${topicFiles.length}</div>
      </div>
    </section>

    <section class="panel">
      <h2>Main wiki entry points</h2>
      <ul>
        ${entryPoints
          .map(
            (path) =>
              `<li><a href="${escapeHtml(linkFromReport(reportHtmlPath, path))}">${escapeHtml(relativeFromRepo(repoRoot, path))}</a></li>`,
          )
          .join("")}
      </ul>
    </section>

    <section class="panel">
      <h2>Run details</h2>
      <ul>
        <li>Seeded sample transcripts: ${seededFiles.length > 0 ? seededFiles.map((path) => `<code>${escapeHtml(relativeFromRepo(repoRoot, path))}</code>`).join(", ") : "none"}</li>
        <li>Scanned transcript files: ${scannedFiles.length > 0 ? scannedFiles.map((path) => `<code>${escapeHtml(relativeFromRepo(repoRoot, path))}</code>`).join(", ") : "none"}</li>
        <li>Skipped unchanged inputs: ${skippedPredictions.length > 0 ? skippedPredictions.map((prediction) => `<code>${escapeHtml(prediction.relativeInputPath)}</code>`).join(", ") : "none"}</li>
        <li>Machine-readable report: <a href="${escapeHtml(linkFromReport(reportHtmlPath, reportJsonPath))}">${escapeHtml(relativeFromRepo(repoRoot, reportJsonPath))}</a></li>
      </ul>
    </section>

    <section class="panel">
      <h2>Generated sources</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Source ID</th>
            <th>Status</th>
            <th>Raw</th>
            <th>Summary</th>
            <th>Analysis</th>
          </tr>
        </thead>
        <tbody>
          ${sourceRows || '<tr><td colspan="6">No sources have been analyzed yet.</td></tr>'}
        </tbody>
      </table>
    </section>

    ${opsSections.join("\n")}
    ${projectSections.join("\n")}
    ${topicSections.join("\n")}
    ${sourceSummarySections.join("\n")}
    ${analysisArtifactSections.join("\n")}
  </main>
</body>
</html>`;

  await writeFile(reportHtmlPath, ensureTrailingNewline(html), "utf8");

  return {
    html: reportHtmlPath,
    json: reportJsonPath,
  };
}

async function main(): Promise<void> {
  const repoRoot = resolve(process.cwd());
  await loadOptionalLocalEnv(repoRoot);
  const mode = process.argv[2] === "init" ? "init" : "run";
  const force = process.argv.includes("--force");
  const seedSamples = process.argv.includes("--seed-samples");
  const transcriptDir = resolve(repoRoot, DEFAULT_TRANSCRIPT_DIR);
  const workspaceRoot = resolve(repoRoot, DEFAULT_WORKSPACE_DIR);

  await mkdir(transcriptDir, { recursive: true });

  const seededFiles = seedSamples ? await seedTranscriptDirectory(repoRoot, transcriptDir) : [];
  const bootstrap = await initWorkspace(workspaceRoot, {
    name: DEFAULT_WORKSPACE_NAME,
    description: DEFAULT_WORKSPACE_DESCRIPTION,
  });

  if (mode === "init") {
    console.log(
      JSON.stringify(
        {
          mode,
          transcriptDir: relativeFromRepo(repoRoot, transcriptDir),
          workspaceRoot: relativeFromRepo(repoRoot, workspaceRoot),
          seededFiles: seededFiles.map((path) => relativeFromRepo(repoRoot, path)),
          createdDirectories: bootstrap.createdDirectories,
          createdFiles: bootstrap.createdFiles,
          next: [
            "npm run sandbox",
            'npm run sandbox:init -- --seed-samples',
            'npm run sandbox:ask -- "What changed?"',
          ],
        },
        null,
        2,
      ),
    );
    return;
  }

  const discoveredTranscriptFiles = (await listVisibleFiles(transcriptDir)).filter(isLikelyTextFile).sort();
  const { selectedFiles: transcriptFiles, skippedCompanionFiles } = selectSandboxInputs(discoveredTranscriptFiles);
  const workspace = bootstrap.workspace;
  const fallbackSourceDate = new Date().toISOString().slice(0, 10);
  const existingSourceDates = await buildExistingSourceDateMap(workspace);
  const skippedPredictions: PredictedSource[] = [];
  const pendingPredictions: PredictedSource[] = [];

  for (const file of transcriptFiles) {
    const prediction = predictSource(repoRoot, workspace, file, existingSourceDates, fallbackSourceDate);
    existingSourceDates.set(prediction.slug, prediction.sourceDate);

    if (!force && (await canSkipIngest(prediction))) {
      skippedPredictions.push(prediction);
      continue;
    }

    pendingPredictions.push(prediction);
  }

  if (pendingPredictions.length > 0 && !hasConfiguredMeetingAnalyzer()) {
    console.error(
      JSON.stringify(
        {
          error: "missing_meeting_analyzer_env",
          message:
            "No meeting analyzer was configured. Set MEETING_ANALYZER_API_KEY and MEETING_ANALYZER_MODEL before running npm run sandbox.",
          detectedFiles: discoveredTranscriptFiles.map((path) => relativeFromRepo(repoRoot, path)),
          selectedFiles: transcriptFiles.map((path) => relativeFromRepo(repoRoot, path)),
          ignoredCompanionFiles: skippedCompanionFiles.map((path) => relativeFromRepo(repoRoot, path)),
          pendingSourceIds: pendingPredictions.map((prediction) => prediction.sourceId),
          requiredEnv: ["MEETING_ANALYZER_API_KEY", "MEETING_ANALYZER_MODEL"],
          optionalEnv: [
            "MEETING_ANALYZER_BASE_URL",
            "MEETING_ANALYZER_PROVIDER",
            "MEETING_ANALYZER_ID",
            "MEETING_ANALYZER_PROMPT_VERSION",
          ],
        },
        null,
        2,
      ),
    );
    throw new Error(
      "No meeting analyzer was configured. Set MEETING_ANALYZER_API_KEY and MEETING_ANALYZER_MODEL before running npm run sandbox.",
    );
  }

  const ingestResults: IngestResult[] = [];

  for (const prediction of pendingPredictions) {
    ingestResults.push(
      await ingestSource({
        workspaceRoot,
        inputPath: prediction.inputPath,
        kind: prediction.kind,
        title: prediction.title,
        sourceDate: prediction.sourceDate,
      }),
    );
  }

  const wikiMutation = await rebuildWorkspaceWiki(workspace);
  const reportPaths = await writeLocalSandboxReport({
    repoRoot,
    transcriptDir,
    workspace,
    seededFiles,
    scannedFiles: transcriptFiles,
    skippedPredictions,
    ingestResults,
  });
  const analyses = await loadPersistedMeetingAnalyses(workspace);

  console.log(
    JSON.stringify(
      {
        mode,
        transcriptDir: relativeFromRepo(repoRoot, transcriptDir),
        workspaceRoot: relativeFromRepo(repoRoot, workspaceRoot),
        seededFiles: seededFiles.map((path) => relativeFromRepo(repoRoot, path)),
        detectedFiles: discoveredTranscriptFiles.map((path) => relativeFromRepo(repoRoot, path)),
        scannedFiles: transcriptFiles.map((path) => relativeFromRepo(repoRoot, path)),
        ignoredCompanionFiles: skippedCompanionFiles.map((path) => relativeFromRepo(repoRoot, path)),
        ingestedSourceIds: ingestResults.map((result) => result.source.id),
        skippedSourceIds: skippedPredictions.map((prediction) => prediction.sourceId),
        reportHtmlPath: relativeFromRepo(repoRoot, reportPaths.html),
        reportJsonPath: relativeFromRepo(repoRoot, reportPaths.json),
        mainEntryPoints: [
          workspace.paths.wikiIndexFile,
          workspace.paths.wikiLogFile,
          workspace.paths.wikiOverviewFile,
          workspace.paths.wikiDecisionLogFile,
          workspace.paths.wikiActionTrackerFile,
          workspace.paths.wikiFutureWorkFile,
        ].map((path) => relativeFromRepo(repoRoot, path)),
        projectPages: (await readdir(workspace.paths.wikiProjects))
          .filter((file) => file.endsWith(".md"))
          .sort()
          .map((file) => `test/workspace/wiki/projects/${file}`),
        topicPages: (await readdir(workspace.paths.wikiTopics))
          .filter((file) => file.endsWith(".md"))
          .sort()
          .map((file) => `test/workspace/wiki/topics/${file}`),
        sourcePages: analyses.map((analysis) => `test/workspace/wiki/sources/${analysis.sourceSummary.sourceId}.md`),
        analysisArtifacts: analyses.map((analysis) => `test/workspace/wiki/sources/${analysis.sourceSummary.sourceId}.analysis.md`),
        createdFiles: uniqueSorted([
          ...bootstrap.createdFiles,
          ...ingestResults.flatMap((result) => result.createdFiles),
          ...wikiMutation.createdFiles,
        ]),
        updatedFiles: uniqueSorted([
          ...ingestResults.flatMap((result) => result.updatedFiles),
          ...wikiMutation.updatedFiles,
        ]),
        next: [
          'npm run sandbox',
          'npm run sandbox -- --force',
          'npm run sandbox:init -- --seed-samples',
          'npm run sandbox:ask -- "What changed?"',
        ],
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
