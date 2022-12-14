import { ethers, EventFilter } from 'ethers';
import { TypedEvent } from '@/types/contracts/common';
import { ContractConfig } from '@/types/config';
import { ContractType } from '@/src/blockchain/commons';
import logger from '@/src/utils/logger';
import {
	ContractHelper,
	GIVpowerHelper,
	TokenDistroHelper,
	UnipoolHelper,
} from '@/src/blockchain/contractHelpers';
import {
	getContractLastBlock,
	setContractLastBlock,
} from '@/src/repository/database';
import {
	NotificationCenterAdapter,
	NotificationEventType,
} from '@/src/notificationCenter/NotificationCenterAdapter';

export type NotificationData = {
	user: string;
	notificationEventType: NotificationEventType;
	logIndex?: number;
	eventData: Object;
};

export type EventTransformFn = (
	event: TypedEvent,
) => NotificationData | Promise<NotificationData[]>;
export type EventFilterAndTransform = {
	filter: EventFilter;
	transformFn: EventTransformFn;
};

const getContractHelper = (type: ContractType): ContractHelper => {
	switch (type) {
		case ContractType.Unipool:
			return new UnipoolHelper();
		case ContractType.GIVpower:
			return new GIVpowerHelper();
		case ContractType.TokenDistro:
			return new TokenDistroHelper();
	}
};

// Fetches events of single contract
export class ContractEventFetcher {
	private readonly contract: ethers.Contract;
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
	}

	async fetchEvents(
		toBlock: number,
		maxFetchBlockRange: number,
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
		const eventConfigs = this.contractHelper.getEventFilterAndTransform(
			this.contract,
		);

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
				await Promise.all(
					(events as TypedEvent[]).map(async (event: TypedEvent) => {
						const { transactionHash, getBlock, logIndex } = event;
						const transformFn =
							eventTopicToTransform[event.topics[0]];

						const [block, transformedResult] = await Promise.all([
							getBlock(),
							transformFn(event),
						]);

						const notifications: NotificationData[] = Array.isArray(
							transformedResult,
						)
							? transformedResult
							: [transformedResult];
						await NotificationCenterAdapter.sendNotificationsBulk(
							notifications.map(notification => {
								const {
									user,
									eventData,
									notificationEventType,
									logIndex: notificationLogIndex,
								} = notification;
								return {
									metadata: {
										...eventData,
										transactionHash,
										network: this.network,
										contractName: this.contractConfig.title,
									},
									logIndex: notificationLogIndex ?? logIndex,
									timestamp: block.timestamp,
									userAddress: user,
									eventType: notificationEventType,
								};
							}),
						);
					}),
				);

				// await sendEvents(result);

				this.fromBlock = _toBlock;

				// Persis last block
				await setContractLastBlock(
					this.contractConfig.address,
					this.network,
					this.fromBlock,
				);
				if (_toBlock >= toBlock) {
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
