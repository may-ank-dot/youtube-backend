import connectDB from "./db/connect.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config()

connectDB()
    .then(()=> {
        app.listen(8000 || process.env.PORT, () => {
            console.log(`Server is running on PORT: ${process.env.PORT}`);
        })
    })
    .catch(error=> {
        console.log(`mongoDB connection failed: ${error} `);
    })