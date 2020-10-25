//

import {
  Zatlin
} from "../source/class";


function repeat(zatlin: Zatlin, count: number, ...predicates: Array<(output: string) => unknown>): void {
  for (let i = 0 ; i < count ; i ++) {
    let output = zatlin.generate();
    let results = predicates.map((predicate) => !!predicate(output));
    expect(results).not.toContain(false);
  }
}

describe("normal", () => {
  test("simple", () => {
    let zatlin = Zatlin.load(`
      % "a" | "b" | "c";
    `);
    repeat(zatlin, 20,
      (output) => output === "a" || output === "b" || output === "c"
    );
  });
  test("simple with exclusion", () => {
    let zatlin = Zatlin.load(`
      % "a" | "b" | "c" - "b";
    `);
    repeat(zatlin, 20,
      (output) => output === "a" || output === "c",
      (output) => output !== "b"
    );
  });
  test("simple with circumflex", () => {
    let zatlin = Zatlin.load(`
      % "aa" | "ab" | "ba" | "bb" - ^ "b" | "a" ^;
    `);
    repeat(zatlin, 20,
      (output) => output === "ab"
    );
  });
  test("zero probability", () => {
    let zatlin = Zatlin.load(`
      % "a" 2 | "b" 0 | "c" 3;
    `);
    repeat(zatlin, 20,
      (output) => output === "a" || output === "c",
      (output) => output !== "b"
    );
  });
  test("identifier", () => {
    let zatlin = Zatlin.load(`
      char = "a" | "b" | "c";
      % char;
    `);
    repeat(zatlin, 20,
      (output) => output === "a" || output === "b" || output === "c"
    );
  });
  test("comment", () => {
    let zatlin = Zatlin.load(`
      char = "a" | "b" | "c"#comment
      # comment
      % char;  # comment
    `);
    repeat(zatlin, 20,
      (output) => output === "a" || output === "b" || output === "c"
    );
  });
  test("complex 1", () => {
    let zatlin = Zatlin.load(`
      vowel = "a" | "e" | "i" | "o" | "u";
      cons = "s" | "t" | "k";
      % cons vowel cons;
    `);
    repeat(zatlin, 50,
      (output) => output.length === 3,
      (output) => output.match(/^[stk][aeiou][stk]$/)
    );
  });
  test("complex 2", () => {
    let zatlin = Zatlin.load(`
      semivowel = "y" | "w";
      cons = "s" | "z" | semivowel 2;
      vowel = "a" | "e" | "i" | "o" | "u";
      % cons cons vowel cons - semivowel "i" | "y" ^;
    `);
    repeat(zatlin, 50,
      (output) => output.length === 4,
      (output) => !output.includes("yi") && !output.includes("wi"),
      (output) => !output.endsWith("y")
    );
  });
  test("complex 3", () => {
    let zatlin = Zatlin.load(`
      vowel = "a" | "e" | "i" | "o" | "u";
      cons = "s" | "z" | "t" | "d" | "k" | "g";
      pattern = ("s" | "t" | "k") ("y" | "") vowel (vowel - "a" | "o") cons;
      % pattern - ^ "k" "y";
    `);
    repeat(zatlin, 50,
      (output) => output.length === 5 || output.length === 4,
      (output) => output[output.length - 2].match(/^[eiu]$/),
      (output) => !output.startsWith("ky")
    );
  });
});

describe("errors", () => {
  test("unresolved identifier", () => {
    expect.assertions(2);
    try {
      let zatlin = Zatlin.load(`
        foo = bar | undefined;
        bar = "a" | "b";
        % foo;
      `);
    } catch (error) {
      expect(error.name).toBe("ZatlinError");
      expect(error.code).toBe(1000);
    }
  });
});