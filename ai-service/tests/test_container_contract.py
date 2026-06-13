from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DOCKERFILE = REPOSITORY_ROOT / "ai-service" / "Dockerfile"
DOCKERIGNORE = REPOSITORY_ROOT / ".dockerignore"


def test_docker_image_bundles_models_and_uses_cpu_torch():
    dockerfile = DOCKERFILE.read_text()

    assert "https://download.pytorch.org/whl/cpu" in dockerfile
    assert "COPY ai-integration/ /app/models/" in dockerfile
    assert "MODEL_DIR=/app/models" in dockerfile
    assert "scresh_dinov3_frozen_decoder_best.pt" in dockerfile
    assert "scresh_freshness_efficientnet_b0_best.pt" in dockerfile


def test_docker_image_exposes_healthcheck_and_service_command():
    dockerfile = DOCKERFILE.read_text()

    assert "HEALTHCHECK" in dockerfile
    assert 'CMD ["uvicorn", "app.main:app"' in dockerfile


def test_docker_context_excludes_local_build_artifacts_but_keeps_models():
    dockerignore = DOCKERIGNORE.read_text()

    assert "ai-service/.venv" in dockerignore
    assert "**/__pycache__" in dockerignore
    assert ".git" in dockerignore
    assert "ai-integration" not in dockerignore
