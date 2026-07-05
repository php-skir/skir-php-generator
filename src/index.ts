import { type CodeGenerator } from "skir-internal";
import { z } from "zod";

import { generatePhpFiles } from "./generator.js";

const Config = z.strictObject({
  namespace: z.string().default("App\\Skir"),
});

type Config = z.infer<typeof Config>;

class PhpGenerator implements CodeGenerator<Config> {
  readonly id = "skir-php-generator";
  readonly configType = Config;

  generateCode(input: CodeGenerator.Input<Config>): CodeGenerator.Output {
    return {
      files: generatePhpFiles(input),
    };
  }
}

export const GENERATOR = new PhpGenerator();

export { generatePhpFiles };

