from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os

app = FastAPI(title="Molecule Data Explorer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

try:
    dataframe = pd.read_csv("sample_data.csv")
except:
    dataframe = pd.DataFrame()


@app.get("/")
def home():
    return {"message": "Molecule Data Explorer API"}


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    global dataframe

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    dataframe = pd.read_csv(file_path)

    return {
        "message": "File uploaded successfully",
        "rows": len(dataframe)
    }


@app.get("/molecules")
def get_molecules(page: int = 1, limit: int = 10):

    total_records = len(dataframe)

    start = (page - 1) * limit
    end = start + limit

    records = dataframe.iloc[start:end].to_dict(
        orient="records"
    )

    return {
        "page": page,
        "limit": limit,
        "total_records": total_records,
        "data": records
    }


@app.get("/molecules/filter")
def filter_molecules(
    min_weight: float = 0,
    max_weight: float = 10000
):

    filtered = dataframe[
        (dataframe["molecular_weight"] >= min_weight)
        &
        (dataframe["molecular_weight"] <= max_weight)
    ]

    return filtered.to_dict(orient="records")


@app.get("/molecules/search")
def search_molecule(name: str):

    result = dataframe[
        dataframe["molecule_name"]
        .str.contains(name, case=False, na=False)
    ]

    return result.to_dict(orient="records")


@app.get("/stats")
def get_stats():

    weights = dataframe["molecular_weight"]

    return {
        "count": int(weights.count()),
        "average": float(weights.mean()),
        "minimum": float(weights.min()),
        "maximum": float(weights.max())
    }