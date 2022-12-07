import * as dotenv from 'dotenv';
import * as path from 'path';

export const getEnv = (): 'staging' | 'production' => {
	return process.env.NODE_ENV === 'production' ? 'production' : 'staging';
};

export const loadEnv = () => {
	const configPath = path.resolve(__dirname, `../../config/${getEnv()}.env`);
	const loadConfigResult = dotenv.config({
		path: configPath,
	});

	if (loadConfigResult.error) {
		// tslint:disable-next-line:no-console
		console.log('Load process.env error', {
			path: configPath,
			error: loadConfigResult.error,
		});
		throw loadConfigResult.error;
	}
};
