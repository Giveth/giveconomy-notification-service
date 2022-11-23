import { ethers, EventFilter } from 'ethers';
import { TypedEvent } from '@/types/contracts/common';
import { ContractConfig } from '@/types/config';
import { ContractType } from '@/src/blockchain/commons';
import { BlockTag } from '@ethersproject/abstract-provider/src.ts';
import {
	ContractHelper,
	UnipoolHelper,
} from '@/src/blockchain/contractHelpers';

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
		this.iface = new ethers.utils.Interface(this.contractHelper.getAbi());
	}

	async fetchEvents(
		fromBlock?: BlockTag,
		toBlock?: BlockTag,
	): Promise<EventData[]> {
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
		const events = await this.contract.queryFilter(
			combinedFilter,
			fromBlock,
			toBlock,
		);
		return Promise.all(
			(events as TypedEvent[]).map(
				async (event: TypedEvent): Promise<EventData> => {
					const { transactionHash, getBlock, logIndex } = event;
					const block = await getBlock();
					const logDescription = this.iface.parseLog(event);
					const transformFn = eventTopicToTransform[event.topics[0]];
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
	}
}
