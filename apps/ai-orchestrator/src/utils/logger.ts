import winston from 'winston';
import morgan from 'morgan';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Modern colorized terminal format for development
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
  )
);

// Standard JSON format for production telemetry
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  }),
];

export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

// Configure Morgan to stream HTTP traffic logs into Winston
export const morganMiddleware = morgan(
  ':remote-addr - :method :url :status :res[content-length] - :response-time ms',
  { stream }
);
