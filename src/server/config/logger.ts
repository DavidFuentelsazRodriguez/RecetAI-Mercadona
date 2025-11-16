import winston, {Logform} from 'winston';

const { combine, timestamp, printf, colorize, align } = winston.format;

const isTestEnv = process.env.NODE_ENV === 'test';

const textFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  align(),
  printf((info: Logform.TransformableInfo) => `[${info.timestamp}] ${info.level}: ${info.message}`)
);

const jsonFormat = combine(
  timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: process.env.NODE_ENV === 'development' ? textFormat : jsonFormat,
  transports: [
    new winston.transports.Console(),
  ],
  exitOnError: false,
  silent: isTestEnv,
});

export default logger;