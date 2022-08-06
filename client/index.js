const jimp = require("jimp");
import * as tf from '@tensorflow/tfjs';
require('./less/master.less');

let model;
const labels = ['0','1','2','3','4','5','6','7','8','9'];
let startPrediction = false;
const searchText = document.getElementById('searchText');
const search = document.getElementById('search');
const undo = document.getElementById('undo');
const suggestions = document.querySelectorAll('.suggestion');
const a = document.getElementById('a');
const b = document.getElementById('b');
const aOrb = document.getElementById('aOrb');

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
    } else {
        return null;
    }
};

const canvas = document.getElementById('canvas');
canvas.style.margin = 0;
canvas.style.height = '280px';
canvas.style.width = '280px';

// get canvas 2D context and set him correct size
const ctx = canvas.getContext('2d');
ctx.fillStyle="rgb(0,0,0)"
ctx.fillRect(0, 0, canvas.width, canvas.height);

// last known position
const pos = { x: 0, y: 0 };

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('mousedown', setPosition);
canvas.addEventListener('touchstart', setPosition);
// canvas.addEventListener('mouseenter', setPosition);
canvas.addEventListener('mouseup', triggerPredictTimer);
canvas.addEventListener('touchend', triggerPredictTimer);

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle="rgb(0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// new position from mouse event
function setPosition(e) {
    startPrediction = false;
    // console.log("startPrediction", startPrediction);
    pos.x = e.offsetX;
    pos.y = e.offsetY;
}

function draw(e) {
    // mouse left button must be pressed
    if (e.buttons !== 1) return;

    ctx.beginPath(); // begin

    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff';

    ctx.moveTo(pos.x, pos.y); // from
    setPosition(e);
    ctx.lineTo(pos.x, pos.y); // to

    ctx.stroke(); // draw it!
}

// document.getElementById('predict').addEventListener('click', async function() {

function triggerPredictTimer() {
    startPrediction = true;
    // console.log("startPrediction", startPrediction);
    setTimeout(()=> {
        readImageAndPredict();
    }, 500);
};

function findIndexOfSecondPrediction(scores, maxScoreIndex) {
    let indexOfSecondPrediction = maxScoreIndex === 0 ? 1 : 0;
    for (let i=0; i<scores.length; i++) {
        if (i !== maxScoreIndex) {
            if (scores[i] > scores[indexOfSecondPrediction]) {
                indexOfSecondPrediction = i;
            }
        }
    }

    return indexOfSecondPrediction;
}

async function readImageAndPredict() {
    // console.log("startPrediction", startPrediction);
    if (startPrediction) {
        const imageWidth=28, imageHeight=28, imageChannels=1;
        const pixelData = [];
        const dataURL = canvas.toDataURL();
        // document.getElementById("canvasimg").src = dataURL;

        const image = await jimp.default.read(dataURL);

        await image
            .resize(imageWidth, imageHeight)
            .greyscale()
            // .getBase64Async("image/png")
            .scan(0, 0, imageWidth, imageHeight, (x, y, idx) => {
                let v = image.bitmap.data[idx + 0];
                pixelData.push(v===0?0.0039216:v/255);
            });

        // document.getElementById("canvasimg").src = processedImage;
        // console.log(pixelData);
        const result = predict(pixelData, imageWidth, imageHeight, imageChannels);
        if (result) {
            const {
                prediction,
                confidence,
                scores,
                maxScoreIndex,
            } = result;

            console.log(scores);

            if (confidence >= 50) {
                speechSynthesis.speak(new SpeechSynthesisUtterance(prediction));
                searchText.value += prediction;
                clearCanvas();
            } else {
                a.innerHTML = prediction;
                // Find index of 2nd most probable prediction
                b.innerHTML = labels[findIndexOfSecondPrediction(scores, maxScoreIndex)];
                aOrb.classList.remove('hide');
            }
        }
    }
}

search.addEventListener('click', () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURI(searchText.value)}`);
});

undo.addEventListener('click', () => {
    const searchValue = searchText.value;
    searchText.value = searchValue.substring(0, searchValue.length - 1);
});

suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', (e) => {
        console.log(e.target.innerHTML);
        if (e.target.innerHTML !== "&nbsp;") {
            // Use the value user chose
            searchText.value += e.target.innerHTML;
        }
        aOrb.classList.add('hide');
        clearCanvas();
    });
});