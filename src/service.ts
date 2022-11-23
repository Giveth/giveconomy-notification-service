import { config } from '@/src/configuration/config';
import { ContractEventFetcher } from '@/src/blockchain/contracts';

const service = async () => {
	const { monitoredChains } = config;

	return await Promise.all(
		monitoredChains.map(async monitoredChain => {
			const { name, nodeUrl, contracts, explorerLink } = monitoredChain;

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
					url: explorerLink + '/' + event.transactionHash,
					network: name,
				};
			});
		}),
	);
};

export default service;
