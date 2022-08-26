require('dotenv').config();
const { MongoClient } = require('mongodb');

if (!process.env.MONGODB_URI) {
    throw new Error("Please add Mongo URI to .env.local");
}

const uri = process.env.MONGODB_URI;
let mongoClient;

const getClient = async () => {
    try {
        if (mongoClient) {
            return mongoClient;
        }

        mongoClient = await (new MongoClient(uri)).connect();
        // console.log("New connect established!");
        return mongoClient;
    } catch (err) {
        console.log(err);
        return null;
    }
};

const insertDocument = async (database, collection, document) => {
    try {
        const client = await getClient();
        const { insertedId } = await client.db(database).collection(collection).insertOne(document);
        // console.log(`New prediction added, with Id: ${insertedId}`);
        return insertedId;
    } catch (err) {
        return null;
    }
};

module.exports = {
    insertDocument,
};
