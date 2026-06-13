# HANDOFF-AI.md — Scresh AI Pipeline Handoff

Last updated: 2026-06-13

## 0. Context Singkat

Project ini adalah **Scresh**, bukan Insignia Tech Test.

Scresh adalah sistem AI untuk membantu koperasi/gudang melakukan scanning batch hasil panen/sayur/buah. Fokus AI sejauh ini:

```text
User upload 3–5 foto komoditas
→ AI segment area produce
→ AI crop object/produce
→ AI classify freshness
→ AI map ke Grade A/B/C/D
→ AI estimate shelf-life
→ AI generate recommendation
→ FastAPI backend return JSON + overlay/mask result
```

Backend yang akan dipakai: **FastAPI**.

Frontend boleh deploy di Vercel atau platform lain, tetapi backend AI lebih cocok deploy sebagai container/backend service, misalnya Azure Container Apps, Azure ML Online Endpoint, Hugging Face Spaces, Modal, RunPod, atau server GPU/CPU lain.

---

## 1. Keputusan Arsitektur AI Saat Ini

Pipeline final yang sedang dibangun:

```text
Raw produce image
→ DINOv3 frozen encoder + lightweight binary segmentation decoder
→ binary produce mask
→ connected components untuk multi-object extraction
→ crop tiap object
→ EfficientNet-B0 freshness classifier
→ fresh / medium / rotten probabilities
→ Grade A/B/C/D
→ shelf-life estimate
→ action recommendation
```

### Model segmentation

Model segmentation yang dipakai sekarang:

```text
DINOv3 frozen ViT encoder
+ small convolution decoder
```

Catatan penting:

- DINOv3 dipakai sebagai **segmentation backbone**, bukan YOLO.
- Decoder dilatih untuk binary segmentation: `produce` vs `background`.
- DINOv3 checkpoint official dari Meta/Hugging Face bersifat gated, jadi butuh `HF_TOKEN`.
- Notebook sengaja menghindari `AutoImageProcessor` dan `torchvision` karena sebelumnya memicu error Pillow/PIL.

### Model freshness

Model freshness yang ditambahkan:

```text
EfficientNet-B0 via timm
classes: fresh / medium / rotten
```

Input model freshness adalah **crop object** hasil segmentation, bukan raw image penuh.

---

## 2. Kebingungan “YOLO” yang Sempat Muncul

Walaupun model sekarang DINOv3, beberapa dataset yang dipakai berasal dari Roboflow/YOLO export, sehingga foldernya berbentuk:

```text
train/images
train/labels
valid/images
valid/labels
test/images
test/labels
data.yaml
```

Istilah “YOLO” di notebook hanya berarti:

```text
format anotasi dataset / label file
```

Bukan berarti model yang dilatih adalah YOLO.

Pipeline sebenarnya:

```text
Roboflow/YOLO-format annotation
→ convert label polygon/bbox menjadi mask/crop
→ train DINOv3 decoder / EfficientNet classifier
```

Jadi:

```text
DINOv3 = model segmentation
EfficientNet-B0 = model freshness
YOLO/Roboflow = format label dataset
```

---

## 3. Dataset yang Dipakai

Dataset yang user punya saat ini:

```text
/kaggle/input/datasets/athillazaidan/chili-freshness/Freshness chili segmentation.yolov8
/kaggle/input/datasets/athillazaidan/kentang-freshness/Rotten and Healthy Potatoes.yolov8
/kaggle/input/datasets/athillazaidan/lettuce-yolodataset
/kaggle/input/datasets/sujaykapadnis/tomato-maturity-detection-and-quality-grading/Tomato Maturity Detection and Quality Grading Dataset
```

Tipe dataset:

### A. Roboflow/YOLO-format freshness/segmentation datasets

```text
chili-freshness
kentang-freshness
lettuce-yolodataset
```

Cara membaca:

```text
read data.yaml
→ get class names
→ read labels/*.txt
→ map class_id ke fresh / medium / rotten
→ crop object dari bbox/polygon
→ pakai crop untuk training EfficientNet freshness
```

Contoh mapping yang diinginkan:

```text
Chili:
Fresh              → fresh
Moderately Fresh   → medium
NotFresh           → rotten

Potato:
Healthy Potato     → fresh
Rotten Potato      → rotten

Lettuce:
healthy            → fresh
moderately healthy → medium
unhealthy          → rotten
```

Jika class name berbeda, mapping perlu disesuaikan dari output `Class names:`.

### B. Folder-classification dataset

```text
tomato-maturity-detection-and-quality-grading
```

Cara membaca:

```text
folder Fresh  → fresh
folder Rotten → rotten
```

Untuk tomato maturity classes seperti `mature`, `immature`, `ripe`, `unripe`, jangan langsung dianggap freshness kecuali memang foldernya explicitly `Fresh`/`Rotten`.

---

## 4. Masalah Discovery Freshness yang Sudah Ditemukan

Sebelumnya, code lama membaca label freshness dari **full path string**. Ini bermasalah.

Contoh error:

```text
.../lettuce-yolodataset/...rf.e55c0d42d5bebad6...
```

Path random dari Roboflow mengandung substring `bad`, sehingga image lettuce bisa salah dibaca sebagai `rotten`.

Contoh lain:

```text
/kaggle/input/.../Rotten and Healthy Potatoes.yolov8/.../Healthy Potato Aug...
```

Karena nama dataset mengandung `Rotten`, image `Healthy Potato` bisa salah dibaca sebagai `rotten`.

Kesimpulan:

```text
Jangan infer freshness label dari full path.
```

Yang benar:

```text
YOLO/Roboflow datasets:
read data.yaml + labels/*.txt class_id

Folder classification datasets:
read nearest class folder like Fresh/Rotten
```

---

## 5. Multi-object Segmentation

Model DINOv3 decoder saat ini adalah:

```text
binary semantic segmentation
```

Artinya model memprediksi:

```text
pixel ini produce atau background?
```

Bukan instance segmentation murni.

Supaya bisa segment banyak objek, dilakukan post-processing:

```text
binary mask
→ morphological clean
→ connected components
→ each component = one object
→ crop each object
```

### Bisa segment banyak objek?

Bisa, dengan batasan:

```text
Objek terpisah jelas → bisa jadi banyak object
Objek saling nempel/overlap → cenderung jadi satu blob/object
```

Jika butuh instance segmentation yang lebih kuat untuk objek nempel, opsi yang lebih cocok adalah:

```text
Mask2Former
YOLO instance segmentation
SAM-style promptable segmentation
```

Tapi untuk MVP Scresh, connected components dari binary DINOv3 mask cukup masuk akal.

Recommended config:

```python
SEG_MULTI_OBJECT = True
SEG_KEEP_LARGEST_ONLY = False
SEG_MIN_COMPONENT_AREA = 250
SEG_MAX_OBJECTS = 10
SEG_COMPONENT_PAD = 8
SEG_MASK_THRESHOLD = 0.50
```

Jika objek masih tidak terpisah:

```python
SEG_MIN_COMPONENT_AREA = 100
SEG_MASK_THRESHOLD = 0.45
```

Jika objek terpisah malah menyatu karena morphology:

```python
close_kernel = 3
# atau
close_kernel = 0
```

---

## 6. Grade Logic

Freshness classifier output:

```text
fresh probability
medium probability
rotten probability
```

Grade tidak boleh hanya berdasarkan top-1 class. Sebelumnya sempat ada kasus image terlihat fresh tapi masuk Grade C karena rule terlalu kasar:

```text
fresh  → A/B
medium → C
rotten → D
```

Rule yang dipakai sekarang lebih aman:

```python
def map_to_grade_smarter(prob):
    fresh_p = prob.get("fresh", 0)
    medium_p = prob.get("medium", 0)
    rotten_p = prob.get("rotten", 0)

    if rotten_p >= 0.70:
        return "D"
    if fresh_p >= 0.85:
        return "A"
    if fresh_p >= 0.45:
        return "B"
    if medium_p >= 0.45 and rotten_p < 0.30:
        return "B"
    if medium_p >= 0.50:
        return "C"
    if rotten_p >= 0.40:
        return "C"
    return "B"
```

Shelf-life table:

```python
SHELF_LIFE = {
    "lettuce": {"A": 5,  "B": 3, "C": 1, "D": 0},
    "chili":   {"A": 7,  "B": 4, "C": 2, "D": 0},
    "potato":  {"A": 14, "B": 7, "C": 3, "D": 0},
    "onion":   {"A": 14, "B": 7, "C": 3, "D": 0},
    "tomato":  {"A": 5,  "B": 3, "C": 1, "D": 0},
}
```

Recommendation:

```python
def get_recommendation(grade, shelf_life_days):
    if grade == "A":
        return f"Excellent freshness. Safe to store up to {shelf_life_days} days."
    if grade == "B":
        return f"Good freshness. Prioritize distribution within {shelf_life_days} days."
    if grade == "C":
        return f"At-risk batch. Distribute or process within {shelf_life_days} day."
    return "Reject or mark as waste. Do not distribute."
```

Batch aggregation:

```python
if max_rotten_prob >= 0.80:
    final_grade = "D"
else:
    final_grade = map_to_grade_smarter(avg_probs)
```

---

## 7. Notebook/Artifact yang Sudah Dibuat

Latest relevant notebook:

```text
/mnt/data/scresh_dinov3_full_with_freshness_multiobject_v2_multidataset.ipynb
```

Namun setelah dataset root sudah jelas, CELL 17A perlu diganti ke versi yang:

```text
- khusus membaca YOLO/Roboflow labels untuk chili/kentang/lettuce
- khusus membaca folder Fresh/Rotten untuk tomato
- tidak infer dari full path
- tidak membaca random filename hash
```

Notebook sebelumnya juga pernah dibuat:

```text
scresh_dinov3_frozen_decoder_full_v6_access_ready.ipynb
scresh_internimage_mask2former_full.ipynb
scresh_dinov3_full_with_freshness_multiobject.ipynb
```

Catatan:

- DINOv3 full pipeline adalah arah utama sekarang.
- InternImage/Mask2Former sempat dibahas sebagai alternatif jika DINOv3 gated bermasalah.
- Karena user sudah punya DINOv3 access, lanjut DINOv3.

---

## 8. Known Issues dan Fix

### 8.1 DINOv3 gated access / 401 Unauthorized

DINOv3 official gated. Backend/notebook butuh Hugging Face token.

Kaggle:

```python
from kaggle_secrets import UserSecretsClient
HF_TOKEN = UserSecretsClient().get_secret("HF_TOKEN")
```

Load model:

```python
from transformers import AutoModel

dino_backbone = AutoModel.from_pretrained(
    "facebook/dinov3-vits16-pretrain-lvd1689m",
    token=HF_TOKEN,
)
```

Jika masih 401:

- Token dari account yang salah.
- Account belum benar-benar granted access.
- Token fine-grained tidak punya permission ke repo.
- Notebook belum rerun cell setelah secret ditambahkan.
- Cell lama masih tidak pass `token=HF_TOKEN`.

### 8.2 Jangan pakai AutoImageProcessor

Sebelumnya terjadi error PIL/Pillow:

```text
ImportError: cannot import name '_Ink' from 'PIL._typing'
```

Fix:

- Jangan import `AutoImageProcessor`.
- Jangan import `torchvision`.
- Gunakan manual preprocessing.

DINO preprocessing:

```python
DINO_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
DINO_STD = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)

def preprocess_dino_image(image: Image.Image, img_size: int = 512) -> torch.Tensor:
    image = image.convert("RGB")
    image = image.resize((img_size, img_size), resample=Image.BICUBIC)
    arr = np.asarray(image).astype(np.float32) / 255.0
    tensor = torch.from_numpy(arr).permute(2, 0, 1)
    tensor = (tensor - DINO_MEAN) / DINO_STD
    return tensor
```

### 8.3 Label discovery salah karena path keyword

Jangan pakai:

```python
if "bad" in full_path:
    return "rotten"
```

Karena random filename dari Roboflow bisa mengandung `bad`, `rot`, dll.

Use:

- `data.yaml` + label class id for YOLO-format datasets.
- nearest class folder for folder-classification datasets.

---

## 9. Model Artifacts Setelah Training

Setelah training di Kaggle, download:

```text
/kaggle/working/scresh_dinov3_frozen_decoder_best.pt
/kaggle/working/scresh_freshness_efficientnet_b0_best.pt
/kaggle/working/scresh_dinov3_frozen_decoder_metadata.json
/kaggle/working/scresh_freshness_metadata.json
```

Optional zip:

```python
import shutil

shutil.make_archive(
    "/kaggle/working/scresh_ai_models",
    "zip",
    "/kaggle/working"
)
```

Download:

```text
scresh_ai_models.zip
```

---

## 10. FastAPI Backend Plan

Backend Scresh pakai FastAPI.

Suggested structure:

```text
scresh/
├── frontend/
└── backend/
    ├── app/
    │   ├── main.py
    │   ├── api/
    │   │   └── scan.py
    │   ├── services/
    │   │   ├── segmentation.py
    │   │   ├── freshness.py
    │   │   └── grading.py
    │   ├── models/
    │   │   ├── scresh_dinov3_frozen_decoder_best.pt
    │   │   ├── scresh_freshness_efficientnet_b0_best.pt
    │   │   ├── scresh_dinov3_frozen_decoder_metadata.json
    │   │   └── scresh_freshness_metadata.json
    │   └── outputs/
    ├── requirements.txt
    ├── Dockerfile
    └── .env
```

### Endpoint utama

```text
POST /api/v1/scresh/scan
```

Request:

```text
multipart/form-data:
- images: 3–5 image files
- commodity: lettuce / chili / potato / tomato / onion
```

Response:

```json
{
  "commodity": "potato",
  "summary": {
    "freshness_class": "fresh",
    "confidence": 0.91,
    "grade": "A",
    "shelf_life_days": 14,
    "recommendation": "Excellent freshness. Safe to store up to 14 days.",
    "object_count": 3
  },
  "images": [
    {
      "image_index": 0,
      "overlay_url": "/outputs/scan_001_overlay.jpg",
      "objects": [
        {
          "object_id": 1,
          "bbox_xyxy": [10, 20, 300, 280],
          "polygon_xy": [[120, 80], [180, 90], [200, 140]],
          "freshness": {
            "freshness_class": "fresh",
            "confidence": 0.92,
            "grade": "A",
            "shelf_life_days": 14
          }
        }
      ]
    }
  ]
}
```

### Startup behavior

At FastAPI startup:

```text
load HF_TOKEN
load DINOv3 backbone
load segmentation checkpoint
load EfficientNet-B0 freshness checkpoint
warm up model with dummy image if possible
```

Environment:

```env
HF_TOKEN=hf_xxxxxxxxx
MODEL_DIR=/app/app/models
CORS_ORIGINS=http://localhost:3000,https://scresh-frontend.vercel.app
```

---

## 11. Deployment Direction

### Vercel

Vercel cocok untuk frontend, bukan untuk AI backend berat.

Recommended:

```text
Frontend Scresh → Vercel
FastAPI AI backend → Azure / HF Spaces / Modal / RunPod
```

### Azure

Azure bisa dipakai untuk backend AI.

Recommended for Scresh:

```text
Azure Container Apps + Azure Container Registry
```

Flow:

```text
FastAPI app
→ Docker image
→ Azure Container Registry
→ Azure Container Apps
```

Alternative more ML-production:

```text
Azure Machine Learning Managed Online Endpoint
```

### Model storage

For demo:

```text
model .pt files included in backend/models inside Docker image
```

More proper:

```text
model .pt files stored in Azure Blob Storage
FastAPI downloads model on startup and caches locally
```

---

## 12. Next Steps

### Step 1 — Fix CELL 17A

Replace old path-keyword based discovery with dataset-specific discovery:

```text
YOLO/Roboflow datasets:
read data.yaml + labels/*.txt

Tomato folder dataset:
read Fresh/Rotten folder only
```

Check output:

```text
Class names:
class 0: ...
class 1: ...
class 2: ...

Counts by source:
chili-freshness
kentang-freshness
lettuce-yolodataset
tomato-maturity...
```

Do not continue if examples look wrong.

### Step 2 — Train segmentation

Train DINOv3 decoder for produce mask.

Verify:

- val IoU
- visual mask overlay
- multi-object extraction
- crop quality

### Step 3 — Train freshness

Train EfficientNet-B0 on crops produced from freshness datasets.

Verify:

- class distribution
- random validation predictions
- confusion cases
- no obvious wrong labels

### Step 4 — End-to-end notebook test

Test:

```text
upload potato image
→ segment multiple potatoes
→ crop each potato
→ classify freshness
→ aggregate grade
→ output JSON
```

### Step 5 — Export model artifacts

Download:

```text
scresh_dinov3_frozen_decoder_best.pt
scresh_freshness_efficientnet_b0_best.pt
metadata json
```

### Step 6 — Build FastAPI backend

Implement:

```text
services/segmentation.py
services/freshness.py
services/grading.py
api/scan.py
main.py
```

### Step 7 — Deploy

Recommended demo deployment:

```text
Frontend: Vercel
Backend: Azure Container Apps
Model: bundled in Docker or Azure Blob Storage
```

---

## 13. Important Mental Model

Keep these separated:

```text
Dataset format ≠ Model architecture
```

Current stack:

```text
Roboflow/YOLO format labels
→ used only as annotation source

DINOv3
→ segmentation model

EfficientNet-B0
→ freshness classifier

FastAPI
→ backend API serving pipeline
```

Avoid saying “we use YOLO model” unless YOLO actually becomes the model again.

---

## 14. One-liner for Future Chat

Scresh AI is a FastAPI-served produce freshness pipeline using DINOv3 frozen encoder + lightweight segmentation decoder for produce masks, connected components for multi-object crops, and EfficientNet-B0 for fresh/medium/rotten classification mapped into Grade A/B/C/D with shelf-life recommendations. The dataset includes Roboflow/YOLO-format chili/potato/lettuce annotations and tomato folder classification data; YOLO refers only to label format, not the model.
