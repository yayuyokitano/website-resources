'use strict';

import fs from 'fs';
import util from 'util';
import fetch from 'node-fetch';

const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const removeFile = util.promisify(fs.unlink);

const owner = 'web-scrobbler';
const repo = 'web-scrobbler';
const rawContentUrl = `https://raw.githubusercontent.com/${owner}/${repo}`;

const resDir = 'resources';
const moduleFile = 'connectors.ts';
const listFile = `${resDir}/connectors.json`;

async function main(args:string[]) {
	const latestTag = args.at(-1);

	if (!latestTag) {
		console.error('You must provide version as an argument')
		process.exit(1);
	}

	let exitCode = 0;
	try {
		await downloadModule(latestTag);
		await dumpConnectors();

		console.log(`Dumped connectors from ${latestTag} release.`);
	} catch (e) {
		console.error(`Unable to dump connectors from ${latestTag} release.`);
		console.log(e);

		exitCode = 1;
	}

	process.exit(exitCode);
}

async function downloadModule(tagName) {
	const moduleUrl = getModuleUrl(tagName);

	const response = await fetch(moduleUrl);
	if (!response.ok) {
		throw new Error('Cannot download module');
	}

	const moduleCode = await response.text();
	await writeFile(moduleFile, moduleCode);
}

async function dumpConnectors() {
	const connectors = (await import(`./${moduleFile}`)).default as any[];

	const labelArray = connectors.map((entry) => entry.label);
	const contents = JSON.stringify(labelArray, null, 2);

	if (!fs.existsSync(resDir)) {
		mkdir(resDir);
	}

	await writeFile(listFile, contents);
	await removeFile(moduleFile);
}

function getModuleUrl(tagName) {
	return `${rawContentUrl}/${tagName}/src/core/connectors.ts`;
}

main(process.argv);
