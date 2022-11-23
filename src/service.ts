import { config } from '@/src/configuration/config';
import { ContractEventFetcher } from '@/src/blockchain/contracts';

const service = async () => {
	const { monitoredChains } = config;

	return await Promise.all(
		monitoredChains.map(async monitoredChain => {
			const { networkId, nodeUrl, contracts } = monitoredChain;

			const contractEventFetchers = contracts.map(
				contract => new ContractEventFetcher(contract, nodeUrl),
			);

			const events = (
				await Promise.all(
					contractEventFetchers.map(contractEventFetcher =>
						contractEventFetcher.fetchEvents(-1000, 'latest'),
					),
				)
			).flat();

			return events.map(event => {
				return {
					...event,
					network: networkId,
				};
			});
		}),
	);
};

export default service;
