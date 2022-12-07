import config from '@/src/configuration/config';
import { MonitorChain } from '@/src/service/MonitorChain';

// The main service which monitors all chains
const service = async () => {
	const { monitoredChains } = config;
	await Promise.all(
		monitoredChains.map(chainConfig => {
			const monitorChain = new MonitorChain(chainConfig);
			return monitorChain.run();
		}),
	);
};

export default service;
