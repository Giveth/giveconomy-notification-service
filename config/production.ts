import { Config } from '@/types/config';
import { ContractType } from '@/src/blockchain/commons';

export const config: Config = {
	databaseConnectionUrl: '',
	env: 'production',
	monitoredChains: [
		{
			networkId: 100, // Gnosis-chain
			nodeUrl: process.env.GNOSIS_PROVIDER as string,
			nodeUrlWS: process.env.GNOSIS_PROVIDER_WS,
			pollTimeMS: 10_000, // 30 Seconds
			maxFetchBlockRange: 1_000,
			contracts: [
				{
					address: '0xD93d3bDBa18ebcB3317a57119ea44ed2Cf41C2F2',
					title: 'GIVPower',
					startBlock: 25215585,
					type: ContractType.Unipool,
				},
			],
		},
	],
};
