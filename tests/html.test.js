import { describe, expect, it } from "@jest/globals";
import { encodeHTML } from "../src/common/html.js";

describe("Test html.js", () => {
  it("should test encodeHTML", () => {
    expect(encodeHTML(`<html>hello world<,.#4^&^@%!))`)).toBe(
      "&lt;html&gt;hello world&lt;,.#4^&amp;^@%!))",
    );
  });

  it("should escape double quotes", () => {
    expect(encodeHTML('a"b')).toBe("a&quot;b");
  });

  it("should escape single quotes", () => {
    expect(encodeHTML("a'b")).toBe("a&#39;b");
  });

  it("should escape XSS payloads", () => {
    expect(encodeHTML('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("should escape event handler attributes", () => {
    expect(encodeHTML('onload="alert(1)"')).toBe("onload=&quot;alert(1)&quot;");
  });
});
