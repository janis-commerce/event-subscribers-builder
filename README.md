# event-subscribers-builder

[![Build Status](https://travis-ci.org/janis-commerce/event-subscribers-builder.svg?branch=master)](https://travis-ci.org/janis-commerce/event-subscribers-builder)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/event-subscribers-builder/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/event-subscribers-builder?branch=master)

A package for build event suscribers

## Installation
```sh
npm install @janiscommerce/event-subscribers-builder
```

## Usage (command line)
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

```sh
npx @janiscommerce/event-subscribers-builder -e beta

# Will get the source files from /path/to/root/events/src
# Will generate the output file into /path/to/root/events/subscribers.yml
```

## Usage (as module)
```js
const EventSubscribersBuilder = require('@janiscommerce/event-subscribers-builder');
```

## API

### **`new eventSubscribersBuilder(environment, input, output, schemas)`**

Constructs the YmlBuilder instance, configuring the `environment [String]`, `input [String]`, `output [String]` and built api `schemas [String]` path.

### **`async execute(environment, input, output, schemas)`**

Builds the ymls from the input path into the output file path.
Optionally you can specify the `environment [String]`, `input [String]`, `output [String]` and `schemas [String]` path, by default it will be obtained from the constructor config.

## Examples

```js
const EventSubscribersBuilder = require('@janiscommerce/event-subscribers-builder');

const eventSubscribersBuilder = new EventSubscribersBuilder('environment', 'input-dir', 'output-file.yml', 'schemas/public.json');

(async () => {

	await eventSubscribersBuilder.execute(); // It will run the build process...

})();
```