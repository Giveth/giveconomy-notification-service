import axios, { AxiosResponse } from 'axios';
import logger from '@/src/utils/logger';
import {
	NotificationMetadata,
	SendNotificationTypeRequest,
} from '@/types/Notification';
const notificationCenterUsername = process.env.NOTIFICATION_CENTER_USERNAME;
const notificationCenterPassword = process.env.NOTIFICATION_CENTER_PASSWORD;
const notificationCenterBaseUrl = process.env.NOTIFICATION_CENTER_BASE_URL;

const createBasicAuthentication = ({ userName, password }) => {
	const str = userName + ':' + password;
	return 'Basic ' + Buffer.from(str).toString('base64');
};

const authorizationHeader = createBasicAuthentication({
	userName: notificationCenterUsername,
	password: notificationCenterPassword,
});

export enum NOTIFICATION_CATEGORY {
	PROJECT_RELATED = 'projectRelated',
	DISCUSSION = 'discussion',
	GENERAL = 'general',
	GIV_ECONOMY = 'givEconomy',
	GIV_POWER = 'givPower',
}

export enum NotificationEventType {
	STAKE = 'Stake',
	UNSTAKE = 'UnStake',
}

export class NotificationCenterAdapter {
	static async sendNotification(params: {
		eventType: NotificationEventType;
		metadata: NotificationMetadata;
		userAddress: string;
		timestamp: number;
		logIndex: number;
	}): Promise<void> {
		const { eventType, userAddress, metadata, timestamp, logIndex } =
			params;
		const trackId = `${metadata.network}-${metadata.transactionHash}-${logIndex}`;
		return NotificationCenterAdapter.callSendNotification({
			eventName: eventType,
			userWalletAddress: userAddress as string,
			sendEmail: false,
			sendSegment: false,
			creationTime: timestamp * 1000,
			trackId,
			metadata,
		});
	}

	private static async callSendNotification(
		data: SendNotificationTypeRequest,
	): Promise<void> {
		try {
			logger.debug(`Send to notification center: 
				${JSON.stringify(data, null, 2)}`);
			await axios.post(
				`${notificationCenterBaseUrl}/notifications`,
				data,
				{
					headers: {
						Authorization: authorizationHeader,
					},
				},
			);
			logger.debug(
				`Send to notification center successful: ${data.eventName}`,
			);
		} catch (e) {
			logger.error('callSendNotification error', {
				errorResponse: e?.response?.data,
				data,
			});

			// We throw exception to make event fetch process fail and retry next time
			throw e;
		}
	}
}
