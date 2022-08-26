const express = require("express");
const cors = require('cors');
const { insertPrediction } = require("./modules/services");

const app = express();

app.set("port", (process.env.PORT || 5001));

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5000','https://nav-assist.vercel.app']
}));

app.post("/incorrect-prediction", (req, res) => {
    const {
        body: {
            prediction,
        }
    } = req;

    insertPrediction(prediction);
    res.status(200).send();
});

app.listen(app.get("port"), () => {
    console.log(`App listening on port #${app.get("port")}`);
});
