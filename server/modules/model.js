const tf = require("@tensorflow/tfjs-node");
const path = require("path");
const { toPixelData, getDataSetFilenameFragment } = require("./utils");

let model, modelCreated, modelReadyForPrediction;

const labels = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
    '_',
    ',',
    '.',
  ];

const numOfClasses = labels.length;

const imageWidth = 28;
const imageHeight = 28;
const imageChannels = 1;

const batchSize = 100;
const epochsValue = 100;

const createModel = () => {
    modelReadyForPrediction = false;
    model = tf.sequential();

    // Add model layers
    model.add(tf.layers.conv2d({
        inputShape: [imageWidth, imageHeight, imageChannels],
        filters: 8,
        kernelSize: 5,
        padding: "same",
        activation: "relu"
    }));

    model.add(tf.layers.maxPooling2d({
        poolSize: 2,
        strides: 2,
    }));

    model.add(tf.layers.conv2d({
        filters: 16,
        kernelSize: 5,
        padding: "same",
        activation: "relu"
    }));

    model.add(tf.layers.maxPooling2d({
        poolSize: 3,
        strides: 3
    }));

    model.add(tf.layers.flatten());

    model.add(tf.layers.dense({
        units: numOfClasses,
        activation: "softmax"
    }));

    modelCreated = true;
};

const loadModel = async () => {
    try {
        model = await tf.loadLayersModel(`file://${path.join(__dirname, "../../client/public/model/model.json")}`);
        modelReadyForPrediction = true;
        return true;
    } catch(exp) {
        return exp;
    }
};

const getDataSetPath = (dataSetName) => {
    const fileNameFragment = getDataSetFilenameFragment(dataSetName);
    const trainDataSetPath = `file://${path.resolve(path.join(__dirname, `../data/${fileNameFragment}_train.csv`))}`;
    const testDataSetPath = `file://${path.resolve(path.join(__dirname, `../data/${fileNameFragment}_train.csv`))}`;

    return [trainDataSetPath, testDataSetPath];
};

const loadData = (dataUrl) => {
    // normalize data values between 0-1
    const normalize = ({ xs, ys }) => {
        return {
            xs: Object.values(xs).map(x => x / 255),
            ys: ys.label,
        };
    };

    // transform input array (xs) to 3D tensor
    // binarize output label (ys)
    const transform = ({ xs, ys }) => {
        // Array of zeros for one-hot encoding
        const zeros = (new Array(numOfClasses)).fill(0);

        return {
            xs: tf.tensor(xs, [imageWidth, imageHeight, imageChannels]),
            ys: tf.tensor1d(zeros.map((z, i) => {
                return i === labels.indexOf(ys.toString()) ? 1 : 0;
            }))
        };
    };

    return tf.data
        .csv(dataUrl, { columnConfigs: { label: { isLabel: true } } })
        .map(normalize)
        .map(transform)
        .batch(batchSize);
};

const trainModel = async (trainingData, epochs = epochsValue) => {
    const options = {
        epochs,
        batchSize,
        verbose: 0,
        callbacks: {
            onEpochBegin: (epoch) => {
                console.log(`Epoch ${epoch + 1} of ${epochs}`);
            },
            onEpochEnd: (epoch, logs) => {
                console.log(`Training set loss: ${logs.loss.toFixed(4)}`);
                console.log(`Training set accuracy: ${logs.acc.toFixed(4)}`);
            }
        }
    };

    model.compile({
        optimizer: "adam",
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"]
    });

    // return await model.fit(trainingData, options);

    return await model.fitDataset(trainingData, options);
};

const evaluateModel = async (testingData) => {
    const result = await model.evaluateDataset(testingData);
    const testLoss = result[0].dataSync()[0];
    const testAcc = result[1].dataSync()[0];

    console.log(`Testing loss: ${testLoss.toFixed(4)}`);
    console.log(`Testing Accuracy: ${testAcc.toFixed(4)}`);
    modelReadyForPrediction = true;
};

const saveModel = async () => {
    if (modelReadyForPrediction) {
        try {
            await model.save(`file://${path.join(__dirname, "../../client/public/model")}`);
            return true;
        } catch(exp) {
            return false;
        }
    } else {
        return false;
    }
};

const predict = async (imageUrl) => {
    if (modelReadyForPrediction) {
        const pixelData = await toPixelData(imageUrl, 255);
        const imageTensor = tf.tensor(pixelData, [imageWidth, imageHeight, imageChannels]);
        const inputTensor = imageTensor.expandDims();
        const prediction = model.predict(inputTensor);
        const scores = prediction.arraySync()[0];

        const maxScore = prediction.max().arraySync();
        const maxScoreIndex = scores.indexOf(maxScore);

        const labelScores = [];
        scores.forEach((s, i) => {
            labelScores[labels[i]] = parseFloat(s.toFixed(4));
        });

        return {
            prediction: `${labels[maxScoreIndex]} (${parseInt(maxScore * 100)}%)`,
            scores: labelScores,
        };
    } else {
        return null;
    }
};

const loadDataAndTrainModel = async (dataSetName) => {
    const [ trainDataSetPath, testDataSetPath ] = getDataSetPath(dataSetName);
    let trainingData = loadData(trainDataSetPath);
    const testingData = loadData(testDataSetPath);

    // const a = await trainingData.take(5);

    // await a.forEachAsync(e => {
    //     console.log(e.ys.dataSync());
    // });

    trainingData = trainingData.shuffle(10*batchSize);

    // console.log("=================================");

    // const b = await trainingData.take(5);

    // await b.forEachAsync(e => {
    //     console.log(e.ys.dataSync());
    // });

    if (modelCreated || modelReadyForPrediction) {
        const info = await trainModel(trainingData);
        console.log(info);

        await evaluateModel(testingData);
        saveModel();
    } else {
        console.log("Model not available! Load or create model first to initiate (re)training.");
    }
};

module.exports = {
    createModel,
    loadModel,
    loadDataAndTrainModel,
    predict,
};
