from flask import Flask, render_template, request, jsonify
import os
import json

import numpy as np
from PIL import Image
import tensorflow as tf


app = Flask(__name__)


# --------------------------------------------------
# PROJECT PATHS
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "cotton_disease_cnn.keras"
)

CLASS_NAMES_PATH = os.path.join(
    BASE_DIR,
    "model",
    "class_names.json"
)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "uploads"
)


# --------------------------------------------------
# IMAGE SIZE
# --------------------------------------------------

IMG_SIZE = 128


# --------------------------------------------------
# ALLOWED IMAGE TYPES
# --------------------------------------------------

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp"
}


os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

print("----------------------------------------")
print("Loading CNN model...")
print("----------------------------------------")

model = tf.keras.models.load_model(MODEL_PATH)

print("CNN model loaded successfully!")


# --------------------------------------------------
# LOAD CLASS NAMES
# --------------------------------------------------

with open(CLASS_NAMES_PATH, "r") as file:
    class_names = json.load(file)

print("Class names:", class_names)


# --------------------------------------------------
# CHECK FILE
# --------------------------------------------------

def allowed_file(filename):

    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# --------------------------------------------------
# HOME PAGE
# --------------------------------------------------

@app.route("/")
def home():

    return render_template("index.html")


# --------------------------------------------------
# PREDICTION
# --------------------------------------------------

@app.route("/predict", methods=["POST"])
def predict():

    try:

        if "image" not in request.files:

            return jsonify({
                "success": False,
                "error": "No image was uploaded."
            }), 400


        file = request.files["image"]


        if file.filename == "":

            return jsonify({
                "success": False,
                "error": "Please select an image."
            }), 400


        if not allowed_file(file.filename):

            return jsonify({
                "success": False,
                "error": "Only JPG, JPEG, PNG and WEBP images are allowed."
            }), 400


        # --------------------------------------------------
        # IMAGE PREPROCESSING
        # --------------------------------------------------

        image = Image.open(file).convert("RGB")

        image = image.resize(
            (IMG_SIZE, IMG_SIZE)
        )

        image_array = np.array(
            image,
            dtype=np.float32
        )

        image_array = image_array / 255.0

        image_array = np.expand_dims(
            image_array,
            axis=0
        )


        # --------------------------------------------------
        # PREDICTION
        # --------------------------------------------------

        predictions = model.predict(
            image_array,
            verbose=0
        )[0]


        predicted_index = int(
            np.argmax(predictions)
        )


        predicted_class = class_names[
            predicted_index
        ]


        confidence = float(
            predictions[predicted_index] * 100
        )


        # --------------------------------------------------
        # PROBABILITIES
        # --------------------------------------------------

        probabilities = {}

        for i, class_name in enumerate(class_names):

            probabilities[class_name] = round(
                float(predictions[i] * 100),
                2
            )


        return jsonify({

            "success": True,

            "prediction": predicted_class,

            "confidence": round(
                confidence,
                2
            ),

            "probabilities": probabilities

        })


    except Exception as e:

        print(
            "Prediction error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# --------------------------------------------------
# START SERVER
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )