import winston from "winston";

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

// Define format for logs
const format = winston.format.combine(
	// Add timestamp
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	// Add colors (only for console output)
	winston.format.colorize({ all: true }),
	// Define format
	winston.format.printf(
		(info) => `${info.timestamp} ${info.level}: ${info.message}`,
	),
);

// Define transports (where to log)
const transports = [
	// Console transport
	new winston.transports.Console(),
	// File transport for errors
	new winston.transports.File({
		filename: "logs/error.log",
		level: "error",
	}),
	// File transport for all logs
	new winston.transports.File({ filename: "logs/combined.log" }),
];

// Create the logger
const logger = winston.createLogger({
	level: level(),
	levels,
	format,
	transports,
});

export default logger;
