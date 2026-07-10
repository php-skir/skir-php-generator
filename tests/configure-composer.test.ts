import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { configureComposer } from "../src/configure-composer.js";

const projectPaths: string[] = [];

function createProject(): string {
  const projectPath = mkdtempSync(join(tmpdir(), "skir-composer-config-"));
  projectPaths.push(projectPath);

  return projectPath;
}

function writeSkirConfig(projectPath: string, lines: readonly string[] = [
  "generators:",
  "  - mod: skir-php-generator",
  "    outDir: generated/skirout",
  "",
]): void {
  writeFileSync(join(projectPath, "skir.yml"), lines.join("\n"));
}

afterEach(() => {
  for (const projectPath of projectPaths.splice(0)) {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

describe("configureComposer", () => {
  it("reports a missing composer.json", async () => {
    const projectPath = createProject();
    writeSkirConfig(projectPath);

    await expect(configureComposer({ root: projectPath }))
      .rejects.toThrow(/composer\.json.*not found/i);
  });

  it("reports a missing skir.yml", async () => {
    const projectPath = createProject();
    writeFileSync(join(projectPath, "composer.json"), "{}\n");

    await expect(configureComposer({ root: projectPath }))
      .rejects.toThrow(/skir\.yml.*not found/i);
  });

  it("requires every generated output directory to exist", async () => {
    const projectPath = createProject();
    writeSkirConfig(projectPath, [
      "generators:",
      "  - mod: skir-php-generator",
      "    outDir:",
      "      - generated/primary",
      "      - generated/fallback",
      "",
    ]);
    writeFileSync(join(projectPath, "composer.json"), "{}\n");
    mkdirSync(join(projectPath, "generated", "primary"), { recursive: true });

    await expect(configureComposer({ root: projectPath }))
      .rejects.toThrow(/generated\/fallback.*does not exist/i);
  });

  it("adds the default mapping atomically and is idempotent", async () => {
    const projectPath = createProject();
    writeSkirConfig(projectPath);
    mkdirSync(join(projectPath, "generated", "skirout"), { recursive: true });
    writeFileSync(join(projectPath, "composer.json"), '{\n  "require": {}\n}\n');

    const added = await configureComposer({ root: projectPath });
    const afterAdded = readFileSync(join(projectPath, "composer.json"), "utf8");
    const unchanged = await configureComposer({ root: projectPath });

    expect(added).toMatchObject({
      changed: true,
      namespace: "Skir\\",
      paths: "generated/skirout/",
    });
    expect(unchanged.changed).toBe(false);
    expect(readFileSync(join(projectPath, "composer.json"), "utf8")).toBe(afterAdded);
    expect(JSON.parse(afterAdded).autoload["psr-4"]["Skir\\"])
      .toBe("generated/skirout/");
  });

  it("does not write composer.json when the namespace conflicts", async () => {
    const projectPath = createProject();
    const source = '{\n  "autoload": {"psr-4": {"Skir\\\\": "src/"}}\n}\n';
    writeSkirConfig(projectPath);
    mkdirSync(join(projectPath, "generated", "skirout"), { recursive: true });
    writeFileSync(join(projectPath, "composer.json"), source);

    await expect(configureComposer({ root: projectPath })).rejects.toThrow(/conflict/i);
    expect(readFileSync(join(projectPath, "composer.json"), "utf8")).toBe(source);
  });

  it("rejects output directories that escape the project root", async () => {
    const projectPath = createProject();
    writeSkirConfig(projectPath, [
      "generators:",
      "  - mod: skir-php-generator",
      "    outDir: ../outside",
      "",
    ]);
    writeFileSync(join(projectPath, "composer.json"), "{}\n");

    await expect(configureComposer({ root: projectPath }))
      .rejects.toThrow(/escapes.*root/i);
  });

  it("reports invalid generator configuration", async () => {
    const projectPath = createProject();
    writeSkirConfig(projectPath, [
      "generators:",
      "  - mod: another-generator",
      "    outDir: generated/skirout",
      "",
    ]);
    writeFileSync(join(projectPath, "composer.json"), "{}\n");

    await expect(configureComposer({ root: projectPath }))
      .rejects.toThrow(/generator.*skir-php-generator.*not found/i);
  });
});
