import { z } from "zod";

export const GENERATOR_MODULE = "skir-php-generator";
export const DEFAULT_NAMESPACE = "Skir";

export const GeneratorConfig = z.strictObject({
  namespace: z.string().default(DEFAULT_NAMESPACE),
});

export type GeneratorConfig = z.infer<typeof GeneratorConfig>;
