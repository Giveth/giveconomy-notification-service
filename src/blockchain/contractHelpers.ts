import UnipoolJson from '@/abi/UnipoolTokenDistributor.json';
import {
	StakedEvent,
	UnipoolTokenDistributor,
} from '@/types/contracts/UnipoolTokenDistributor';
import { ContractInterface, ethers } from 'ethers';
import { EventConfig } from '@/src/blockchain/contracts';

export interface ContractHelper {
	getAbi(): ContractInterface;
	getEventConfig(contract: ethers.Contract): EventConfig[];
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
