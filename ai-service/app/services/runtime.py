import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

from app.services.pipeline import FreshnessPipeline

DINO_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
DINO_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def _checkpoint_state(checkpoint: object) -> dict[str, object]:
    if not isinstance(checkpoint, dict):
        raise RuntimeError("Checkpoint must contain a dictionary")
    state = checkpoint.get("model_state_dict", checkpoint)
    if not isinstance(state, dict):
        raise RuntimeError("Checkpoint model_state_dict is invalid")
    return state


def _normalize_segmentation_state(
    state: dict[str, object],
) -> dict[str, object]:
    normalized = {}
    for key, value in state.items():
        if key.startswith("backbone.layer."):
            key = key.replace(
                "backbone.layer.",
                "backbone.model.layer.",
                1,
            )
        normalized[key] = value
    return normalized


def _validate_segmentation_load(
    missing_keys: list[str],
    unexpected_keys: list[str],
) -> None:
    allowed_missing_suffixes = (
        ".running_mean",
        ".running_var",
        ".num_batches_tracked",
    )
    invalid_missing = [
        key
        for key in missing_keys
        if not key.endswith(allowed_missing_suffixes)
    ]
    if invalid_missing or unexpected_keys:
        raise RuntimeError(
            "Segmentation checkpoint is incompatible: "
            f"missing={invalid_missing}, unexpected={unexpected_keys}"
        )


class TorchSegmenter:
    def __init__(
        self,
        model_dir: Path,
        *,
        mask_threshold: float,
        image_size: int,
    ):
        import torch
        from torch import nn
        from transformers.models.dinov3_vit.configuration_dinov3_vit import (
            DINOv3ViTConfig,
        )
        from transformers.models.dinov3_vit.modeling_dinov3_vit import (
            DINOv3ViTModel,
        )

        class DecoderBlock(nn.Module):
            def __init__(self, in_channels: int, out_channels: int):
                super().__init__()
                self.block = nn.Sequential(
                    nn.Conv2d(
                        in_channels,
                        out_channels,
                        kernel_size=3,
                        padding=1,
                        bias=False,
                    ),
                    nn.BatchNorm2d(out_channels),
                    nn.ReLU(inplace=True),
                )

            def forward(self, value):
                value = torch.nn.functional.interpolate(
                    value,
                    scale_factor=2,
                    mode="bilinear",
                    align_corners=False,
                )
                return self.block(value)

        class SegmentationModel(nn.Module):
            def __init__(self):
                super().__init__()
                config = DINOv3ViTConfig(
                    hidden_size=384,
                    num_hidden_layers=12,
                    num_attention_heads=6,
                    intermediate_size=1536,
                    patch_size=16,
                    num_register_tokens=4,
                )
                self.backbone = DINOv3ViTModel(config)
                self.decoder = nn.Sequential(
                    DecoderBlock(384, 256),
                    DecoderBlock(256, 128),
                    DecoderBlock(128, 64),
                    nn.Conv2d(64, 1, kernel_size=1),
                )

            def forward(self, pixel_values):
                features = self.backbone(pixel_values=pixel_values)
                tokens = features.last_hidden_state[:, 5:, :]
                grid_size = math.isqrt(tokens.shape[1])
                feature_map = tokens.transpose(1, 2).reshape(
                    tokens.shape[0],
                    tokens.shape[2],
                    grid_size,
                    grid_size,
                )
                logits = self.decoder(feature_map)
                return torch.nn.functional.interpolate(
                    logits,
                    size=pixel_values.shape[-2:],
                    mode="bilinear",
                    align_corners=False,
                )

        self.torch = torch
        self.device = torch.device("cpu")
        self.image_size = image_size
        self.mask_threshold = mask_threshold
        self.model = SegmentationModel()
        checkpoint = torch.load(
            model_dir / "scresh_dinov3_frozen_decoder_best.pt",
            map_location=self.device,
            weights_only=False,
        )
        incompatible = self.model.load_state_dict(
            _normalize_segmentation_state(_checkpoint_state(checkpoint)),
            strict=False,
        )
        _validate_segmentation_load(
            incompatible.missing_keys,
            incompatible.unexpected_keys,
        )
        self.model.to(self.device).eval()

    def predict_mask(self, image: Image.Image) -> np.ndarray:
        resized = image.convert("RGB").resize(
            (self.image_size, self.image_size),
            Image.Resampling.BICUBIC,
        )
        array = np.asarray(resized, dtype=np.float32) / 255.0
        array = (array - DINO_MEAN) / DINO_STD
        tensor = (
            self.torch.from_numpy(array)
            .permute(2, 0, 1)
            .unsqueeze(0)
            .to(self.device)
        )

        with self.torch.inference_mode():
            probability = self.torch.sigmoid(self.model(tensor))[0, 0]
        mask = (
            probability.detach().cpu().numpy() >= self.mask_threshold
        ).astype(np.uint8)
        return np.asarray(
            Image.fromarray(mask).resize(
                image.size,
                Image.Resampling.NEAREST,
            ),
            dtype=np.uint8,
        )


class TorchFreshnessClassifier:
    def __init__(self, model_dir: Path, metadata: dict[str, object]):
        import timm
        import torch

        self.torch = torch
        self.device = torch.device("cpu")
        self.class_names = list(metadata["class_names"])
        self.image_size = int(metadata["img_size"])
        self.model = timm.create_model(
            str(metadata["model_name"]),
            pretrained=False,
            num_classes=len(self.class_names),
        )
        checkpoint = torch.load(
            model_dir / "scresh_freshness_efficientnet_b0_best.pt",
            map_location=self.device,
            weights_only=False,
        )
        self.model.load_state_dict(_checkpoint_state(checkpoint), strict=True)
        self.model.to(self.device).eval()

    def predict_probabilities(self, image: Image.Image) -> dict[str, float]:
        resized = image.convert("RGB").resize(
            (self.image_size, self.image_size),
            Image.Resampling.BICUBIC,
        )
        array = np.asarray(resized, dtype=np.float32) / 255.0
        array = (array - DINO_MEAN) / DINO_STD
        tensor = (
            self.torch.from_numpy(array)
            .permute(2, 0, 1)
            .unsqueeze(0)
            .to(self.device)
        )
        with self.torch.inference_mode():
            logits = self.model(tensor)
            probabilities = self.torch.softmax(logits, dim=1)[0]
        return {
            name: float(probabilities[index].item())
            for index, name in enumerate(self.class_names)
        }


def build_pipeline(model_dir: Path) -> FreshnessPipeline:
    with (model_dir / "scresh_dinov3_frozen_decoder_metadata.json").open() as file:
        segmentation_metadata = json.load(file)
    with (model_dir / "scresh_freshness_metadata.json").open() as file:
        freshness_metadata = json.load(file)

    multi_object = segmentation_metadata["multi_object"]
    segmenter = TorchSegmenter(
        model_dir,
        image_size=int(segmentation_metadata["img_size"]),
        mask_threshold=float(multi_object["mask_threshold"]),
    )
    classifier = TorchFreshnessClassifier(model_dir, freshness_metadata)
    return FreshnessPipeline(
        segmenter,
        classifier,
        min_component_area=int(multi_object["min_component_area"]),
        max_objects=int(multi_object["max_objects"]),
        component_padding=8,
    )
