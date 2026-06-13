from io import BytesIO
import base64

import numpy as np
from PIL import Image

from app.services.pipeline import FreshnessPipeline
from app.services.segmentation import extract_components


class FakeSegmenter:
    def predict_mask(self, image):
        mask = np.zeros((image.height, image.width), dtype=np.uint8)
        mask[4:14, 3:13] = 1
        mask[6:18, 20:30] = 1
        return mask


class FakeClassifier:
    def predict_probabilities(self, image):
        if image.width == 10:
            return {"fresh": 0.90, "medium": 0.08, "rotten": 0.02}
        return {"fresh": 0.55, "medium": 0.35, "rotten": 0.10}


def test_extracts_separate_connected_components_with_padding():
    mask = np.zeros((30, 40), dtype=np.uint8)
    mask[5:10, 6:12] = 1
    mask[15:24, 25:35] = 1

    components = extract_components(mask, min_area=10, max_objects=10, padding=2)

    assert [component.bbox_xyxy for component in components] == [
        (23, 13, 37, 26),
        (4, 3, 14, 12),
    ]


def test_scans_one_photo_and_aggregates_all_detected_objects():
    image = Image.new("RGB", (40, 24), "white")
    pipeline = FreshnessPipeline(
        FakeSegmenter(),
        FakeClassifier(),
        min_component_area=20,
    )

    result = pipeline.scan(image, "chili")

    assert result["commodity"] == "chili"
    assert result["summary"]["object_count"] == 2
    assert result["summary"]["grade"] == "B"
    assert len(result["objects"]) == 2
    assert result["objects"][0]["object_id"] == 1
    assert result["overlay_media_type"] == "image/jpeg"
    assert result["overlay_base64"]
    assert result["mask_media_type"] == "image/png"

    mask = Image.open(BytesIO(base64.b64decode(result["mask_base64"])))
    assert mask.mode == "RGBA"
    assert mask.size == image.size
    assert mask.getpixel((5, 5)) == (124, 58, 237, 150)
    assert mask.getpixel((0, 0)) == (124, 58, 237, 0)


def test_pipeline_rejects_photo_without_detected_produce():
    class EmptySegmenter:
        def predict_mask(self, image):
            return np.zeros((image.height, image.width), dtype=np.uint8)

    pipeline = FreshnessPipeline(
        EmptySegmenter(),
        FakeClassifier(),
        min_component_area=20,
    )

    try:
        pipeline.scan(Image.new("RGB", (20, 20)), "tomato")
    except ValueError as error:
        assert str(error) == "No produce objects detected"
    else:
        raise AssertionError("Expected scan to reject an empty segmentation mask")


def test_pipeline_accepts_decoded_image_bytes():
    stream = BytesIO()
    Image.new("RGB", (40, 24), "white").save(stream, format="JPEG")
    pipeline = FreshnessPipeline(
        FakeSegmenter(),
        FakeClassifier(),
        min_component_area=20,
    )

    result = pipeline.scan_bytes(stream.getvalue(), "chili")

    assert result["summary"]["object_count"] == 2
