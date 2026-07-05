import mongoose from "mongoose";
import fs from "fs";

async function check() {
    let logContent = "";
    const log = (msg) => {
        logContent += msg + "\n";
        console.log(msg);
    };

    try {
        await mongoose.connect("mongodb://localhost:27017/ebookshelf");
        log("Connected successfully!");
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        log("Collections in ebookshelf database:");
        for (let col of collections) {
            const count = await db.collection(col.name).countDocuments();
            log(` - ${col.name}: ${count} documents`);
        }
        fs.writeFileSync("check_output.txt", logContent);
        process.exit(0);
    } catch (err) {
        log("Error: " + err.message + "\n" + err.stack);
        fs.writeFileSync("check_output.txt", logContent);
        process.exit(1);
    }
}

check();
