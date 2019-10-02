'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();
const path = require('path');
const YAML = require('yaml');
const EndpointResolver = require('@janiscommerce/endpoint-resolver');
const YmlBuilder = require('@janiscommerce/yml-builder');
const fs = require('./../lib/utils/promisified-fs');

const { EventSubscribersBuilder } = require('./../lib');

const EventSubscribersBuilderError = require('./../lib/event-subscribers-builder-error');

const fakeSchemas = {
	servers: [{
		url: 'https://someserver.com/api',
		variables: {
			environment: {
				default: 'local'
			}
		}
	}],
	paths: {
		'/some-entity': {
			get: {
				'x-janis-namespace': 'some-entity',
				'x-janis-method': 'get'
			}
		}
	}
};

describe('EventSubscribersBuilder', () => {

	const eventSubscribersBuilder = new EventSubscribersBuilder('some-environment', 'input-path', 'output-path/output-file.yml', 'schemas/public.json');
	const environment = 'some-environment';
	const inputPath = path.join(process.cwd(), 'input-path');
	const outputPath = path.join(process.cwd(), 'output-path/output-file.yml');
	const schemasPath = path.join(process.cwd(), 'schemas/public.json');

	beforeEach(() => {
		sandbox.stub(console, 'log').returns();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('_getSourceYml()', () => {

		it('should not reject when the schemas file exists', async () => {

			const statMock = sandbox.mock(fs).expects('stat')
				.withExactArgs(schemasPath)
				.returns();

			await assert.doesNotReject(eventSubscribersBuilder._validateBuiltSchemas(schemasPath));

			statMock.verify();
		});

		it('should reject when the schemas file not exists', async () => {

			const statMock = sandbox.mock(fs).expects('stat')
				.withExactArgs(schemasPath)
				.rejects({ code: 'ENOENT' });

			await assert.rejects(eventSubscribersBuilder._validateBuiltSchemas(schemasPath), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.API_SCHEMAS_NOT_FOUND
			});

			statMock.verify();
		});

		it('should reject when the fs process fails', async () => {

			const statMock = sandbox.mock(fs).expects('stat')
				.withExactArgs(schemasPath)
				.rejects();

			await assert.rejects(eventSubscribersBuilder._validateBuiltSchemas(schemasPath), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.FS_READ_WRITE_ERROR
			});

			statMock.verify();
		});
	});

	describe('_getSourceYml()', () => {

		it('should return the source yml in JSON format', async () => {

			const readFileMock = sandbox.mock(fs).expects('readFile')
				.withExactArgs(outputPath, 'utf8')
				.returns('some: property');

			assert.deepStrictEqual(await eventSubscribersBuilder._getSourceYml(outputPath), {
				some: 'property'
			});

			readFileMock.verify();
		});

		it('should reject when the operation fails', async () => {

			const readFileMock = sandbox.mock(fs).expects('readFile')
				.withExactArgs(outputPath, 'utf8')
				.rejects();

			await assert.rejects(eventSubscribersBuilder._getSourceYml(outputPath), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.YML_PARSE_ERROR
			});

			readFileMock.verify();
		});
	});

	describe('_resolveEndpoints()', () => {

		it('should resolve the endpoints then return the results', async () => {

			const endpointResolverSpy = sandbox.spy(EndpointResolver.prototype, 'resolve');

			const fakeYml = {
				events: [{
					listeners: [{
						namespace: 'some-entity',
						method: 'get'
					}]
				}]
			};

			assert.deepStrictEqual(await eventSubscribersBuilder._resolveEndpoints('local', fakeSchemas, fakeYml), {
				events: [{
					listeners: [{
						method: 'get',
						namespace: 'https://someserver.com/api/some-entity'
					}]
				}]
			});

			sandbox.assert.calledOnce(endpointResolverSpy);
			sandbox.assert.calledWithExactly(endpointResolverSpy, 'some-entity', 'get');
		});

		it('should reject when the received yml is invalid', async () => {

			const endpointResolverSpy = sandbox.spy(EndpointResolver.prototype, 'resolve');

			await assert.rejects(eventSubscribersBuilder._resolveEndpoints('local', fakeSchemas, {}), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.INVALID_YML
			});

			sandbox.assert.notCalled(endpointResolverSpy);
		});

		it('should reject when the schemas file is invalid or uncomplete', async () => {

			const endpointResolverSpy = sandbox.spy(EndpointResolver.prototype, 'resolve');

			const fakeYml = {
				events: [{
					listeners: [{
						namespace: 'some-entity',
						method: 'get'
					}]
				}]
			};

			await assert.rejects(eventSubscribersBuilder._resolveEndpoints('local', {}, fakeYml), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.ENDPOINT_RESOLVE_ERROR
			});

			sandbox.assert.calledOnce(endpointResolverSpy);
			sandbox.assert.calledWithExactly(endpointResolverSpy, 'some-entity', 'get');
		});

		it('should reject when the received listeners are invalid or not exists', async () => {

			const endpointResolverSpy = sandbox.spy(EndpointResolver.prototype, 'resolve');

			const fakeYml = {
				events: [{
					listeners: {}
				}]
			};

			await assert.rejects(eventSubscribersBuilder._resolveEndpoints('local', fakeSchemas, fakeYml), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.INVALID_YML_LISTENERS
			});

			sandbox.assert.notCalled(endpointResolverSpy);
		});

		it('should reject when the received listeners are bad formatted', async () => {

			const endpointResolverSpy = sandbox.spy(EndpointResolver.prototype, 'resolve');

			const fakeYml = {
				events: [{
					listeners: [{}]
				}]
			};

			await assert.rejects(eventSubscribersBuilder._resolveEndpoints('local', fakeSchemas, fakeYml), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.INVALID_YML_LISTENER_FORMAT
			});

			sandbox.assert.notCalled(endpointResolverSpy);
		});
	});

	describe('_exportSourceYml()', () => {

		it('should return the YAML file string from the YAML JSON', async () => {

			const yamlSpy = sandbox.spy(YAML, 'stringify');

			assert.deepStrictEqual(eventSubscribersBuilder._exportSourceYml({ some: 'property' }), 'some: property\n');

			sandbox.assert.calledOnce(yamlSpy);
			sandbox.assert.calledWithExactly(yamlSpy, { some: 'property' });
		});

		it('should throw when the operation fails', async () => {

			const yamlMock = sandbox.mock(YAML).expects('stringify')
				.withExactArgs({ some: 'property' })
				.throws();

			assert.throws(() => eventSubscribersBuilder._exportSourceYml({ some: 'property' }), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.YML_EXPORT_ERROR
			});

			yamlMock.verify();
		});
	});

	describe('_buildYmls()', () => {

		it('should return yml-builder.execute()', async () => {

			const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype).expects('execute')
				.withExactArgs()
				.returns(new Promise(res => res()));

			await assert.doesNotReject(eventSubscribersBuilder._buildYmls(inputPath, outputPath));

			ymlBuilderMock.verify();
		});
	});

	describe('execute()', () => {

		it('should build the ymls then resolve the endpoints to the built file', async () => {

			const fakeYml = YAML.stringify({
				events: [{
					listeners: [{
						namespace: 'some-namespace',
						method: 'some-method'
					}]
				}]
			});

			const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype);
			const endpointResolverMock = sandbox.mock(EndpointResolver.prototype);
			const fsMock = sandbox.mock(fs);

			// _validateBuiltSchemas
			fsMock.expects('stat')
				.withExactArgs(schemasPath)
				.returns();

			// _buildYmls
			ymlBuilderMock.expects('execute')
				.returns(new Promise(res => res()));

			// _getSourceYml
			fsMock.expects('readFile')
				.withExactArgs(outputPath, 'utf8')
				.returns(fakeYml);

			// _resolveEndpoints
			endpointResolverMock.expects('resolve')
				.withExactArgs('some-namespace', 'some-method')
				.returns({
					httpMethod: 'get',
					url: 'http://some-server.com/api/some-namespace'
				});

			// output file write
			fsMock.expects('writeFile')
				.withArgs(outputPath)
				.returns();

			await assert.doesNotReject(eventSubscribersBuilder.execute());

			endpointResolverMock.verify();
			ymlBuilderMock.verify();
			fsMock.verify();
		});

		it('should reject when yml-builder can\'t build the ymls', async () => {

			const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype);
			const eventSubscribersBuilderMock = sandbox.mock(EventSubscribersBuilder.prototype);

			eventSubscribersBuilderMock.expects('_validateBuiltSchemas')
				.withExactArgs(schemasPath)
				.returns();

			ymlBuilderMock.expects('execute')
				.rejects();

			await assert.rejects(eventSubscribersBuilder.execute(), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.YML_BUILD_ERROR
			});

			eventSubscribersBuilderMock.verify();
			ymlBuilderMock.verify();
		});

		it('should reject when can\'t resolve the endpoints', async () => {

			const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype);
			const endpointResolverMock = sandbox.mock(EndpointResolver.prototype);
			const eventSubscribersBuilderMock = sandbox.mock(EventSubscribersBuilder.prototype);

			eventSubscribersBuilderMock.expects('_validateBuiltSchemas')
				.withExactArgs(schemasPath)
				.returns();

			ymlBuilderMock.expects('execute')
				.returns(new Promise(res => res()));

			eventSubscribersBuilderMock.expects('_getSourceYml')
				.withExactArgs(outputPath)
				.returns({
					events: [{
						listeners: [{
							namespace: 'some-namespace',
							method: 'some-method'
						}]
					}]
				});

			endpointResolverMock.expects('resolve')
				.withExactArgs('some-namespace', 'some-method')
				.rejects();

			await assert.rejects(eventSubscribersBuilder.execute(), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.ENDPOINT_RESOLVE_ERROR
			});

			eventSubscribersBuilderMock.verify();
			endpointResolverMock.verify();
			ymlBuilderMock.verify();
		});

		it('should reject when can\'t write the output file', async () => {

			const eventSubscribersBuilderMock = sandbox.mock(EventSubscribersBuilder.prototype);
			const fsMock = sandbox.mock(fs);

			eventSubscribersBuilderMock.expects('_validateBuiltSchemas')
				.withExactArgs(schemasPath)
				.returns();

			eventSubscribersBuilderMock.expects('_buildYmls')
				.returns(new Promise(res => res()));


			eventSubscribersBuilderMock.expects('_getSourceYml')
				.withExactArgs(outputPath)
				.returns({ some: 'property' });

			eventSubscribersBuilderMock.expects('_resolveEndpoints')
				.withArgs(environment, schemasPath, { some: 'property' })
				.returns({ some: 'property' });

			eventSubscribersBuilderMock.expects('_exportSourceYml')
				.withExactArgs({ some: 'property' })
				.returns('some: property');

			fsMock.expects('writeFile')
				.withExactArgs(outputPath, 'some: property', { recursive: true })
				.rejects();

			await assert.rejects(eventSubscribersBuilder.execute(), {
				name: 'EventSubscribersBuilderError',
				code: EventSubscribersBuilderError.codes.FS_READ_WRITE_ERROR
			});

			eventSubscribersBuilderMock.verify();
			fsMock.verify();
		});

	});

});
