import EventEmitter from 'events';
import uuid from 'node-uuid';
import crypto from 'crypto';
import {Tabson} from '../../tabson';
import rehost from '../../tabson/rehost';
import luapkg from '../../tabson/luapkg';

export class BackendModem extends EventEmitter {

    constructor() {
        super();
        this.nonFileScriptIdCount = 0;
    }

    sendFrontend(value) {
        this.emit('send-frontend', value);
    }

    sendBackend(value) {
        this.emit('send-backend', value);
    }

    deliver = async (msg, store) => {
        if (msg.method === 'sessionPrepare') {
            this.sessionPrepare(msg.params, store);
            return;
        }
        if (msg.method === 'consoleApi') {
            this.consoleApi(msg.params, store);
            return;
        }
        if (msg.method === 'executePaused') {
            this.debuggerPause(msg.params, store);
            return;
        }
        if (msg.method === 'executeResumed') {
            this.debuggerResumed(msg.params, store);
            return;
        }
        if (msg.method === 'stackScope') {
            this.stackScope(msg.params, store);
            return;
        }
        if (msg.method === 'stackWatch') {
            this.stackWatch(msg.params, store);
            return;
        }
        if (msg.method === 'repl') {
            this.repl(msg.params, store);
            return;
        }
    }

    scriptParsed = async (scriptId, store, endLine = -1) => {
        if (!scriptId.startsWith('@')) {
            return;
        }
        if (store.scriptParsedFiles[scriptId]) {
            return;
        }
        store.scriptParsedFiles[scriptId] = true;
        const md5sum = crypto.createHash('md5');
        md5sum.update(scriptId);

        this.sendFrontend({
            method: 'Debugger.scriptParsed',
            params: {
                endColumn: 0,
                endLine: endLine,
                executionContextAuxData: {
                    frameId: '1',
                    isDefault: true,
                },
                executionContextId: 1,
                hasSourceURL: false,
                hash: md5sum.digest('hex').toUpperCase(),
                isLiveEdit: false,
                scriptId: scriptId,
                sourceMapURL: '',
                startColumn: 0,
                startLine: 0,
                url: luapkg.sourceToUrl(scriptId),
            },
        });
    }

    sessionPrepare = async(data, store) => {
        let breakpoints;
        if (store.activeBreakpoints) {
            breakpoints = await store.breakpointGetAll();
            for (const breakpoint of breakpoints) {
                delete breakpoint.breakpointId;
            }
        } else {
            breakpoints = [];
        }
        const blackboxes = await store.blackboxGetAll();
        for (const blackbox of blackboxes) {
            delete blackbox.blackboxId;
        }
        const method = 'session.prepareInfo';
        const params = {breakpoints, blackboxes};
        this.sendBackend({method, params});
    }

    consoleApi = async (data, store) => {
        const stacks = data.stacks || [];

        const firstStack = stacks[0];
        if (firstStack && firstStack.file.includes('hostvm')) {
            stacks.shift();
        }

        await (async () => {
            for (const s of stacks) {
                await this.scriptParsed(s.file, store);
            }
        })();

        const frames = stacks.map((s) => {
            let scriptId, url;
            if (s.file === '=stdin') {
                this.nonFileScriptParsed();
                scriptId = `=stdin-${this.nonFileScriptIdCount}`;
                const path = `stdin-${this.nonFileScriptIdCount}`;
                url = `http://other/${path}`;
            } else {
                url = luapkg.sourceToUrl(s.file);
            }

            return {
                columnNumber: 0,
                functionName: s.func,
                lineNumber: s.line - 1,  // lua 从 1 开始
                scriptId: scriptId,
                url: url,
            };
        });

        const props = {id: uuid.v4(), group: 'console'};
        const docId = JSON.stringify(props);
        store.jsobjAppendOne(docId, data.value);

        const argsField = [];
        for (let i = 0; i < data.value.length; i++) {
            let value = data.value[i];
            const vProps = Object.assign({index: i}, props);
            if (value.vmtype === 'host') {
                value = rehost(value);
            }
            const tv = new Tabson(value, vProps);
            argsField.push(tv.value());
        }

        const resp = {
            method: 'Runtime.consoleAPICalled',
            params: {
                args: argsField,
                executionContextId: 1,
                stackTrace: {
                    callFrames: frames,
                },
                timestamp: new Date().getTime(),
                type: data.type || 'log',
            },
        };
        store.eventAppendOne(resp);
        this.sendFrontend(resp);
    }

    nonFileScriptParsed = async () => {
        this.nonFileScriptIdCount += 1;
        const scriptId = `=stdin-${this.nonFileScriptIdCount}`;
        const path = `stdin-${this.nonFileScriptIdCount}`;
        const md5sum = crypto.createHash('md5');
        md5sum.update(scriptId);
        this.sendFrontend({
            method: 'Debugger.scriptParsed',
            params: {
                endColumn: 0,
                endLine: 1,
                executionContextAuxData: {
                    frameId: '1',
                    isDefault: true,
                },
                executionContextId: 1,
                hasSourceURL: false,
                hash: md5sum.digest('hex').toUpperCase(),
                isLiveEdit: false,
                scriptId: scriptId,
                sourceMapURL: '',
                startColumn: 0,
                startLine: 0,
                url: `http://other/${path}`,
            },
        });
    }

    debuggerPause = async(data, store) => {
        store.debuggerPauseData = data;
        store.frameScriptIdCount += 1;

        let stacks;
        if (data.stacks) {
            stacks = data.stacks.slice();
        } else {
            stacks = [];
        }

        const firstStack = stacks[0];
        let firstStackShifted = false;
        if (firstStack && firstStack.file.includes('hostvm')) {
            stacks.shift();
            firstStackShifted = true;
        }

        await (async () => {
            for (const s of stacks) {
                await this.scriptParsed(s.file, store);
            }
        })();

        const callFrames = stacks.map((s, i) => {
            const callFrameId = JSON.stringify({
                ordinal: firstStackShifted ? (i + 1) : i,
                injectedScriptId: store.frameScriptIdCount,
            });
            const scopeChain = [
                {
                    object: {
                        className: 'Object',
                        description: 'Table',
                        objectId: JSON.stringify({
                            level: firstStackShifted ? (i + 1) : i,
                            group: 'locals',
                        }),
                        type: 'object',
                    },
                    type: 'local',
                },
                {
                    object: {
                        className: 'Object',
                        description: 'Table',
                        objectId: JSON.stringify({
                            level: firstStackShifted ? (i + 1) : i,
                            group: 'upvalues',
                        }),
                        type: 'object',
                    },
                    type: 'closure',
                },
            ];
            return {
                callFrameId,
                functionLocation: {
                    columnNumber: 0,
                    lineNumber: s.line - 1,
                    scriptId: s.file,
                },
                functionName: s.func,
                location: {
                    columnNumber: 0,
                    lineNumber: s.line - 1,
                    scriptId: s.file,

                },
                scopeChain: scopeChain,
            };
        });

        const hitBreakpoints = [];
        const stack = stacks[0];
        const scriptId = stack.file;
        if (scriptId.startsWith('@')) {
            const url = luapkg.sourceToUrl(scriptId);
            hitBreakpoints.push(`${url}:${stack.line - 1}:0`);
        }

        const resp = {
            method: 'Debugger.paused',
            params: {
                callFrames,
                hitBreakpoints: hitBreakpoints,
                reason: 'other',
                data: {step: data.step},
            },
        };
        this.sendFrontend(resp);
    }

    stackScope = async (data, store) => {
        const props = {id: uuid.v4(), group: `${data.type}-result`};
        const docId = JSON.stringify(props);
        store.debuggerPauseResults[docId] = data.value;
        const result = [];
        for (const [k, v] of Object.entries(data.value)) {
            const vProps = Object.assign({index: k}, props);
            const re = rehost(v);
            const tv = new Tabson(re, vProps);

            const arg = {
                configurable: false,
                enumerable: true,
                isOwn: true,
                writable: false,
                name: k,
                value: tv.value(),
            };
            result.push(arg);
        }
        const resp = {id: data.parrot.id, result: {result}};
        this.sendFrontend(resp);
    }

    stackWatch = async (data, store) => {
        const props = {id: uuid.v4(), group: 'watch'};
        const docId = JSON.stringify(props);
        store.jsobjAppendOne(docId, data.value);
        let dumped = data.value;
        if (dumped.vmtype === 'host') {
            dumped = rehost(dumped);
        }
        const tv = new Tabson(dumped, props);
        const valueFeild = tv.value();
        const result = {result: valueFeild};
        if (data.error) {
            const value = valueFeild.value;
            const text = value.description || String(value);
            result.exceptionDetails = {
                columnNumber: 0,
                lineNumber: 0,
                text: text,
                exceptionId: new Date().getTime(),
            };
        }
        const resp = {id: data.parrot.id, result};
        this.sendFrontend(resp);
    }

    repl = async (data, store) => {
        const props = {id: uuid.v4(), group: 'repl'};
        const docId = JSON.stringify(props);
        store.jsobjAppendOne(docId, data.value);
        let dumped = data.value;
        if (dumped.vmtype === 'host') {
            dumped = rehost(dumped);
        }
        const tv = new Tabson(dumped, props);
        const valueFeild = tv.value();
        const result = {result: valueFeild};
        if (data.error) {
            const value = valueFeild.value;
            const text = value.description || String(value);
            result.exceptionDetails = {
                columnNumber: 0,
                lineNumber: 0,
                text: text,
                exceptionId: new Date().getTime(),
            };
        }
        const resp = {id: data.parrot.id, result};
        this.sendFrontend(resp);
    }

    debuggerResumed = async (data, store) => {
        store.debuggerPauseData = null;
        store.debuggerPauseResults = {};
        const resp = {
            method: 'Debugger.resumed',
            params: {},
        };
        this.sendFrontend(resp);
    }
}
