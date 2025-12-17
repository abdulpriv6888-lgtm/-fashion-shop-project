const mongoose = require("mongoose");
const csv = require("csvtojson");

const uri = "mongodb+srv://softmatofficial7271_db_user:CvXG9LPKSON7GvOx@fashioncluster.ffeblzu.mongodb.net/FashionDB";

async function importCSV() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB Atlas");

    const jsonArray = await csv().fromFile("D:/FashionShopData/fashion_Dataset (1).csv");

    const collection = mongoose.connection.collection("FashionShopData");

    await collection.insertMany(jsonArray);

    console.log("CSV import successful! Total records:", jsonArray.length);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

importCSV();
