import * as tf from '@tensorflow/tfjs';

let model;

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
    '_',
  ];

(async function() {
    model = await tf.loadLayersModel('model/model.json');
})();

const predict = (pixelData, imageWidth, imageHeight, imageChannels) => {
    if (model) {
        const imageTensor = tf.tensor(pixelData, [imageWidth, imageHeight, imageChannels]);
        const inputTensor = imageTensor.expandDims();
        const prediction = model.predict(inputTensor);
        const scores = prediction.arraySync()[0];

        const maxScore = prediction.max().arraySync();
        const maxScoreIndex = scores.indexOf(maxScore);

        return {
            prediction: labels[maxScoreIndex],
            confidence: parseInt(maxScore * 100),
            scores: scores.map(s=>parseFloat(s.toFixed(4))),
            maxScoreIndex,
        };
    }
    return null;
};

export {
    labels,
    predict,
};
