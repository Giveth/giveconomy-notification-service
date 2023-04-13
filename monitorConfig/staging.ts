import { Config } from '@/types/config';
import { ContractType } from '@/src/blockchain/commons';
import { loadEnv } from '@/src/configuration/utils';

loadEnv();

export const config: Config = {
	databaseConnectionUrl: '',
	env: 'develop',
	monitoredChains: [
		{
			networkId: 100, // Gnosis-chain
			nodeUrl: process.env.GNOSIS_PROVIDER as string,
			nodeUrlWS: process.env.GNOSIS_PROVIDER_WS,
			pollTimeMS: Number(process.env.GNOSIS_POLL_TIME) || 30_000, // 30 Seconds
			maxFetchBlockRange: 1_000,
			contracts: [
				{
					address: '0xDAEa66Adc97833781139373DF5B3bcEd3fdda5b1',
					title: 'GIVPower',
					startBlock: 24806941,
					type: ContractType.GIVpower,
				},
				{
					address: '0x18a46865AAbAf416a970eaA8625CFC430D2364A1',
					title: 'Gnosis Token Distro',
					startBlock: 25661123,
					type: ContractType.TokenDistro,
				},
				// {
				// 	address: '0x93c40bCA6a854B2190a054136a316C4Df7f89f10',
				// 	title: 'FOX/DAI',
				// 	startBlock: 25240777,
				// 	type: ContractType.Unipool,
				// },
			],
		},
		// {
		// 	networkId: 5, // Görli
		// 	nodeUrl: process.env.GOERLI_PROVIDER as string,
		// 	nodeUrlWS: process.env.GOERLI_PROVIDER_WS,
		// 	pollTimeMS: 240_000, // 24 seconds
		// 	maxFetchBlockRange: 1_000,
		// 	contracts: [
		// 		{
		// 			address: '0x887673d8295aF9BE0D8e12412c2B87a49cFcd7bd',
		// 			type: ContractType.Unipool,
		// 			startBlock: 8053499,
		// 			title: 'GIV/ETH Balancer',
		// 		},
		// 	],
		// },
	],
};
