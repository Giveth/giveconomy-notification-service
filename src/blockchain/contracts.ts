import { ethers, EventFilter } from 'ethers';
import { TypedEvent } from '@/types/contracts/common';
import { ContractConfig } from '@/types/config';
import { ContractType } from '@/src/blockchain/commons';
import logger from '@/src/utils/logger';
import {
	ContractHelper,
	UnipoolHelper,
} from '@/src/blockchain/contractHelpers';
import {
	getContractLastBlock,
	setContractLastBlock,
} from '@/src/repository/database';

export type EventTransformFn = (
	logDescription: ethers.utils.LogDescription,
) => {
	[key: string]: any;
};
export type EventConfig = {
	filter: EventFilter;
	transformFn: EventTransformFn;
};

export interface EventData {
	transactionHash: string;
	contractTitle: string;
	logIndex: number;
	timestamp: number;
	[key: string]: string | number;
}

const getContractHelper = (type: ContractType): ContractHelper => {
	switch (type) {
		case ContractType.Unipool:
			return new UnipoolHelper();
	}
};

export class ContractEventFetcher {
	private readonly contract: ethers.Contract;
	private readonly iface: ethers.utils.Interface;
	private contractHelper: ContractHelper;
	private _isFetching: boolean;
	private fromBlock: number;
	constructor(
		private readonly contractConfig: ContractConfig,
		private provider: ethers.providers.Provider,
		private readonly network: number,
	) {
		this.contractHelper = getContractHelper(contractConfig.type);
		this.contract = new ethers.Contract(
			contractConfig.address,
			this.contractHelper.getAbi(),
			provider,
		);
		this.iface = new ethers.utils.Interface(this.contractHelper.getAbi());
	}

	get isFetching(): boolean {
		return this._isFetching;
	}

	async fetchEvents(
		toBlock: number,
		maxFetchBlockRange: number,
		sendEvents: (events: EventData[]) => void,
	): Promise<void> {
		if (this._isFetching) {
			logger.info(
				`Still fetching contract ${this.contractConfig.title} events`,
			);
			return;
		}
		if (!this.fromBlock) {
			const dbFromBlock = await getContractLastBlock(
				this.contractConfig.address,
				this.network,
			);
			this.fromBlock = dbFromBlock
				? dbFromBlock
				: this.contractConfig.startBlock;
		}
		if (this.fromBlock >= toBlock) return;
		const eventConfigs = this.contractHelper.getEventConfig(this.contract);

		const eventTopicToTransform: { [topic: string]: EventTransformFn } = {};
		const eventsSignatures: string[] = [];
		eventConfigs.forEach(eventConfig => {
			const [eventSignature] = eventConfig.filter?.topics as string[];
			eventTopicToTransform[eventSignature] = eventConfig.transformFn;
			eventsSignatures.push(eventSignature);
		});

		const combinedFilter: EventFilter = {
			address: this.contract.address,
			topics: [eventsSignatures],
		};

		try {
			this._isFetching = true;

			while (true) {
				const _fromBlock = this.fromBlock + 1;
				const _toBlock = Math.min(
					this.fromBlock + maxFetchBlockRange,
					toBlock,
				);

				logger.debug(
					`Fetch contract ${this.contractConfig.title} events - blocks ${_fromBlock}-${_toBlock}`,
				);
				const events = await this.contract.queryFilter(
					combinedFilter,
					_fromBlock,
					_toBlock,
				);
				const result = await Promise.all(
					(events as TypedEvent[]).map(
						async (event: TypedEvent): Promise<EventData> => {
							const { transactionHash, getBlock, logIndex } =
								event;
							const block = await getBlock();
							const logDescription = this.iface.parseLog(event);
							const transformFn =
								eventTopicToTransform[event.topics[0]];
							return {
								transactionHash,
								logIndex,
								timestamp: block.timestamp,
								contractTitle: this.contractConfig.title,
								name: logDescription.name,
								...transformFn(logDescription),
							};
						},
					),
				);

				await sendEvents(result);

				this.fromBlock = _toBlock;

				if (_toBlock >= toBlock) {
					await setContractLastBlock(
						this.contractConfig.address,
						this.network,
						this.fromBlock,
					);
					break;
				}
			}
		} catch (e) {
			logger.error(`Fetch error: ${e}`);
		} finally {
			this._isFetching = false;
		}
	}
}
