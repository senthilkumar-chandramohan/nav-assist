const { insertDocument } = require("./db");

const insertPrediction = (prediction) => {
    const database = "nav-assist";
    const collection = "incorrect-predictions";

    insertDocument(database, collection, prediction);
};

module.exports = {
    insertPrediction,
};
