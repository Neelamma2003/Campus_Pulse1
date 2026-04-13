from flask import Flask, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

df = pd.read_csv("../data/data.csv")

@app.route("/")
def home():
    return "API Running"

# ✅ ADD THIS (IMPORTANT)
@app.route("/data")
def get_data():
    return df.to_json(orient="records")

@app.route("/filter")
def filter_data():
    facility = request.args.get("facility")
    filtered = df[df["facility"] == facility]
    return filtered.to_json(orient="records")

if __name__ == "__main__":
    app.run(debug=True)