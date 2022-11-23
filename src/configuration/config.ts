import { Config } from '@/types/config';
import { ContractType } from '@/src/blockchain/commons';

export const config: Config = {
	databaseConnectionUrl: '',
	env: 'develop',
	monitoredChains: [
		{
			networkId: 100, // Gnosis-chain
			nodeUrl: 'https://rpc.ankr.com/gnosis',
			contracts: [
				{
					address: '0xD93d3bDBa18ebcB3317a57119ea44ed2Cf41C2F2',
					title: 'GIVPower',
					startBlock: 25102627,
					type: ContractType.Unipool,
				},
			],
		},
	],
};
