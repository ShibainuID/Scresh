import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SegmentationSparkles } from "./segmentation-sparkles";

describe("SegmentationSparkles", () => {
  test("renders the requested number of sparkle particles", () => {
    const html = renderToStaticMarkup(
      createElement(SegmentationSparkles, {
        maskUrl: "data:image/png;base64,abc",
        grade: "A",
        particleCount: 12,
      }),
    );
    const matches = html.match(/class="sparkle"/g);
    expect(matches?.length).toBe(12);
  });

  test("applies the segmentation mask to the layer", () => {
    const html = renderToStaticMarkup(
      createElement(SegmentationSparkles, {
        maskUrl: "data:image/png;base64,abc",
        grade: "B",
      }),
    );
    expect(html).toContain(
      "mask-image:url(&quot;data:image/png;base64,abc&quot;)",
    );
  });

  test("uses the grade tint color for the glow", () => {
    const html = renderToStaticMarkup(
      createElement(SegmentationSparkles, {
        maskUrl: "data:image/png;base64,abc",
        grade: "C",
      }),
    );
    expect(html).toContain("#f86812");
  });
});
