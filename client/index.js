const jimp = require('jimp');
const { labels, predict } = require('./modules/model');

let lastPredictedValue;
let nextCharsFromAutofill = [];
let startPrediction = false;
const searchText = document.getElementById('searchText');
const search = document.getElementById('search');
const undo = document.getElementById('undo');
const suggestions = document.querySelectorAll('.suggestion');
const a = document.getElementById('a');
const b = document.getElementById('b');
const aOrb = document.getElementById('aOrb');

/* Canvas-related code - Start */
const canvas = document.getElementById('canvas');

const {
    left,
    top
} = canvas.getBoundingClientRect();

canvas.style.margin = 0;
canvas.style.height = '280px';
canvas.style.width = '280px';

const context = canvas.getContext('2d');
let dragging = false;
context.mozImageSmoothingEnabled = true;
context.imageSmoothingEnabled = true;

const getMousePosition = (e) => {
    let mouseX, mouseY;
    if (e.buttons !== 1) { // Device with mouse/trackpad
        mouseX = e.clientX;
        mouseY = e.clientY;
    } else { // Touchscreen device
        mouseX = e.offsetX * canvas.width / canvas.clientWidth | 0;
        mouseY = e.offsetY * canvas.height / canvas.clientHeight | 0;
    }

    return {x: mouseX, y: mouseY};
}

const clearCanvas = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

const putPoint = (e) => {
    if (dragging) {
        context.lineTo(getMousePosition(e).x, getMousePosition(e).y);
        context.lineWidth = 6;
        context.lineCap = 'round';
        context.strokeStyle = '#fff';
        context.stroke();
        context.beginPath();
        context.fill();
        context.beginPath();
        context.moveTo(getMousePosition(e).x, getMousePosition(e).y);
    }
};

const engage = (e) => {
    startPrediction = false;
    dragging = true;
    putPoint(e);
};

const disengage = () => {
    dragging = false;
    context.beginPath();
    triggerPredictTimer();
};

canvas.addEventListener('mousedown', engage);
canvas.addEventListener('mousemove', putPoint);
canvas.addEventListener('mouseup', disengage);

canvas.addEventListener("touchstart", function (e) {
    var touch = e.touches[0];

    var mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX - left,
        clientY: touch.clientY - top,
    });
    canvas.dispatchEvent(mouseEvent);
}, false);

canvas.addEventListener("touchmove", function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX - left,
        clientY: touch.clientY - top,
    });
    canvas.dispatchEvent(mouseEvent);
}, false);

canvas.addEventListener("touchend", function (e) {
        var mouseEvent = new MouseEvent("mouseup");
        canvas.dispatchEvent(mouseEvent);
}, false);

/* Canvas-related code - End */

const triggerPredictTimer = () => {
    startPrediction = true;
    setTimeout(()=> {
        readImageAndPredict();
    }, 650);
};

const findIndexOfSecondPrediction = (scores, maxScoreIndex) => {
    let indexOfSecondPrediction = maxScoreIndex === 0 ? 1 : 0;
    for (let i=0; i<scores.length; i++) {
        if (i !== maxScoreIndex) {
            if (scores[i] > scores[indexOfSecondPrediction]) {
                indexOfSecondPrediction = i;
            }
        }
    }

    return indexOfSecondPrediction;
};

const getPronounciation = (prediction) => {
    let pronounciation;
    switch(prediction) {
        case ',': pronounciation = 'comma'; break;
        case '.': pronounciation = 'dot'; break;
        case '_': pronounciation = 'space'; break;
        default: pronounciation = prediction; 
    }
    return pronounciation;
};

const populateNextCharsFromAutofill = () => {
    nextCharsFromAutofill = [];
    let autofillSuggestions = document.querySelectorAll('.pac-item-query');

    for (let suggestion of autofillSuggestions) {
        const suggestionHTML = suggestion.innerHTML;
        nextCharsFromAutofill.push(suggestionHTML.charAt(suggestionHTML.indexOf('/span>') + 6).toLowerCase());
    }
};

const improvePrediction = (correctLabel) => {
    const prediction = {
        label: correctLabel,
        value: lastPredictedValue,
    };

    fetch("https://api-nav-assist.vercel.app/incorrect-prediction", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({prediction}),
    });
    lastPredictedValue = null;
};

const forceSearchTextChange = () => {
    search.focus();
    searchText.focus();
};

const readImageAndPredict = async () => {
    // debugStatus.innerHTML = `startPrediction ${startPrediction}`;
    if (startPrediction) {
        startPrediction = false;
        if (window.resetAddressEntry) { // Reset searchText if user has already chosen an address from suggestions
            searchText.value = '';
            window.placeUrl = null;
            window.resetAddressEntry = false;
        }

        populateNextCharsFromAutofill();
        const imageWidth=28, imageHeight=28, imageChannels=1;
        const pixelData = [];
        const dataURL = canvas.toDataURL();
        clearCanvas();

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
        lastPredictedValue = pixelData.map(v=>v*255).toString();
        const result = predict(pixelData, imageWidth, imageHeight, imageChannels);
        if (result) {
            const {
                prediction,
                confidence,
                scores,
                maxScoreIndex,
            } = result;

            if (confidence >= 50 || nextCharsFromAutofill.includes(prediction.toLowerCase())) {
                speechSynthesis.speak(new SpeechSynthesisUtterance(getPronounciation(prediction)));
                searchText.value += prediction === '_' ? ' ' : prediction;
                forceSearchTextChange();
            } else {
                a.innerHTML = prediction;
                // Find index of 2nd most probable prediction
                const secondPrediction = labels[findIndexOfSecondPrediction(scores, maxScoreIndex)];
                b.innerHTML = secondPrediction;
                aOrb.classList.remove('hide');

                speechSynthesis.speak(new SpeechSynthesisUtterance(`Is it ${getPronounciation(prediction)} OR ${getPronounciation(secondPrediction)}?`));
            }
        }
    }
};

search.addEventListener('click', () => {
    if (window.placeUrl) {
        window.open(window.placeUrl);
    } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURI(searchText.value)}`);
    }
});

undo.addEventListener('click', () => {
    const searchValue = searchText.value;
    if (window.sendPredictionData === 'true' && lastPredictedValue) {
        improvePrediction('');
    }
    searchText.value = searchValue.substring(0, searchValue.length - 1);
    forceSearchTextChange();
});

suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', (e) => {
        if (e.target.innerHTML !== '&nbsp;') {
            // Use the value user chose
            searchText.value += e.target.innerHTML === '_' ? ' ' : e.target.innerHTML;
            forceSearchTextChange();
        }

        if (window.sendPredictionData === 'true' && lastPredictedValue) {
            improvePrediction(e.target.innerHTML.replace('&nbsp;', ''));
        }

        aOrb.classList.add('hide');
    });
});

document.getElementById('clearText').addEventListener('click', () => {
    searchText.value = '';
});
