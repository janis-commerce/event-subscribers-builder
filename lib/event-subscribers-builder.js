'use strict';

const path = require('path');
const YAML = require('yaml');

const EndpointResolver = require('@janiscommerce/endpoint-resolver');
const { YmlBuilder } = require('./../node_modules/@janiscommerce/yml-builder/lib');

const fs = require('./utils/promisified-fs');
const log = require('./utils/lllog-wrapper');

const EventSubscribersBuilderError = require('./event-subscribers-builder-error');

/**
 * @class EventSubscribersBuilder
 * @classdesc Builds event ymls from src then resolve the endpoints
 */
class EventSubscribersBuilder {

	constructor(input, output) {
		this.input = input;
		this.output = output;
	}

	get inputPath() {
		return path.join(process.cwd(), this.input);
	}

	get outputPath() {
		return path.join(process.cwd(), this.output);
	}

	_buildYmls() {
		const ymlBuilder = new YmlBuilder(this.input, this.output);
		return ymlBuilder.execute();
	}

	async execute() {

		log.message('Building events ymls...', '⚙ EVENT-SUBSCRIBERS-BUILDER');
		try {
			await this._buildYmls();
		} catch(err) {
			log.error(err.message, 'Events ymls build failed', '⨯ EVENT-SUBSCRIBERS-BUILDER');
			throw new EventSubscribersBuilderError('Events ymls build failed', EventSubscribersBuilderError.codes.YML_BUILD_ERROR);
		}
		log.confirm('Event ymls build successful', '✓ EVENT-SUBSCRIBERS-BUILDER');
	}

}

module.exports = EventSubscribersBuilder;
