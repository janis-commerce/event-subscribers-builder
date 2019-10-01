'use strict';

class EventSubscribersBuilderError extends Error {

	static get codes() {

		return {
			API_SCHEMAS_NOT_FOUND: 1,
			FS_READ_WRITE_ERROR: 2,
			YML_BUILD_ERROR: 3,
			YML_PARSE_ERROR: 4,
			INVALID_YML: 5,
			INVALID_YML_LISTENERS: 6,
			INVALID_YML_LISTENER_FORMAT: 7,
			YML_EXPORT_ERROR: 8,
			ENDPOINT_RESOLVE_ERROR: 9
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
