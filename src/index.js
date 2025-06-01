import dotenv from "dotenv";
dotenv.config()

import connectDB from "./db/connect.js";
import app from "./app.js";


connectDB()
    .then(()=> {
        app.listen(8000 || process.env.PORT, () => {
            console.log(`Server is running on PORT: ${process.env.PORT}`);
        })
    })
    .catch(error=> {
        console.log(`mongoDB connection failed: ${error} `);
    })