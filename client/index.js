const jimp = require('jimp');
import * as tf from '@tensorflow/tfjs';
require('./node_modules/bootstrap/dist/css/bootstrap-grid.min.css');
require('./less/master.less');

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

var context = canvas.getContext('2d');
var radius = 2;
var dragging = false;

function getMousePosition(e) {
    let mouseX, mouseY;
    if (e.buttons !== 1) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    } else {
        mouseX = e.offsetX * canvas.width / canvas.clientWidth | 0;
        mouseY = e.offsetY * canvas.height / canvas.clientHeight | 0;
    }

    // console.log(e.isTouch, mouseX, mouseY);
    return {x: mouseX, y: mouseY};
}

context.mozImageSmoothingEnabled = false;
context.imageSmoothingEnabled = false;

/* CLEAR CANVAS */
function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

var putPoint = function (e) {
    // e.preventDefault();
    // e.stopPropagation();
    if (dragging) {
        context.lineTo(getMousePosition(e).x, getMousePosition(e).y);
        context.lineWidth = radius * 2;
        context.lineWidth = 6;
        context.lineCap = 'round';
        context.strokeStyle = '#fff';
        context.stroke();
        context.beginPath();
        // context.arc(getMousePosition(e).x, getMousePosition(e).y, radius, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.moveTo(getMousePosition(e).x, getMousePosition(e).y);
    }
};

var engage = function (e) {
    // console.log("A", e);
    startPrediction = false;
    dragging = true;
    putPoint(e);
};

var disengage = function () {
    dragging = false;
    context.beginPath();
    triggerPredictTimer();
};

canvas.addEventListener('mousedown', engage);
canvas.addEventListener('mousemove', putPoint);
canvas.addEventListener('mouseup', disengage);
// document.addEventListener('mouseup', disengage);
canvas.addEventListener('contextmenu', disengage);

// canvas.addEventListener('touchstart', engage, false);
//canvas.addEventListener('touchmove', putPoint, false);
// canvas.addEventListener('touchend', disengage, false);

const {
    left,
    top
} = canvas.getBoundingClientRect();

canvas.addEventListener("touchstart", function (e) {
    var touch = e.touches[0];
    // console.log('touch start');
    // console.log(touch);
    
    // console.log(left, top);

    var mouseEvent = new MouseEvent("mousedown", {
        isTouch: true,
        clientX: touch.clientX - left,
        clientY: touch.clientY - top,
    });
    canvas.dispatchEvent(mouseEvent);
    }, false);

canvas.addEventListener("touchmove", function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
        isTouch: true,
        clientX: touch.clientX - left,
        clientY: touch.clientY - top,
    });
    canvas.dispatchEvent(mouseEvent);
  }, false);

  canvas.addEventListener("touchend", function (e) {
        var touch = e.touches[0];
        // console.log('touch end');
        // console.log(touch);
        var mouseEvent = new MouseEvent("mouseup");
        canvas.dispatchEvent(mouseEvent);
      }, false);

/************************************* */

// document.getElementById('predict').addEventListener('click', async function() {

function triggerPredictTimer() {
    startPrediction = true;
    // console.log('startPrediction', startPrediction);
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

function getPronounciation(prediction) {
    let pronounciation;
    switch(prediction) {
        case ',': pronounciation = 'comma'; break;
        case '.': pronounciation = 'dot'; break;
        case '_': pronounciation = 'space'; break;
        default: pronounciation = prediction; 
    }
    return pronounciation;
}

async function readImageAndPredict() {
    // console.log('startPrediction', startPrediction);
    if (startPrediction) {
        const imageWidth=28, imageHeight=28, imageChannels=1;
        const pixelData = [];
        const dataURL = canvas.toDataURL();
        // document.getElementById('canvasimg').src = dataURL;

        const image = await jimp.default.read(dataURL);

        await image
            .resize(imageWidth, imageHeight)
            .greyscale()
            // .getBase64Async('image/png')
            .scan(0, 0, imageWidth, imageHeight, (x, y, idx) => {
                let v = image.bitmap.data[idx + 0];
                pixelData.push(v/255);
            });

        // document.getElementById('canvasimg').src = processedImage;
        // console.log(pixelData);
        const result = predict(pixelData, imageWidth, imageHeight, imageChannels);
        if (result) {
            const {
                prediction,
                confidence,
                scores,
                maxScoreIndex,
            } = result;
            console.log(result);

            if (confidence >= 50) {
                speechSynthesis.speak(new SpeechSynthesisUtterance(getPronounciation(prediction.toUpperCase())));
                searchText.value += prediction === '_' ? ' ' : prediction.toUpperCase();
                clearCanvas();
            } else {
                a.innerHTML = prediction.toUpperCase();
                // Find index of 2nd most probable prediction
                const secondPrediction = labels[findIndexOfSecondPrediction(scores, maxScoreIndex)];
                b.innerHTML = secondPrediction.toUpperCase();
                aOrb.classList.remove('hide');

                speechSynthesis.speak(new SpeechSynthesisUtterance(`Is it ${getPronounciation(prediction.toUpperCase())} OR ${getPronounciation(secondPrediction.toUpperCase())}?`));
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
        if (e.target.innerHTML !== '&nbsp;') {
            // Use the value user chose
            searchText.value += e.target.innerHTML === '_' ? ' ' : e.target.innerHTML;
        }
        aOrb.classList.add('hide');
        clearCanvas();
    });
});
