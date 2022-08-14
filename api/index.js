const express = require("express");
const app = express();

app.set("port", (process.env.PORT || 5001));

app.post("/incorrect-predictions", (req, res) => {
    res.status(200).json({status: "SUCCESS"});
});

app.listen(app.get("port"), () => {
    console.log(`App listening on port #${app.get("port")}`);
});
