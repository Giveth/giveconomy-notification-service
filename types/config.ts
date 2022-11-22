import { ContractType } from '@/src/blockchain/commons';

export interface ContractConfig {
	title: string;
	address: string;
	startBlock: number;
	type: ContractType;
}
export interface ChainConfig {
	name: string;
	nodeUrl: string;
	explorerLink: string;
	contracts: ContractConfig[];
}

export interface Config {
	env: 'develop' | 'production';
	databaseConnectionUrl: string;
	monitoredChains: ChainConfig[];
}
