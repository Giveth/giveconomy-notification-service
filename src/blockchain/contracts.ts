import { ContractInterface, ethers, EventFilter } from 'ethers';
import UnipoolJson from '@/abi/UnipoolTokenDistributor.json';
import {
	StakedEvent,
	UnipoolTokenDistributor,
} from '@/types/contracts/UnipoolTokenDistributor';
import { TypedEvent } from '@/types/contracts/common';
import { ContractConfig } from '@/types/config';
import { ContractType } from '@/src/blockchain/commons';
import { BlockTag } from '@ethersproject/abstract-provider/src.ts';

export type EventConfig = {
	filter: EventFilter;
	transformFn: (event: TypedEvent) => { name: string; [key: string]: any };
};

export interface EventData {
	transactionHash: string;
	contractTitle: string;
	[key: string]: string;
}

interface ContractHelper {
	getAbi(): ContractInterface;
	getEventConfig(contract: ethers.Contract): EventConfig[];
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
			return (events as TypedEvent[]).map(
				(event: TypedEvent): EventData => {
					const { transactionHash } = event;
					return {
						transactionHash,
						contractTitle: this.contractConfig.title,
						...eventConfig.transformFn(event),
					};
				},
			);
		};
		return (await Promise.all(eventConfigs.map(fetchSingleEvent))).flat();
	}
}

export class UnipoolHelper implements ContractHelper {
	getAbi(): ContractInterface {
		return UnipoolJson.abi;
	}

	getEventConfig(contract: ethers.Contract): EventConfig[] {
		const unipoolContract = contract as UnipoolTokenDistributor;
		return [
			{
				filter: unipoolContract.filters.Staked(),
				transformFn: (event: StakedEvent) => {
					const { user, amount } = event.args;
					return {
						name: 'Staked',
						user,
						amount: ethers.utils.formatEther(amount),
					};
				},
			},
		];
	}
}
