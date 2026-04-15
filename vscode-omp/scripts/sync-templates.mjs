import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(scriptDir);
const repoRoot = dirname(packageRoot);
const templateRoot = join(packageRoot, "resources", "templates");

const mappings = [
  {
    source: join(repoRoot, ".copilot"),
    target: join(templateRoot, ".copilot"),
    description: "Copilot conventions",
  },
  {
    source: join(repoRoot, ".github", "hooks"),
    target: join(templateRoot, ".github", "hooks"),
    description: "Hook entrypoints",
  },
];

rmSync(templateRoot, { recursive: true, force: true });
mkdirSync(templateRoot, { recursive: true });

for (const mapping of mappings) {
  if (!existsSync(mapping.source)) {
    throw new Error(`Missing template source: ${mapping.source}`);
  }

  mkdirSync(dirname(mapping.target), { recursive: true });
  cpSync(mapping.source, mapping.target, { recursive: true });
}

writeFileSync(
  join(templateRoot, "manifest.json"),
  JSON.stringify(
    {
      mappings: mappings.map((mapping) => ({
        description: mapping.description,
        source: relative(repoRoot, mapping.source),
        target: relative(templateRoot, mapping.target),
      })),
    },
    null,
    2,
  ),
);

console.log(`Synced ${mappings.length} template groups into ${relative(packageRoot, templateRoot)}`);
