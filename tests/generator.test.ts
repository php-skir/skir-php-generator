import { describe, expect, it } from "vitest";

import { generatePhpFiles } from "../src/generator.js";

describe("generatePhpFiles", () => {
  it("generates a PHP readonly class for a Skir struct", () => {
    const files = generatePhpFiles({
      config: {
        namespace: "App\\Skir",
      },
      modules: [
        {
          path: "user.skir",
          records: [
            {
              kind: "struct",
              name: "User",
              fields: [
                { kind: "field", name: "user_id", number: 0, type: { kind: "int32" } },
                { kind: "removed", number: 1 },
                { kind: "field", name: "name", number: 2, type: { kind: "string" } },
              ],
            },
          ],
        },
      ],
    });

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe("User.php");
    expect(files[0]?.code).toContain("namespace App\\Skir;");
    expect(files[0]?.code).toContain("final readonly class User");
    expect(files[0]?.code).toContain("public int $userId");
    expect(files[0]?.code).toContain("public string $name");
    expect(files[0]?.code).toContain("Field::removed(1)");
    expect(files[0]?.code).toContain("DenseJson::toJson(self::skirType(), $this->toArray())");
  });

  it("generates a PHP readonly class for a Skir enum", () => {
    const files = generatePhpFiles({
      config: {
        namespace: "App\\Skir",
      },
      modules: [
        {
          path: "subscription-status.skir",
          records: [
            {
              recordType: "enum",
              name: "SubscriptionStatus",
              fields: [
                { kind: "field", name: "free", number: 1 },
                { kind: "field", name: "premium_since", number: 2, type: { kind: "timestamp" } },
              ],
              removedNumbers: [3],
            },
          ],
        },
      ],
    });

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe("SubscriptionStatus.php");
    expect(files[0]?.code).toContain("final readonly class SubscriptionStatus");
    expect(files[0]?.code).toContain("public static function free(): self");
    expect(files[0]?.code).toContain("public static function premiumSince(int $value): self");
    expect(files[0]?.code).toContain("Variant::constant('free', 1)");
    expect(files[0]?.code).toContain("Variant::wrapper('premium_since', 2, Type::timestamp())");
    expect(files[0]?.code).toContain("EnumValue::wrapper('premium_since', $value)");
  });
});
