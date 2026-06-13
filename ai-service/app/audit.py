import os
from pathlib import Path

from PIL import Image

from app.services.runtime import build_pipeline


def main() -> None:
    model_dir = Path(os.getenv("MODEL_DIR", "/app/models"))
    pipeline = build_pipeline(model_dir)
    image = Image.new("RGB", (512, 512), "green")

    mask = pipeline.segmenter.predict_mask(image)
    probabilities = pipeline.classifier.predict_probabilities(image)

    if mask.shape != (512, 512):
        raise RuntimeError(f"Unexpected segmentation shape: {mask.shape}")
    if set(probabilities) != {"fresh", "medium", "rotten"}:
        raise RuntimeError(
            f"Unexpected freshness classes: {sorted(probabilities)}"
        )
    if abs(sum(probabilities.values()) - 1.0) > 1e-5:
        raise RuntimeError("Freshness probabilities do not sum to one")

    print("Scresh model audit passed")


if __name__ == "__main__":
    main()
