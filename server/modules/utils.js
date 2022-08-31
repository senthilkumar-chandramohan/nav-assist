const jimp = require("jimp");
const glob = require("glob");
const path = require("path");
const { convertArrayToCSV } = require("convert-array-to-csv");
const fs = require("fs");
const fastCsv = require("fast-csv");

const pixelDataForTraining = [];
const pixelDataForTesting = [];
const imageWidth = 28, imageHeight = 28;

const getDataSetFilenameFragment = (dataSetName) => {
    let fileNameFragment;
    switch (dataSetName) {
        case "original": fileNameFragment = "dataset"; break;
        case "update": fileNameFragment = "update_dataset"; break;
        default: fileNameFragment = "dataset";
    }
    return fileNameFragment;
};

const toPixelData = async (imagePath, normalizeBase=1) => {
    const pixelData = [];
    const image = await jimp.read(imagePath);
    await image
        .resize(imageWidth, imageHeight)
        .greyscale()
        .invert()
        .scan(0, 0, imageWidth, imageHeight, (x, y, idx) => {
            let v = image.bitmap.data[idx + 0];
            pixelData.push(v===1 ? 0 : v/normalizeBase);
        });

    return pixelData;
};

const writePixelDataToCSV = () => {
    // Create directory if it doesn"t exist
    const dir = path.join(__dirname, "../data");

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Save Training CSV
    const trainingCSV = convertArrayToCSV(pixelDataForTraining);

    fs.appendFile(path.resolve(path.join(__dirname, `../data/dataset_train.csv`)), trainingCSV, "utf8", function (err) {
        if (err) {
          console.log("Some error occured - file either not saved or corrupted file saved.");
        } else {
          console.log("Training CSV saved!");
        }
    });

    // Save Testing CSV
    const testingCSV = convertArrayToCSV(pixelDataForTesting);

    fs.appendFile(path.resolve(path.join(__dirname, `../data/dataset_test.csv`)), testingCSV, "utf8", function (err) {
        if (err) {
          console.log("Some error occured - file either not saved or corrupted file saved.");
        } else {
          console.log("Testing CSV saved!");
        }
    });
};

const extractPixelDataFromImages = () => {
    let totalFilesProcessed = 0;
    const labelFolderMap = [];
    pixelDataForTraining.length = 0;
    pixelDataForTesting.length = 0;

    // for (let i=0; i<26; i++) {
    //     var alphabet = String.fromCharCode(i + 65); // char code of 'A' is 65
    //     labelFolderMap.push({
    //         label: alphabet,
    //         folder: `_${alphabet}`,
    //     });
    // }

    for (let i=0; i<=9; i++) {
        labelFolderMap.push({
            label: i.toString(),
            folder: i.toString(),
        });
    }

    labelFolderMap.push({ label: "U", folder: "_U" });
    labelFolderMap.push({ label: "_", folder: "space" });
    // labelFolderMap.push({ label: ",", folder: "comma" });

    for (let labelFolder of labelFolderMap) {
        const {
            label,
            folder,
        } = labelFolder;

        console.log(label, folder);

        const options = {
            cwd: path.resolve(path.join(__dirname, `../images/dataset/${folder}/`)),
        };

        glob("*(*.png|*.jpg)", options, async (er, files) => {
            console.log(files);
            for(const file of files) {
                const pixelData = await toPixelData(`${options.cwd}/${file}`);
                pixelData.unshift(label);
                
                totalFilesProcessed += 1;
                console.log(label, folder, options.cwd);
                console.log(totalFilesProcessed);
                // Save pixelData under training and testing dataset alternatively
                if (totalFilesProcessed % 2 === 0) {
                    pixelDataForTraining.push(pixelData);
                } else {
                    pixelDataForTesting.push(pixelData);
                }
            }
        });
    }
};

const splitDataSetCSV = (dataSetName, min, max) => {
    const trainingCSVdata = [];
    const testingCSVData = [];

    const options = {headers: false, delimiters: ","};

    let count = 0;
    const fileNameFragment = getDataSetFilenameFragment(dataSetName);
    

    fastCsv
        .parseFile(path.resolve(path.join(__dirname, `../data/${fileNameFragment}.csv`)), options)
        .on("data", d => {
            if (count > min && count < max) { // pick first 2000 records
                // if (!math.isNaN(d[0])) { // Replace label numbers with alphabets
                //     d[0] = String.fromCharCode(parseInt(d[0]) + 65);
                // }
                if (count % 2 === 0) {
                    trainingCSVdata.push(d);
                } else {
                    testingCSVData.push(d);
                }
            }   

            count += 1;
        })
        .on("end", () => {
            fastCsv
                .write(trainingCSVdata, options)
                .pipe(fs.createWriteStream(path.resolve(path.join(__dirname, `../data/${fileNameFragment}_train.csv`)), { flags: "a" }));

            fastCsv
                .write(testingCSVData, options)
                .pipe(fs.createWriteStream(path.resolve(path.join(__dirname, `../data/${fileNameFragment}_test.csv`)), { flags: "a" }));
        
            console.log("Writing CSV data complete!");
        });
};

module.exports = {
    extractPixelDataFromImages,
    writePixelDataToCSV,
    toPixelData,
    splitDataSetCSV,
    getDataSetFilenameFragment,
};
