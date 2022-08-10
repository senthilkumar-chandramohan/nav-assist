const tf = require("@tensorflow/tfjs-node");
const path = require("path");
const { toPixelData } = require("./utils");

let model, modelReady = false;

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
    // 'a',
    // 'b',
    // 'c',
    // 'd',
    // 'e',
    // 'f',
    // 'g',
    // 'h',
    // 'i',
    // 'j',
    // 'k',
    // 'l',
    // 'm',
    // 'n',
    // 'o',
    // 'p',
    // 'q',
    // 'r',
    // 's',
    // 't',
    // 'u',
    // 'v',
    // 'w',
    // 'x',
    // 'y',
    // 'z',
    '_',
    ',',
    '.',
  ];

const numOfClasses = labels.length;

const imageWidth = 28;
const imageHeight = 28;
const imageChannels = 1;

const batchSize = 1000;
const epochsValue = 50;

const loadModel = async () => {
    try {
        model = await tf.loadLayersModel(`file://${path.join(__dirname, "../../client/public/model/model.json")}`);
        modelReady = true;
        return true;
    } catch(exp) {
        return exp;
    }
}

const createModel = () => {
    const model = tf.sequential();

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

    model.compile({
        optimizer: "adam",
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"]
    });

    return model;
};

const trainModel = async (model, trainingData, epochs = epochsValue) => {
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

    return await model.fitDataset(trainingData, options);
};

const evaluateModel = async (model, testingData) => {
    const result = await model.evaluateDataset(testingData);
    const testLoss = result[0].dataSync()[0];
    const testAcc = result[1].dataSync()[0];

    console.log(`Testing loss: ${testLoss.toFixed(4)}`);
    console.log(`Testing Accuracy: ${testAcc.toFixed(4)}`);
}

const saveModel = async () => {
    if (modelReady) {
        try {
            await model.save(`file://${path.join(__dirname, "../../client/public/model")}`);
            return true;
        } catch(exp) {
            return false;
        }
    } else {
        return false;
    }
}

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

const predict = async (imageUrl) => {
    if (modelReady) {
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
}

const createAndTrainModel = async () => {
    const trainingData = loadData(`file://${path.resolve(path.join(__dirname, "../data/a_z_dataset_train2.csv"))}`);
    const testingData = loadData(`file://${path.resolve(path.join(__dirname, "../data/a_z_dataset_test2.csv"))}`);

    model = createModel();
    const info = await trainModel(model, trainingData);
    console.log(info);

    await evaluateModel(model, testingData);
    modelReady = true;
    saveModel();
};

module.exports = {
    createAndTrainModel,
    predict,
    loadModel,
};