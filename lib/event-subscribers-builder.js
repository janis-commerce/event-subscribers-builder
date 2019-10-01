'use strict';

const path = require('path');
const YAML = require('yaml');

const EndpointResolver = require('@janiscommerce/endpoint-resolver');

const YmlBuilder = require('@janiscommerce/yml-builder');

const fs = require('./utils/promisified-fs');
const log = require('./utils/lllog-wrapper');

const EventSubscribersBuilderError = require('./event-subscribers-builder-error');

/**
 * @class EventSubscribersBuilder
 * @classdesc Builds event ymls from src then resolve the endpoints
 */
class EventSubscribersBuilder {

	constructor(environment, input, output, schemas) {
		this.environment = environment;
		this.input = input;
		this.output = output;
		this.schemas = schemas;
	}

	get inputPath() {
		return path.join(process.cwd(), this.input);
	}

	get outputPath() {
		return path.join(process.cwd(), this.output);
	}

	get schemasPath() {
		return path.join(process.cwd(), this.schemas);
	}

	async _validateBuiltSchemas(schemasPath) {

		try {

			await fs.stat(schemasPath);

		} catch(err) {
			if(err.code === 'ENOENT') {
				throw new EventSubscribersBuilderError('Built api schemas not found. Please build before run this utility.',
					EventSubscribersBuilderError.codes.API_SCHEMAS_NOT_FOUND);
			}
			throw new EventSubscribersBuilderError(`Couldn't get the built schemas file: ${err.message}`,
				EventSubscribersBuilderError.codes.FS_READ_WRITE_ERROR);
		}

	}

	async _getSourceYml(filepath) {

		try {
			const sourceFile = await fs.readFile(filepath, 'utf8');
			return YAML.parse(sourceFile);
		} catch(err) {
			throw new EventSubscribersBuilderError(`Unable to get or parse source file data: ${err.message}`,
				EventSubscribersBuilderError.codes.YML_PARSE_ERROR);
		}
	}

	async _resolveEndpoints(environment, schemas, source) {

		if(!Array.isArray(source.events))
			throw new EventSubscribersBuilderError('Invalid events yml: Should have the events array.', EventSubscribersBuilderError.codes.INVALID_YML);

		const endpointResolver = new EndpointResolver(schemas, environment);

		const resolved = { events: [] };

		for(const event of source.events) {

			if(!Array.isArray(event.listeners))
				throw new EventSubscribersBuilderError('Invalid event listeners: Should be an array.', EventSubscribersBuilderError.codes.INVALID_YML_LISTENERS);

			const resolvedEvent = { ...event, listeners: [] };

			for(const listener of event.listeners) {

				if(typeof listener.namespace !== 'string' && typeof listener.method !== 'string') {
					throw new EventSubscribersBuilderError('Invalid event listener: Should be an object with namespace and method properties.',
						EventSubscribersBuilderError.codes.INVALID_YML_LISTENER_FORMAT);
				}

				try {
					const { httpMethod, url } = await endpointResolver.resolve(listener.namespace, listener.method);

					resolvedEvent.listeners.push({
						namespace: url,
						method: httpMethod
					});
				} catch(err) {
					throw new EventSubscribersBuilderError(err.message, EventSubscribersBuilderError.codes.ENDPOINT_RESOLVE_ERROR);
				}
			}

			resolved.events.push(resolvedEvent);
		}

		return resolved;
	}

	_buildYmls(input, output) {

		// Fix duplicated process.cwd()
		input = input.replace(process.cwd(), '');
		output = output.replace(process.cwd(), '');

		const ymlBuilder = new YmlBuilder(input, output);
		return ymlBuilder.execute();
	}

	_exportSourceYml(source) {
		try {
			return YAML.stringify(source);
		} catch(err) {
			throw new EventSubscribersBuilderError(`Unable to export the source file: ${err.message}`,
				EventSubscribersBuilderError.codes.YML_EXPORT_ERROR
			);
		}
	}

	async execute(environment = this.environment, input = this.inputPath, output = this.outputPath, schemas = this.schemasPath) {

		// Validations
		log.message('Checking built api schemas...', '⚙ EVENT-SUBSCRIBERS-BUILDER');
		await this._validateBuiltSchemas(schemas);
		log.confirm('Built api schemas found', '✓ EVENT-SUBSCRIBERS-BUILDER');

		// Input and output path validations are innecessary due Yml-builder validates these paths.

		log.message('Building events ymls...', '⚙ EVENT-SUBSCRIBERS-BUILDER');

		try {
			await this._buildYmls(input, output);
		} catch(err) {
			log.error(err.message, 'Can\'t build events ymls', '⨯ EVENT-SUBSCRIBERS-BUILDER');
			throw new EventSubscribersBuilderError('Unable to build the event ymls', EventSubscribersBuilderError.codes.YML_BUILD_ERROR);
		}

		log.confirm('Events ymls built successfully', '✓ EVENT-SUBSCRIBERS-BUILDER');

		log.message('Resolving subscribers endpoints...', '⚙ EVENT-SUBSCRIBERS-BUILDER');

		let resolvedYml;

		try {

			log.message('Reading built events yml file...', '⚙ EVENT-SUBSCRIBERS-BUILDER');
			const eventsYml = await this._getSourceYml(output);

			log.message('Resolving endpoints...', '⚙ EVENT-SUBSCRIBERS-BUILDER');
			resolvedYml = await this._resolveEndpoints(environment, schemas, eventsYml);
			resolvedYml = this._exportSourceYml(resolvedYml);

		} catch(err) {
			log.error(err.message, 'Unable to resolve subscribers endpoints', '⨯ EVENT-SUBSCRIBERS-BUILDER');
			throw new EventSubscribersBuilderError('Unable to resolve the subscribers endpoints', EventSubscribersBuilderError.codes.ENDPOINT_RESOLVE_ERROR);
		}

		log.confirm('Endpoints resolved successfully', '✓ EVENT-SUBSCRIBERS-BUILDER');

		log.message(`Writing file '${output}'...`, '⚙ EVENT-SUBSCRIBERS-BUILDER');

		try {
			await fs.writeFile(output, resolvedYml, { recursive: true });
		} catch(err) {
			log.error(err.message, err.code || 'Unknown fs write error', '⨯ EVENT-SUBSCRIBERS-BUILDER');
			throw new EventSubscribersBuilderError(`Unable to write file '${output}'`, EventSubscribersBuilderError.codes.FS_READ_WRITE_ERROR);
		}

		log.confirm('Write successful', '✓ EVENT-SUBSCRIBERS-BUILDER');

	}

}

module.exports = EventSubscribersBuilder;
