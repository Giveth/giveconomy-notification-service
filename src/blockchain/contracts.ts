import { ethers, EventFilter } from 'ethers';
import { TypedEvent } from '@/types/contracts/common';
import { ContractConfig } from '@/types/config';
import { ContractType } from '@/src/blockchain/commons';
import { BlockTag } from '@ethersproject/abstract-provider/src.ts';
import {
	ContractHelper,
	UnipoolHelper,
} from '@/src/blockchain/contractHelpers';

export type EventConfig = {
	filter: EventFilter;
	transformFn: (event: TypedEvent) => { name: string; [key: string]: any };
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
	private contract: ethers.Contract;
	private contractHelper: ContractHelper;
	constructor(
		private readonly contractConfig: ContractConfig,
		private readonly nodeUrl: string,
	) {
		const provider = new ethers.providers.JsonRpcProvider(nodeUrl);
		this.contractHelper = getContractHelper(contractConfig.type);
		this.contract = new ethers.Contract(
			contractConfig.address,
			this.contractHelper.getAbi(),
			provider,
		);
	}

	async fetchEvents(
		fromBlock?: BlockTag,
		toBlock?: BlockTag,
	): Promise<EventData[]> {
		const eventConfigs = this.contractHelper.getEventConfig(this.contract);

		const fetchSingleEvent = async (
			eventConfig: EventConfig,
		): Promise<EventData[]> => {
			const events = await this.contract.queryFilter(
				eventConfig.filter,
				fromBlock,
				toBlock,
			);
			return Promise.all(
				(events as TypedEvent[]).map(
					async (event: TypedEvent): Promise<EventData> => {
						const { transactionHash, getBlock, logIndex } = event;
						const block = await getBlock();
						return {
							transactionHash,
							logIndex,
							timestamp: block.timestamp,
							contractTitle: this.contractConfig.title,
							...eventConfig.transformFn(event),
						};
					},
				),
			);
		};
		return (await Promise.all(eventConfigs.map(fetchSingleEvent))).flat();
	}
}
