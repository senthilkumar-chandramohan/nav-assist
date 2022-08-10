const express = require("express");
const path = require("path");

const { createAndTrainModel, predict, loadModel } = require("./modules/model");
const { extractPixelDataFromImages, writePixelDataToCSV, splitCSV } = require("./modules/utils");

const app = express();

app.set("port", (process.env.PORT || 5000));
app.use("/", express.static(path.join(__dirname, "../client/public")));

app.get("/extract-pixel-data-from-images", (req, res) => {
    extractPixelDataFromImages();
    res.send("Extraction started!");
});

app.get("/export-to-csv", (req, res) => {
    writePixelDataToCSV();
    res.send("Export started!");
});

app.get("/train-model", async (req, res) => {
    createAndTrainModel();
    res.send("Model Training Initiated...");
});

app.get("/load-model", async (req, res) => {
    const result = await loadModel();
    res.send(result === true ? "Model loaded successfully!" : result);
});

app.get("/split-csv", (req, res) => {
    splitCSV();
    res.send("CSV Split started");
});

app.get("/predict", async (req, res) => {
    const predictedNumber = await predict(path.join(__dirname, "./predict.png"));

    if (predictedNumber) {
        res.status(200).json(predictedNumber);
    } else {
        res.status(404).json({error: "Model not ready"});
    }
});

app.listen(app.get("port"), () => {
    console.log(`App listening on port #${app.get("port")}`);
});
