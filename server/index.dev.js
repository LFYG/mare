const WebApp = require('./src/webapp').WebApp;
const Bridge = require('./src/bridge').Bridge;
const packageJson = require('./package.json');

const webapp = new WebApp(packageJson);
const config = {
    storage: {
        database: 'mongodb://127.0.0.1:27017/mare',
    },
    session: {
        expire: 30,
    },
    frontend: {
        host: '127.0.0.1',
        port: 9223,
    },
    backend: {
        host: '127.0.0.1',
        port: 8083,
    },
};
const bridge = new Bridge(config);

const frontendAddress = `${config.frontend.host}:${config.frontend.port}`;
const backendAddress = `${config.backend.host}:${config.backend.port}`;
console.info('Run in development mode');
console.info(`* HTTP Server: http://${frontendAddress}/`);
console.info(`* Lua Server: socket://${backendAddress}/`);
bridge.mount(webapp);
bridge.start();

process.on('unhandledRejection', (reason) => {
    console.error(reason.stack);
});
