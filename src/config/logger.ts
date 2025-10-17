import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// Define log levels
const levels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	debug: 4,
};

// Define colors for each level
const colors = {
	error: "red",
	warn: "yellow",
	info: "green",
	http: "magenta",
	debug: "white",
};

// Tell winston about our colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
	const env = process.env.NODE_ENV || "development";
	const isDevelopment = env === "development";
	return isDevelopment ? "debug" : "info";
};

// Define format for console output (with colors)
const consoleFormat = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	winston.format.colorize({ all: true }),
	winston.format.printf(
		(info) => `${info.timestamp} ${info.level}: ${info.message}`,
	),
);

// Define format for file output (no colors)
const fileFormat = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	winston.format.printf(
		(info) => `${info.timestamp} ${info.level}: ${info.message}`,
	),
);

// Define transports (where to log)
const transports = [
	// Console transport with colors
	new winston.transports.Console({
		format: consoleFormat,
	}),
	// Rotating file transport for errors
	new DailyRotateFile({
		filename: "logs/error-%DATE%.log",
		datePattern: "YYYY-MM-DD",
		level: "error",
		format: fileFormat,
		maxSize: "20m", // Max size per file: 20MB
		maxFiles: "14d", // Keep logs for 14 days
		zippedArchive: true, // Compress archived logs
	}),
	// Rotating file transport for all logs
	new DailyRotateFile({
		filename: "logs/combined-%DATE%.log",
		datePattern: "YYYY-MM-DD",
		format: fileFormat,
		maxSize: "20m", // Max size per file: 20MB
		maxFiles: "14d", // Keep logs for 14 days
		zippedArchive: true, // Compress archived logs
	}),
];

// Create the logger
const logger = winston.createLogger({
	level: level(),
	levels,
	transports,
});

export default logger;
