const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const { errorMiddleware, asyncError } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');



const app = express();
module.exports = app;

//setup config file
dotenv.config({
    path: "./config/config.env",
})

// Middleware to parse data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//setup access log file
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });
app.use(morgan("combined",{stream: accessLogStream}));

//routers
const userRouter = require("./routers/user");
const postRouter = require("./routers/post");

app.use('/api/v1/user/', userRouter);
app.use('/api/v1/post/', postRouter);


//middlewares
app.use(errorMiddleware);
app.use(asyncError);
