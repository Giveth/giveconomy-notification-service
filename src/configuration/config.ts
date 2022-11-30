import { Config } from '@/types/config';
import { config as developConfig } from '@/config/develop';

export const getEnv = (): 'develop' | 'production' => {
	return process.env.NODE_ENV === 'production' ? 'production' : 'develop';
};

export const config: Config =
	getEnv() === 'develop' ? developConfig : developConfig;
