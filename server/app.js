const express = require("express");
const path = require("path");

const { loadModel, loadDataAndTrainModel, predict } = require("./modules/model");
const { extractPixelDataFromImages, writePixelDataToCSV, splitDataSetCSV } = require("./modules/utils");

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

app.get("/load-model", async (req, res) => {
    const result = await loadModel();
    res.send(result === true ? "Model loaded successfully!" : result);
});

app.get("/train-model/dataset/:dataSetName", async (req, res) => {
    loadDataAndTrainModel(req.params.dataSetName);
    res.send("Model Training Initiated...");
});

app.get("/split-csv/dataset/:dataSetName/:min/:max", (req, res) => {
    const {
        params: {
            dataSetName,
            min,
            max,
        }
    } = req;

    splitDataSetCSV(dataSetName, min, max);
    res.send("CSV Split started");
});

app.get("/predict", async (req, res) => {
    const predictedValue = await predict(path.join(__dirname, "./predict.png"));

    if (predictedValue) {
        res.status(200).json(predictedValue);
    } else {
        res.status(404).json({error: "Model not ready"});
    }
});

app.listen(app.get("port"), () => {
    console.log(`App listening on port #${app.get("port")}`);
});
