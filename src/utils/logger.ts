import { createLogger, format, transports, Logger as WinstonLogger } from 'winston'
import 'winston-daily-rotate-file'
import path from 'path'
import winston from 'winston'

const { combine, timestamp, printf, colorize, errors } = format

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    success: 3,
    http: 4,
    debug: 5,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    success: 'green',
    http: 'magenta',
    debug: 'white',
  },
}

interface CustomLogger extends WinstonLogger {
  success: (message: string, ...meta: any[]) => CustomLogger;
}

winston.addColors(customLevels.colors);

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return stack
        ? `${timestamp} [${level}]: ${stack}`
        : `${timestamp} [${level}]: ${message}`
})

const dailyRotateTransport = new transports.DailyRotateFile({
    filename: path.join('logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'debug',
})

const logger: CustomLogger = createLogger({
    level: 'debug',
    levels: customLevels.levels,
    format: combine(
        colorize(),
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new transports.Console({
            handleExceptions: true
        }),
        dailyRotateTransport,
        new transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            handleRejections: true
        }),
    ],
    exitOnError: false
}) as CustomLogger;

export default logger