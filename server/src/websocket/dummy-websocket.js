import EventEmitter from 'events';
import WebSocket from 'ws';
import wsUtils from './utils';

export class DummyWebSocket extends EventEmitter {

    constructor() {
        super();
        this.readyState = WebSocket.OPEN;
        this.socket = {
            remoteAddress: null,
            remotePort: null,
        };
    }

    close() {
        this.readyState = WebSocket.CLOSED;
    }

    send() {
    }

    static fromUrl(url, type) {
        const ws = new DummyWebSocket();
        ws.id = wsUtils.id(type);
        ws.location = wsUtils.location(url);
        return ws;
    }

}
