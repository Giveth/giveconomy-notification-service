import service from './service';

async function main() {
	const result = await service();
	// tslint:disable-next-line:no-console
	console.log(result);
	// setInterval(service, 1000);
}

main();
