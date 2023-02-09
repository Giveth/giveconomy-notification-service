import { getEnv } from '@/src/configuration/utils';

export const getOriginHeader = () => {
	const SERVICE_NAME = process.env.SERVICE_NAME;
	return SERVICE_NAME
		? 'g-n-s-' + SERVICE_NAME
		: 'giveconomy-notification-service-unnamed';
};
