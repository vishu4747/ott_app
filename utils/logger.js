const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Define the logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// Queue to manage logging tasks
const logQueue = [];

// Function to create or append data to a file in the 'logs' folder
function logToFile(filename, data) {
    // Push log task to the queue
    logQueue.push({ filename, data });

    // Process the log queue
    processLogQueue();
}

// Function to process the log queue
function processLogQueue() {
    // If queue is empty or there's already a task being processed, return
    if (logQueue.length === 0 || processLogQueue.processing) {
        return;
    }

    // Mark processing as true to prevent concurrent processing
    processLogQueue.processing = true;

    // Get the first task from the queue
    const task = logQueue.shift();

    // Execute the log task
    writeToFile(task.filename, task.data, () => {
        // Mark processing as false to indicate task completion
        processLogQueue.processing = false;

        // Process next task in the queue
        processLogQueue();
    });
}

// Function to write data to a file
function writeToFile(filename, data, callback) {
    const logsFolder = path.join(__dirname, '..', 'logs'); // Path to the logs folder outside the current directory
    const filePath = path.join(logsFolder, filename);
    const logData = `${new Date().toISOString()} ${data}\n`;

    // Check if 'logs' folder exists
    fs.access(logsFolder, fs.constants.F_OK, (err) => {
        if (err) {
            // 'logs' folder doesn't exist, create it
            fs.mkdir(logsFolder, { recursive: true }, (err) => {
                if (err) {
                    logger.error(`Error creating 'logs' folder: ${err.message}`);
                    return;
                }
                // 'logs' folder created, now write to the file
                appendDataToFile(filePath, logData, callback);
            });
        } else {
            // 'logs' folder exists, write to the file
            appendDataToFile(filePath, logData, callback);
        }
    });
}

// Function to append data to a file
function appendDataToFile(filePath, data, callback) {
    fs.appendFile(filePath, data, (err) => {
        if (err) {
            logger.error(`Error appending data to file ${filePath}: ${err.message}`);
        } else {
            logger.info(`Data appended to file ${filePath}.`);
        }
        // Invoke the callback function if provided
        if (typeof callback === 'function') {
            callback();
        }
    });
}

// Export the logger function
module.exports = {
    log: (level, message) => {
        logger.log(level, message);
    },
    logToFile: logToFile
};
