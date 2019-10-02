# event-subscribers-builder

[![Build Status](https://travis-ci.org/janis-commerce/event-subscribers-builder.svg?branch=master)](https://travis-ci.org/janis-commerce/event-subscribers-builder)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/event-subscribers-builder/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/event-subscribers-builder?branch=master)

A package for build event suscribers

## Usage
```
npx @janiscommerce/event-subscribers-builder
```

### Options:
```
--environment, -e  environment for resolving the listeners endpoints
```

### Paths
This utility does not receives any path parameters in the command line, it will use the next paths:
- **input** (where it will obtain the source ymls to build): `/path/to/root/events/src`
- **output** (where the new yml will be built): `/path/to/root/events/subscribers.yml`
- **schemas** (where the built api schemas will be obtained): `/path/to/root/schemas/public.json`

### Important
- **Before running this utility, you must build the api schemas first.**

## Examples
This package will merge all the yamls from the directory `/path/to/root/events/src` into a single yaml file `/path/to/root/events/subscribers.yml` then will resolve all listeners namespaces and methods obtained from your built api schemas.

### Event yaml example (before running the utility)
```yaml
events:
  - service: some-service
    entity: some-entity
    event: some-event
    listeners:
      - namespace: some-namespace
        method: some-method
```

### Built schemas example
```json
{
	"servers": [
		{
			"url": "https://some-server.com/api",
			"description": "The Beta API server",
			"variables": {
				"environment": {
					"default": "beta"
				}
			}
		}
	],
	"paths": {
		"/some-path": {
			"get": {
				"x-janis-namespace": "some-namespace",
				"x-janis-method": "some-method"
			}
		}
	}
}
```

### Running the utility with beta environment
```sh
npx @janiscommerce/event-subscribers-builder -e beta
```

### Event yaml example (after running the utility)
```yaml
events:
  - service: some-service
    entity: some-entity
    event: some-event
    listeners:
      - namespace: http://some-server.com/api/some-path
        method: get
```