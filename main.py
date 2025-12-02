# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from infer_runtime import PostureModel  # uses your existing class in infer_runtime.py

# Create FastAPI app (this variable must be named `app` for uvicorn)
app = FastAPI(title="PosturePal API")

# Allow local frontend (Vite) + Node proxy; add other origins if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model using the PostureModel wrapper from infer_runtime.py
# These paths are relative to posturepal_model/ (your models folder is at posturepal_model/models)
pm = PostureModel(model_path="models/posture_rf.joblib", meta_path="models/meta.json")


class PostureFeatures(BaseModel):
    torso_angle: float
    neck_angle: float
    shoulder_tilt: float
    hip_tilt: float
    head_forward_z: float
    head_to_shoulder: float


@app.get("/", tags=["health"])
def root():
    return {"message": "PosturePal Python API running!"}


@app.post("/predict", tags=["inference"])
def predict(features: PostureFeatures):
    """
    Accepts JSON body with the six numeric features (names must match).
    Returns: { class_id, label, confidence, proba }
    """
    try:
        result = pm.predict(features.dict())
        return result
    except Exception as e:
        # Return a helpful error so frontend can debug
        return {"error": "Prediction failed", "detail": str(e)}
