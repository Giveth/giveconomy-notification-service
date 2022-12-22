import UnipoolJson from '@/abi/UnipoolTokenDistributor.json';
import GIVpowerJson from '@/abi/GIVpower.json';
import { UnipoolTokenDistributor } from '@/types/contracts/UnipoolTokenDistributor';
import { GIVpower } from '@/types/contracts/GIVpower';
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
						notificationEventType: NotificationEventType.STAKE,
						eventData: {
							amount: ethers.utils.formatEther(amount),
						},
					};
				},
			},
			{
				filter: unipoolContract.filters.Withdrawn(),
				transformFn: (logDescription: ethers.utils.LogDescription) => {
					const { user, amount } = logDescription.args;
					return {
						user,
						notificationEventType: NotificationEventType.UNSTAKE,
						eventData: {
							amount: ethers.utils.formatEther(amount),
						},
					};
				},
			},
		];
	}
}

export class GIVpowerHelper implements ContractHelper {
	getAbi() {
		return GIVpowerJson.abi;
	}

	getEventFilterAndTransform(
		contract: ethers.Contract,
	): EventFilterAndTransform[] {
		const givpowerContract = contract as GIVpower;
		return [
			{
				filter: givpowerContract.filters.TokenUnlocked(),
				transformFn: (logDescription: ethers.utils.LogDescription) => {
					const { account, amount, round } = logDescription.args;
					return {
						user: account,
						notificationEventType:
							NotificationEventType.GIVPOWER_UNLOCK,
						eventData: {
							amount: ethers.utils.formatEther(amount),
							round: round.toNumber(),
						},
					};
				},
			},
		];
	}
}
