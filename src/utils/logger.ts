import { transports, format } from 'winston';
import config from '@/src/configuration/config';
import * as util from 'util';

import RotatingFileStream from 'bunyan-rotating-file-stream';

import { createLogger } from 'bunyan';

function createBunyanLogger() {
	const logDir =
		process.env.LOG_PATH || './logs/giveconomy-notification-service.log';
	// tslint:disable-next-line:no-console
	console.log('Bunyan log level is', process.env.LOG_LEVEL || 'debug');
	const bunyanStreams: any = [
		{
			type: 'raw',
			stream: new RotatingFileStream({
				path: logDir,
				period: '30d', // monthly rotation
				totalFiles: 30, // keep 30 back copies
				rotateExisting: true, // Give ourselves a clean file when we start up, based on period
				threshold: '100m', // Rotate log files larger than 100 megabytes
				totalSize: '500m', // Don't keep more than 500 megabytes of archived log files
				gzip: false, // Compress the archive log files to save space
			}),
		},
	];

	if (
		process.env.NODE_ENV === 'development' ||
		process.env.NODE_ENV === 'test'
	) {
		// Adding logs to console in local machine and running tests
		bunyanStreams.push({
			stream: process.stdout,
		});
	}
	return createLogger({
		name: 'giveconomy-notification-service',
		level: config.env === 'production' ? 'info' : 'debug',
		format: format.combine(
			combineMessageAndSplat(),
			format.colorize(),
			format.timestamp(),
			format.printf(({ timestamp, level, message }) => {
				return `[${timestamp}] ${level}: ${message}`;
			}),
		),
		streams: bunyanStreams,
	});
}

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
const logger = createBunyanLogger();

export default logger;
