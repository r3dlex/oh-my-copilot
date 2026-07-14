import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflowFiles = [
  ".github/workflows/ci.yml",
  ".github/workflows/ci-prek.yml",
];

describe("self-hosted CI fallback", () => {
  it.each(workflowFiles)(
    "%s makes every self-hosted job opt-in",
    (workflowFile) => {
      const workflow = readFileSync(resolve(workflowFile), "utf8");
      const jobs = [
        ...workflow.matchAll(
          /^  (_[^:\n]+-self-hosted):\n([\s\S]*?)(?=^  [A-Za-z0-9_-]+:\n|(?![\s\S]))/gm,
        ),
      ];

      expect(jobs.length).toBeGreaterThan(0);
      for (const [, name, body] of jobs) {
        expect(body, name).toMatch(
          /^[ ]{4}if: .*vars\.SELF_HOSTED_CI_ENABLED/m,
        );
      }
    },
  );
});
