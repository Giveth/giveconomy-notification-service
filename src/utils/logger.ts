import { createLogger, transports, format } from 'winston';
import { config } from '@/src/configuration/config';
import * as util from 'util';

const combineMessageAndSplat = () => {
	return {
		transform: info => {
			// combine message and args if any
			info.message = util.format(
				info.message,
				...(info[Symbol.for('splat')] || []),
			);
			return info;
		},
	};
};
const logger = createLogger({
	transports: [new transports.Console()],
	level: config.env === 'production' ? 'info' : 'debug',
	format: format.combine(
		combineMessageAndSplat(),
		format.colorize(),
		format.timestamp(),
		format.printf(({ timestamp, level, message }) => {
			return `[${timestamp}] ${level}: ${message}`;
		}),
	),
});

export default logger;
