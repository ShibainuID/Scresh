FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_DIR=/app/models

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl \
    && rm -rf /var/lib/apt/lists/*

COPY ai-service/requirements.txt /tmp/requirements.txt

RUN pip install --no-cache-dir \
        torch==2.7.0 \
        torchvision==0.22.0 \
        --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r /tmp/requirements.txt

COPY ai-service/app/ /app/app/
COPY ai-integration/ /app/models/

RUN test -f /app/models/scresh_dinov3_frozen_decoder_best.pt \
    && test -f /app/models/scresh_dinov3_frozen_decoder_metadata.json \
    && test -f /app/models/scresh_freshness_efficientnet_b0_best.pt \
    && test -f /app/models/scresh_freshness_metadata.json \
    && useradd --create-home --uid 10001 scresh \
    && chown -R scresh:scresh /app

USER scresh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD curl --fail http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
