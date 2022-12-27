export type SendNotificationTypeRequest = {
	/**
	 * @example "Made donation"
	 */
	eventName: string;
	/**
	 * @example "Should be unique"
	 */
	trackId?: string;
	/**
	 * @example false
	 */
	sendEmail: boolean;
	/**
	 * @example false
	 */
	sendSegment: boolean;
	/**
	 * @example 1667992708000
	 * @description milliseconds
	 */
	creationTime: number;
	/**
	 * @example  false
	 */
	sendDappNotification?: boolean;

	/**
	 * @example "test@gmail.com"
	 */
	email?: string;
	/**
	 * @example "1"
	 */
	projectId?: string;
	/**
	 * @example "0x11be55f4ea41e99a3fb06adda507d99d7bb0a571"
	 * @description Sample token for above wallet address and mock authentication service eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwdWJsaWNBZGRyZXNzIjoiMHgxMUJFNTVGNGVBNDFFOTlBM2ZiMDZBRGRBNTA3ZDk5ZDdiYjBhNTcxIiwiZXhwaXJhdGlvbkRhdGUiOiIyMDIyLTA5LTIzVDA4OjA5OjA2LjQ1N1oiLCJqdGkiOiIxNjYxMzI4NTQ2NDU3LTc1YzNhNGI2YWUiLCJpYXQiOjE2NjEzMjg1NDYsImV4cCI6MTY2MzkyMDU0Nn0.Tdd2f7bCMtg3F1ojX1AQQpJ7smTU7vR7Nixromr0ju4
	 */
	userWalletAddress?: string;
	segment?: {
		payload: any;

		/**
		 * @example "asddsa"
		 */
		analyticsUserId?: string;
		/**
		 * @example "123213"
		 */
		anonymousId?: string;
	};
	metadata?: NotificationMetadata;
};

export type NotificationMetadata = {
	amount?: string;

	/**
	 * @example "GIVpower"
	 * @example "FOX/DAI"
	 */
	contractName?: string;

	transactionHash: string;

	/**
	 * @example 1 for Mainnet
	 * @example 100 for Gnosis
	 */
	network: number;
};
