#!/usr/bin/env node

'use strict';

const { argv } = require('yargs')
	.option('environment', {
		alias: 'e',
		describe: 'environment for resolving the listeners endpoints',
		type: 'string',
		default: 'local'
	});

const EventSubscribersBuilder = require('./lib/event-subscribers-builder');
const log = require('./lib/utils/lllog-wrapper');

const INPUT_PATH = 'events/src';
const OUTPUT_PATH = 'events/subscribers.yml';
const SCHEMAS_PATH = 'schemas/public.json';

(async () => {

	const { environment } = argv;

	const eventSubscribersBuilder = new EventSubscribersBuilder(environment, INPUT_PATH, OUTPUT_PATH, SCHEMAS_PATH);

	try {

		await eventSubscribersBuilder.execute();

		log.confirm('Operation completed successfully', '✓ EVENT-SUBSCRIBERS-BUILDER');

		process.exit(0);

	} catch(err) {

		log.error(err.message, 'Operation failed', '⨯ EVENT-SUBSCRIBERS-BUILDER');

		process.exit(1);
	}

})();
