import UnipoolJson from '@/abi/UnipoolTokenDistributor.json';
import { UnipoolTokenDistributor } from '@/types/contracts/UnipoolTokenDistributor';
import { ethers } from 'ethers';
import { EventFilterAndTransform } from '@/src/blockchain/contracts';
import { Fragment, JsonFragment } from '@ethersproject/abi';
import { NotificationEventType } from '@/src/notificationCenter/NotificationCenterAdapter';

// Contract specific definition of events and event translate strategy
export interface ContractHelper {
	getAbi(): ReadonlyArray<Fragment | JsonFragment | string>;

	getEventFilterAndTransform(
		contract: ethers.Contract,
	): EventFilterAndTransform[];
}

export class UnipoolHelper implements ContractHelper {
	getAbi() {
		return UnipoolJson.abi;
	}

	getEventFilterAndTransform(
		contract: ethers.Contract,
	): EventFilterAndTransform[] {
		const unipoolContract = contract as UnipoolTokenDistributor;
		return [
			{
				filter: unipoolContract.filters.Staked(),
				transformFn: (logDescription: ethers.utils.LogDescription) => {
					const { user, amount } = logDescription.args;
					return {
						user,
						amount: ethers.utils.formatEther(amount),
						notificationEventType: NotificationEventType.STAKE,
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
						notificationEventType: NotificationEventType.UNSTAKE,
					};
				},
			},
		];
	}
}
