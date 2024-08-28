import { Config } from '@/types/config';
import { ContractType } from '@/src/blockchain/commons';
import { loadEnv } from '@/src/configuration/utils';

loadEnv();

export const config: Config = {
	databaseConnectionUrl: '',
	env: 'production',
	monitoredChains: [
		{
			networkId: 100, // Gnosis-chain
			nodeUrl: process.env.GNOSIS_PROVIDER as string,
			nodeUrlWS: process.env.GNOSIS_PROVIDER_WS,
			pollTimeMS: Number(process.env.GNOSIS_POLL_TIME) || 30_000, // 30 Seconds
			maxFetchBlockRange: 1_000,
			contracts: [
				{
					address: '0xD93d3bDBa18ebcB3317a57119ea44ed2Cf41C2F2',
					title: 'Gnosis GIVPower',
					startBlock: 26572747,
					type: ContractType.GIVpower,
				},
				{
					address: '0xc0dbDcA66a0636236fAbe1B3C16B1bD4C84bB1E1',
					title: 'Gnosis Token Distro',
					startBlock: 26572747,
					type: ContractType.TokenDistro,
				},
			],
		},
		{
			networkId: 10, // Optimism
			nodeUrl: process.env.OPTIMISM_PROVIDER as string,
			nodeUrlWS: process.env.OPTIMISM_PROVIDER_WS,
			pollTimeMS: Number(process.env.OPTIMISM_POLL_TIME) || 30_000, // 30 Seconds
			maxFetchBlockRange: 1_000,
			contracts: [
				{
					address: '0x301C739CF6bfb6B47A74878BdEB13f92F13Ae5E7',
					title: 'Optimism GIVPower',
					startBlock: 108350094,
					type: ContractType.GIVpower,
				},
				{
					address: '0xE3Ac7b3e6B4065f4765d76fDC215606483BF3bD1',
					title: 'Optimism Token Distro',
					startBlock: 108004007,
					type: ContractType.TokenDistro,
				},
			],
		},
		{
			networkId: 1101, // ZKEVM
			nodeUrl: process.env.ZKEVM_PROVIDER as string,
			nodeUrlWS: process.env.ZKEVM_PROVIDER_WS,
			pollTimeMS: Number(process.env.ZKEVM_POLL_TIME) || 30_000, // 30 Seconds
			maxFetchBlockRange: 1_000,
			contracts: [
				{
					address: '0xc790f82bf6f8709aa4a56dc11afad7af7c2a9867',
					title: 'ZKEVM GIVPower',
					startBlock: 15130779,
					type: ContractType.GIVpower,
				},
				{
					address: '0x4fB9B10ECDe1b048DBC79aBEAB3793edc93a0d54',
					title: 'ZKEVM Token Distro',
					startBlock: 15130401,
					type: ContractType.TokenDistro,
				},
			],
		},
	],
};
