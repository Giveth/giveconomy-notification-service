import { ChainConfig } from '@/types/config';
import { ContractEventFetcher } from '@/src/blockchain/contracts';
import WSProvider, { WebsocketProvider } from 'web3-providers-ws';
import { websocketProviderOption } from '@/src/configuration/websocketProviderOption';
import Web3 from 'web3';
import logger from '@/src/utils/logger';
import { ethers } from 'ethers';

// Monitors single chain and all its defined contracts
export class MonitorChain {
	private readonly contractEventFetchers: ContractEventFetcher[];
	private readonly provider: ethers.providers.Provider;
	private readonly wsProvider: WebsocketProvider | undefined;
	private lastFetchTimestamp: number = 0;
	private poolTimeOut: NodeJS.Timeout;

	constructor(readonly chainConfig: ChainConfig) {
		const { nodeUrl, contracts, nodeUrlWS, networkId } = chainConfig;
		logger.info(`Monitor network:
				${JSON.stringify(chainConfig, null, 2)}`);

		this.provider = new ethers.providers.JsonRpcProvider(nodeUrl);
		this.contractEventFetchers = contracts.map(
			contract =>
				new ContractEventFetcher(contract, this.provider, networkId),
		);

		if (nodeUrlWS) {
			// @ts-ignore
			this.wsProvider = new WSProvider(
				nodeUrlWS,
				websocketProviderOption,
			);
		}
	}

	async run() {
		logger.info('run');
		// await this.fetch('latest');

		if (this.wsProvider) {
			const web3 = new Web3(this.wsProvider);
			web3.eth.subscribe('newBlockHeaders', (err, block) => {
				if (block) {
					logger.info(
						`chain ${this.chainConfig.networkId} - on new block ${block.number}`,
					);

					this.lastFetchTimestamp = +block.timestamp;
					this.fetch(block.number);
				}
				if (err) {
					logger.error('new block subscription error:' + err);
				}
			});
		}

		// Poll
		await this.poll();
	}

	private async poll() {
		const lastRunElapsedMS = Date.now() - this.lastFetchTimestamp * 1000;
		const { pollTimeMS } = this.chainConfig;
		if (lastRunElapsedMS < pollTimeMS) {
			if (this.poolTimeOut) {
				clearTimeout(this.poolTimeOut);
			}

			this.poolTimeOut = setTimeout(() => {
				this.poll();
			}, pollTimeMS - lastRunElapsedMS);
			return;
		}

		this.poolTimeOut = setTimeout(() => {
			this.poll();
		}, pollTimeMS);

		logger.info(`Poll network ${this.chainConfig.networkId}`);
		try {
			logger.info(`	getting latest block info...`);
			const block = await this.provider.getBlock('latest');
			logger.info(
				`	latest block: ${block.number} - ${new Date(
					block.timestamp * 1000,
				)}`,
			);
			this.lastFetchTimestamp = +block.timestamp;

			logger.info(
				`chain ${this.chainConfig.networkId} - poll on block ${block.number}`,
			);

			await this.fetch(block.number);
		} catch (e) {
			logger.error(e);
		}
	}

	private async fetch(networkLatestBlock: number) {
		await Promise.all(
			this.contractEventFetchers.map(contractEventFetcher =>
				contractEventFetcher.fetchEvents(
					networkLatestBlock,
					this.chainConfig.maxFetchBlockRange,
				),
			),
		);
	}
}
