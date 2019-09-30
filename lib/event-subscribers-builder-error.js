'use strict';

class EventSubscribersBuilderError extends Error {

	static get codes() {

		return {
			YML_BUILD_ERROR: 1
		};

	}

	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'EventSubscribersBuilderError';
	}
}

module.exports = EventSubscribersBuilderError;
