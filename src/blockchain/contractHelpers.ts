import UnipoolJson from '@/abi/UnipoolTokenDistributor.json';
import GIVpowerJson from '@/abi/GIVpower.json';
import TokenDistroJson from '@/abi/TokenDistro.json';
import { UnipoolTokenDistributor } from '@/types/contracts/UnipoolTokenDistributor';
import { GIVpower } from '@/types/contracts/GIVpower';
import { TokenDistro } from '@/types/contracts/TokenDistro';
import { ethers } from 'ethers';
import { EventFilterAndTransform } from '@/src/blockchain/contracts';
import { Fragment, JsonFragment } from '@ethersproject/abi';
import { NotificationEventType } from '@/src/notificationCenter/NotificationCenterAdapter';
import { TypedEvent } from '@/types/contracts/common';

// Contract specific definition of events and event translate strategy
export abstract class ContractHelper {
	protected iface: ethers.utils.Interface;

	constructor() {
		this.iface = new ethers.utils.Interface(this.getAbi());
	}
	abstract getAbi(): ReadonlyArray<Fragment | JsonFragment | string>;

	abstract getEventFilterAndTransform(
		contract: ethers.Contract,
	): EventFilterAndTransform[];
}

export class UnipoolHelper extends ContractHelper {
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
				transformFn: (event: TypedEvent) => {
					const logDescription = this.iface.parseLog(event);
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
				transformFn: (event: TypedEvent) => {
					const logDescription = this.iface.parseLog(event);
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

export class GIVpowerHelper extends ContractHelper {
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
				transformFn: (event: TypedEvent) => {
					const logDescription = this.iface.parseLog(event);
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

export class TokenDistroHelper extends ContractHelper {
	getAbi(): ReadonlyArray<Fragment | JsonFragment | string> {
		return TokenDistroJson.abi;
	}

	getEventFilterAndTransform(
		contract: ethers.Contract,
	): EventFilterAndTransform[] {
		const tokenDistroContract = contract as TokenDistro;
		return [
			{
				filter: tokenDistroContract.filters.GivBackPaid(),
				transformFn: async (event: TypedEvent) => {
					const [allocateEventSignature] =
						tokenDistroContract?.filters?.Allocate()
							?.topics as String[];
					if (!allocateEventSignature) {
						throw new Error(
							'No allocate signature on TokenDistro contract',
						);
					}
					const { transactionHash } = event;
					const transactionReceipt =
						await tokenDistroContract.provider.getTransactionReceipt(
							transactionHash,
						);

					return transactionReceipt.logs
						.filter(log => log.topics[0] === allocateEventSignature)
						.map(log => {
							const logDescription = this.iface.parseLog(log);
							const { grantee, amount } = logDescription.args;
							return {
								logIndex: log.logIndex,
								user: grantee,
								notificationEventType:
									NotificationEventType.GIVBACK_READY_TO_CLAIM,
								eventData: {
									amount: ethers.utils.formatEther(amount),
								},
							};
						});
				},
			},
		];
	}
}
