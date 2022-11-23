import UnipoolJson from '@/abi/UnipoolTokenDistributor.json';
import { UnipoolTokenDistributor } from '@/types/contracts/UnipoolTokenDistributor';
import { ethers } from 'ethers';
import { EventConfig } from '@/src/blockchain/contracts';
import { Fragment, JsonFragment } from '@ethersproject/abi';

export interface ContractHelper {
	getAbi(): ReadonlyArray<Fragment | JsonFragment | string>;

	getEventConfig(contract: ethers.Contract): EventConfig[];
}

export class UnipoolHelper implements ContractHelper {
	getAbi() {
		return UnipoolJson.abi;
	}

	getEventConfig(contract: ethers.Contract): EventConfig[] {
		const unipoolContract = contract as UnipoolTokenDistributor;
		return [
			{
				filter: unipoolContract.filters.Staked(),
				transformFn: (logDescription: ethers.utils.LogDescription) => {
					const { user, amount } = logDescription.args;
					return {
						user,
						amount: ethers.utils.formatEther(amount),
					};
				},
			},
			{
				filter: unipoolContract.filters.Withdrawn(),
				transformFn: (logDescription: ethers.utils.LogDescription) => {
					const { user, amount } = logDescription.args;
					return {
						user,
						amount: ethers.utils.formatEther(amount),
					};
				},
			},
		];
	}
}
