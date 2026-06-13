from pathlib import Path


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
