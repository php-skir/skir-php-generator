#!/usr/bin/env node

import { configureComposer } from "./configure-composer.js";
import { GENERATOR_MODULE } from "./config.js";

interface CliOptions {
  readonly mod: string;
  readonly root: string;
}

async function main(): Promise<void> {
  try {
    const options = parseArguments(process.argv.slice(2));
    const result = await configureComposer(options);
    const action = result.changed ? "Added" : "Unchanged";
    const paths = typeof result.paths === "string"
      ? result.paths
      : result.paths.join(", ");

    process.stdout.write(`${action} Composer PSR-4 mapping ${result.namespace} => ${paths}\n`);
    process.stdout.write("Run composer dump-autoload to refresh Composer's autoloader.\n");
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

function parseArguments(arguments_: readonly string[]): CliOptions {
  if (arguments_[0] !== "configure-composer") {
    throw new Error("Usage: skir-php-generator configure-composer [--root <dir>] [--mod <module>]");
  }

  let root = process.cwd();
  let mod = GENERATOR_MODULE;

  for (let index = 1; index < arguments_.length; index += 1) {
    const argument = arguments_[index];

    if (argument !== "--root" && argument !== "--mod") {
      throw new Error(`Unknown argument ${argument}. Usage: skir-php-generator configure-composer [--root <dir>] [--mod <module>]`);
    }

    const value = arguments_[index + 1];

    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}.`);
    }

    if (argument === "--root") {
      root = value;
    }

    if (argument === "--mod") {
      mod = value;
    }

    index += 1;
  }

  return { mod, root };
}

void main();
