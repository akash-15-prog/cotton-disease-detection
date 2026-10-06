const imageInput =
    document.getElementById("imageInput");

const browseButton =
    document.getElementById("browseButton");

const dropZone =
    document.getElementById("dropZone");

const uploadContent =
    document.getElementById("uploadContent");

const previewContainer =
    document.getElementById("previewContainer");

const preview =
    document.getElementById("preview");

const removeImage =
    document.getElementById("removeImage");

const fileInfo =
    document.getElementById("fileInfo");

const fileName =
    document.getElementById("fileName");

const fileSize =
    document.getElementById("fileSize");

const predictButton =
    document.getElementById("predictButton");

const loading =
    document.getElementById("loading");

const result =
    document.getElementById("result");

const prediction =
    document.getElementById("prediction");

const confidence =
    document.getElementById("confidence");

const confidenceFill =
    document.getElementById("confidenceFill");

const probabilityList =
    document.getElementById("probabilityList");

const predictionMessage =
    document.getElementById("predictionMessage");

const newAnalysis =
    document.getElementById("newAnalysis");


// ==================================================
// OPEN FILE SELECTOR
// ==================================================

browseButton.addEventListener(
    "click",
    function () {

        imageInput.click();

    }
);


// ==================================================
// FILE SELECTED
// ==================================================

imageInput.addEventListener(
    "change",
    function () {

        const file =
            imageInput.files[0];

        if (file) {

            showImage(file);

        }

    }
);


// ==================================================
// SHOW IMAGE
// ==================================================

function showImage(file) {

    // Check file type

    const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (!validTypes.includes(file.type)) {

        alert(
            "Please select a JPG, PNG or WEBP image."
        );

        imageInput.value = "";

        return;

    }


    // Preview

    const imageURL =
        URL.createObjectURL(file);

    preview.src =
        imageURL;


    uploadContent.style.display =
        "none";


    previewContainer.style.display =
        "flex";


    fileInfo.style.display =
        "flex";


    fileName.textContent =
        file.name;


    fileSize.textContent =
        formatFileSize(file.size);


    dropZone.classList.remove(
        "drag-over"
    );

}


// ==================================================
// FILE SIZE
// ==================================================

function formatFileSize(bytes) {

    if (bytes < 1024) {

        return bytes + " B";

    }


    if (bytes < 1024 * 1024) {

        return (
            (bytes / 1024).toFixed(1)
            + " KB"
        );

    }


    return (
        (bytes / (1024 * 1024)).toFixed(1)
        + " MB"
    );

}


// ==================================================
// DRAG AND DROP
// ==================================================

dropZone.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        dropZone.classList.add(
            "drag-over"
        );

    }
);


dropZone.addEventListener(
    "dragleave",
    function () {

        dropZone.classList.remove(
            "drag-over"
        );

    }
);


dropZone.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        dropZone.classList.remove(
            "drag-over"
        );


        const file =
            event.dataTransfer.files[0];


        if (file) {

            imageInput.files =
                event.dataTransfer.files;

            showImage(file);

        }

    }
);


// ==================================================
// REMOVE IMAGE
// ==================================================

removeImage.addEventListener(
    "click",
    function () {

        resetUpload();

    }
);


// ==================================================
// PREDICT DISEASE
// ==================================================

predictButton.addEventListener(
    "click",
    async function () {

        const file =
            imageInput.files[0];


        if (!file) {

            alert(
                "Please select a cotton leaf image first."
            );

            return;

        }


        // Show loading

        predictButton.disabled =
            true;

        predictButton.style.display =
            "none";

        loading.style.display =
            "flex";

        result.style.display =
            "none";


        // Prepare image

        const formData =
            new FormData();


        formData.append(
            "image",
            file
        );


        try {

            const response =
                await fetch(
                    "/predict",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (!data.success) {

                throw new Error(
                    data.error ||
                    "Prediction failed."
                );

            }


            // Display result

            displayResult(data);


        }

        catch (error) {

            console.error(
                "Prediction error:",
                error
            );


            alert(
                "Prediction failed: "
                + error.message
            );

        }


        finally {

            loading.style.display =
                "none";

            predictButton.style.display =
                "flex";

            predictButton.disabled =
                false;

        }

    }
);


// ==================================================
// DISPLAY RESULT
// ==================================================

function displayResult(data) {

    const disease =
        formatDiseaseName(
            data.prediction
        );


    prediction.textContent =
        disease;


    confidence.textContent =
        data.confidence + "%";


    // Animate confidence bar

    confidenceFill.style.width =
        "0%";


    setTimeout(
        function () {

            confidenceFill.style.width =
                data.confidence + "%";

        },
        100
    );


    // Prediction message

    predictionMessage.innerHTML =
        getPredictionMessage(
            data.prediction,
            data.confidence
        );


    // Probability bars

    probabilityList.innerHTML =
        "";


    const sorted =
        Object.entries(
            data.probabilities
        ).sort(
            (a, b) => b[1] - a[1]
        );


    sorted.forEach(
        function ([name, value], index) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "probability-item";


            item.innerHTML = `

                <div class="probability-label">

                    <span>
                        ${formatDiseaseName(name)}
                    </span>

                    <strong>
                        ${value}%
                    </strong>

                </div>

                <div class="bar">

                    <div
                        class="bar-fill"
                        data-width="${value}%"
                    ></div>

                </div>

            `;


            probabilityList.appendChild(
                item
            );


            // Animate bars one by one

            setTimeout(
                function () {

                    const bar =
                        item.querySelector(
                            ".bar-fill"
                        );

                    bar.style.width =
                        value + "%";

                },
                150 + index * 150
            );

        }
    );


    // Show result

    result.style.display =
        "block";


    // Scroll smoothly

    setTimeout(
        function () {

            result.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        },
        200
    );

}


// ==================================================
// DISEASE MESSAGE
// ==================================================

function getPredictionMessage(
    disease,
    confidence
) {

    const messages = {

        "healthy":
            "The model classified this leaf as healthy. No strong visual pattern matching the trained disease classes was detected.",

        "bacterial_blight":
            "The model detected visual patterns associated with bacterial blight. Consider further inspection of the affected plant.",

        "fussarium_wilt":
            "The model detected visual patterns associated with Fussarium wilt. Further field inspection is recommended.",

        "curl_virus":
            "The model detected visual patterns associated with curl virus. Inspect the crop for additional symptoms."
    };


    let message =
        messages[disease]
        ||
        "The CNN has completed its classification based on the trained disease classes.";


    if (confidence >= 90) {

        message +=
            " The prediction has a high model confidence.";

    }

    else if (confidence >= 70) {

        message +=
            " The prediction has moderate-to-high model confidence.";

    }

    else {

        message +=
            " Consider providing a clearer leaf image for another analysis.";

    }


    return message;

}


// ==================================================
// FORMAT DISEASE NAME
// ==================================================

function formatDiseaseName(name) {

    return name
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


// ==================================================
// NEW ANALYSIS
// ==================================================

newAnalysis.addEventListener(
    "click",
    function () {

        result.style.display =
            "none";


        resetUpload();


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }
);


// ==================================================
// RESET
// ==================================================

function resetUpload() {

    imageInput.value =
        "";


    preview.src =
        "";


    uploadContent.style.display =
        "block";


    previewContainer.style.display =
        "none";


    fileInfo.style.display =
        "none";


    confidenceFill.style.width =
        "0%";


    prediction.textContent =
        "—";


    confidence.textContent =
        "0%";

}