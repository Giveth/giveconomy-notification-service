import { Mutex } from 'async-mutex';
import logger from '@/src/utils/logger';
import { Database, Statement } from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { getEnv } from '@/src/configuration/utils';
const mutex = new Mutex();

class DB {
	private static instance: Database;
	private static selectStatement: Statement;
	private static updateStatement: Statement;

	static async getInstance(): Promise<Database> {
		const release = await mutex.acquire();
		try {
			if (!DB.instance) {
				const _path = path.join(
					__dirname,
					'../../data',
					getEnv() + '.sqlite',
				);

				DB.instance = new Database(_path);
				await new Promise<void>((resolve, reject) => {
					const schemaQuery = fs
						.readFileSync(path.join(__dirname, 'schema.sql'))
						.toString();
					DB.instance.exec(schemaQuery, err => {
						if (err) reject(err);
						else resolve();
					});
				});

				this.selectStatement = DB.instance.prepare(
					`SELECT block from ContractLastBlock where address=? and network=?`,
				);
				this.updateStatement = DB.instance.prepare(
					`REPLACE INTO ContractLastBlock (address,network,block) VALUES(?,?,?)`,
				);
			}
		} finally {
			release();
		}

		return DB.instance;
	}

	static async getContractLastBlock(
		address: string,
		network: number,
	): Promise<number> {
		await DB.getInstance();
		return new Promise<number>((resolve, reject) => {
			DB.selectStatement.get(
				[address.toLowerCase(), network],
				(error, result) => {
					if (error) reject(error);
					resolve(result?.block);
				},
			);
		});
	}
	static async setContractLastBlock(
		address: string,
		network: number,
		lastBlock: number,
	): Promise<void> {
		await DB.getInstance();
		return new Promise<void>((resolve, reject) => {
			DB.updateStatement.get(
				[address.toLowerCase(), network, lastBlock],
				error => {
					if (error) reject(error);
					resolve();
				},
			);
		});
	}
}

export const getContractLastBlock = async (
	contractAddress: string,
	network: number | string,
): Promise<number> => {
	const result = await DB.getContractLastBlock(contractAddress, +network);
	return result || 0;
};

export const setContractLastBlock = async (
	contractAddress: string,
	network: number | string,
	lastBlock: number,
) => {
	try {
		await DB.setContractLastBlock(contractAddress, +network, lastBlock);
	} catch (e) {
		logger.error(`save lastBlock error:${e}`);
	}
};
