'use strict';

const sandbox = require('sinon').createSandbox();

// Simulating command parameters
[
	'-e',
	'some-environment'

].forEach(argv => {
	process.argv.push(argv);
});

describe('index', () => {

	let EventSubscribersBuilder;

	beforeEach(() => {
		sandbox.stub(process, 'exit').returns();
		sandbox.stub(console, 'log').returns();
		EventSubscribersBuilder = require('./../index'); // eslint-disable-line
	});

	afterEach(() => {
		sandbox.restore();
		// clear node require caches
		Object.keys(require.cache).forEach(key => { delete require.cache[key]; });
	});

	it('should run the index script then call EventSubscribersBuilder.execute()', () => {

		const eventSubscribersBuilderMock = sandbox.mock(EventSubscribersBuilder.prototype)
			.expects('execute')
			.returns();

		const index = require('./../run'); // eslint-disable-line

		eventSubscribersBuilderMock.verify();
	});

	it('should run the index script then call EventSubscribersBuilder.execute() and the operation fails', () => {

		const eventSubscribersBuilderMock = sandbox.mock(EventSubscribersBuilder.prototype)
			.expects('execute')
			.rejects();

		const index = require('./../run'); // eslint-disable-line

		eventSubscribersBuilderMock.verify();
	});

});
