import base64
from io import BytesIO
from typing import Protocol

import numpy as np
from PIL import Image, ImageDraw

from app.services.grading import aggregate_batch, build_freshness_result
from app.services.segmentation import extract_components


class Segmenter(Protocol):
    def predict_mask(self, image: Image.Image) -> np.ndarray: ...


class Classifier(Protocol):
    def predict_probabilities(self, image: Image.Image) -> dict[str, float]: ...


class FreshnessPipeline:
    def __init__(
        self,
        segmenter: Segmenter,
        classifier: Classifier,
        *,
        min_component_area: int = 250,
        max_objects: int = 10,
        component_padding: int = 8,
    ):
        self.segmenter = segmenter
        self.classifier = classifier
        self.min_component_area = min_component_area
        self.max_objects = max_objects
        self.component_padding = component_padding

    def scan_bytes(self, image_bytes: bytes, commodity: str) -> dict[str, object]:
        try:
            with Image.open(BytesIO(image_bytes)) as image:
                return self.scan(image.convert("RGB"), commodity)
        except (OSError, ValueError) as error:
            if str(error) == "No produce objects detected":
                raise
            raise ValueError("Invalid image file") from error

    def scan(self, image: Image.Image, commodity: str) -> dict[str, object]:
        rgb_image = image.convert("RGB")
        mask = self.segmenter.predict_mask(rgb_image)
        components = extract_components(
            mask,
            min_area=self.min_component_area,
            max_objects=self.max_objects,
            padding=self.component_padding,
        )
        if not components:
            raise ValueError("No produce objects detected")

        object_results = []
        probabilities = []
        for object_id, component in enumerate(components, start=1):
            crop = rgb_image.crop(component.bbox_xyxy)
            prediction = self.classifier.predict_probabilities(crop)
            probabilities.append(prediction)
            freshness = build_freshness_result(commodity, prediction)
            object_results.append(
                {
                    "object_id": object_id,
                    "bbox_xyxy": list(component.bbox_xyxy),
                    "freshness": freshness,
                }
            )

        overlay = self._build_overlay(rgb_image, object_results)
        mask_overlay = self._build_mask_overlay(mask, rgb_image.size)
        return {
            "commodity": commodity.strip().lower(),
            "summary": aggregate_batch(commodity, probabilities),
            "objects": object_results,
            "overlay_media_type": "image/jpeg",
            "overlay_base64": base64.b64encode(overlay).decode("ascii"),
            "mask_media_type": "image/png",
            "mask_base64": base64.b64encode(mask_overlay).decode("ascii"),
        }

    @staticmethod
    def _build_mask_overlay(
        mask: np.ndarray,
        size: tuple[int, int],
    ) -> bytes:
        binary = np.asarray(mask, dtype=bool)
        if binary.shape != (size[1], size[0]):
            binary = np.asarray(
                Image.fromarray(binary.astype(np.uint8)).resize(
                    size,
                    Image.Resampling.NEAREST,
                ),
                dtype=bool,
            )

        rgba = np.zeros((size[1], size[0], 4), dtype=np.uint8)
        rgba[..., :3] = (124, 58, 237)
        rgba[..., 3] = np.where(binary, 150, 0)

        output = BytesIO()
        Image.fromarray(rgba, mode="RGBA").save(output, format="PNG")
        return output.getvalue()

    @staticmethod
    def _build_overlay(
        image: Image.Image,
        objects: list[dict[str, object]],
    ) -> bytes:
        overlay = image.copy()
        draw = ImageDraw.Draw(overlay)
        colors = {"A": "#16a34a", "B": "#84cc16", "C": "#f97316", "D": "#dc2626"}

        for item in objects:
            freshness = item["freshness"]
            assert isinstance(freshness, dict)
            grade = str(freshness["grade"])
            bbox = tuple(item["bbox_xyxy"])
            draw.rectangle(bbox, outline=colors[grade], width=4)
            draw.text(
                (bbox[0] + 4, bbox[1] + 4),
                f"#{item['object_id']} Grade {grade}",
                fill=colors[grade],
                stroke_width=2,
                stroke_fill="white",
            )

        output = BytesIO()
        overlay.save(output, format="JPEG", quality=88)
        return output.getvalue()
