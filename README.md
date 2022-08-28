# nav-assist
An AI/ML-powered navigation assist app that allows user to input destination address using hand-drawn symbols.

# Steps to run application
1. Clone the project https://github.com/senthilkumar-chandramohan/nav-assist
2. cd into nav-assist folder and run 'npm install'
3. Then cd into client folder and run 'npm install'
4. cd ..,  run 'npm start' and visit http://localhost:5000 to open the application

# Code changes
1. If you make any code changes under 'server' folder, simply restart the application to see changes
2. If you make any code changes under 'client' folder, cd into client folder, run 'npm run build' and refresh page; please make sure to delete all cached items under Chrome Dev console => Applications tab => Cache Storage => http://localhost:5000 (or equivalent in other browsers)
3. If you use VS Code, install 'Easy LESS' plugin so it can compile LESS to CSS and output to public/less folder (use equivalent plugin for other Editors/IDEs)

# Steps to train model
1. The trained model is available under client/public/model folder
2. If you have raw images (with roughly same height and width), using which you want to train a new model:
    a. Put your images under server/images/dataset folder (each alphabet/number/symbol under a separate folder)
    b. Update code under server/modules/utils.js => extractPixelDataFromImages(), to populate labelFolderMap array (for e.g., labelFolderMap.push({ label: "A", folder: "_A" }))
    c. Run the app and visit http://localhost:5000/extract-pixel-data-from-images, this will read image files, downsize them to 28 x 28 px, convert them to bitmaps and save them to (training and testing) arrays
    d. Once extraction process is complete (previous process stops logging), visit http://localhost:5000/export-to-csv to save the bitmap data in CSV (training and testing) files under server/data folder, please make sure the files have headers (refer existing files) added before doing this step. NOTE: If files already have bitmap data, new data will be appended
3. If you have image bitmap dataset (downloaded from Kaggle or something) to train a new model, put it under server/data/, separating training and testing dataset under dataset_train.csv and dataset_test.csv, please make sure the CSV files have header with label first followed by pixel indexes (e.g., label, pixel1, pixel2, pixel3, ..... , pixel784)
4. Once the training and testing data are saved in CSV files (dataset_train.csv and dataset_test.csv), visit http://localhost:5000/train-model/dataset/original for application to create, train and test a new model
5. You can change the model parameters under server/modules/model.js => createModel() for best results
