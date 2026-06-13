from pathlib import Path

import pytest

from app.services.runtime import (
    _normalize_segmentation_state,
    _validate_segmentation_load,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
RUNTIME = REPOSITORY_ROOT / "ai-service" / "app" / "services" / "runtime.py"
REQUIREMENTS = REPOSITORY_ROOT / "ai-service" / "requirements.txt"


def test_runtime_uses_transformers_dinov3_vit_api():
    runtime = RUNTIME.read_text()
    requirements = REQUIREMENTS.read_text()

    assert "transformers==5.12.0" in requirements
    assert "transformers.models.dinov3_vit.configuration_dinov3_vit" in runtime
    assert "DINOv3ViTConfig" in runtime
    assert "transformers.models.dinov3_vit.modeling_dinov3_vit" in runtime
    assert "DINOv3ViTModel" in runtime


def test_normalizes_legacy_dinov3_encoder_keys():
    state = {
        "backbone.layer.0.norm1.weight": object(),
        "backbone.embeddings.cls_token": object(),
        "decoder.0.block.0.weight": object(),
    }

    normalized = _normalize_segmentation_state(state)

    assert "backbone.model.layer.0.norm1.weight" in normalized
    assert "backbone.layer.0.norm1.weight" not in normalized
    assert normalized["backbone.embeddings.cls_token"] is state[
        "backbone.embeddings.cls_token"
    ]
    assert normalized["decoder.0.block.0.weight"] is state[
        "decoder.0.block.0.weight"
    ]


def test_allows_only_missing_batch_norm_buffers():
    _validate_segmentation_load(
        [
            "decoder.0.block.1.running_mean",
            "decoder.0.block.1.running_var",
            "decoder.0.block.1.num_batches_tracked",
        ],
        [],
    )

    with pytest.raises(RuntimeError, match="checkpoint is incompatible"):
        _validate_segmentation_load(
            ["backbone.model.layer.0.norm1.weight"],
            [],
        )
