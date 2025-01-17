// Copyright 2019 Google LLC All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const EventEmitter = require('events');

const grpc = require('grpc');

const messages = require('../lib/sdk_pb');
const AgonesSDK = require('../src/agonesSDK');

describe('agones', () => {
	let agonesSDK;

	beforeEach(() => {
		agonesSDK = new AgonesSDK();
	});

	describe('allocate', () => {
		it('calls the server and handles success', async () => {
			spyOn(agonesSDK.client, 'allocate').and.callFake((request, callback) => {
				let result = new messages.Empty();
				callback(undefined, result);
			});
			let result = await agonesSDK.allocate();
			expect(agonesSDK.client.allocate).toHaveBeenCalled();
			expect(result).toEqual({});
		});

		it('calls the server and handles failure', async () => {
			spyOn(agonesSDK.client, 'allocate').and.callFake((request, callback) => {
				callback('error', undefined);
			});
			try {
				await agonesSDK.allocate();
				fail();
			} catch (error) {
				expect(agonesSDK.client.allocate).toHaveBeenCalled();
				expect(error).toEqual('error');
			}
		});
	});

	describe('ready', () => {
		it('calls the server and handles success', async () => {
			spyOn(agonesSDK.client, 'ready').and.callFake((request, callback) => {
				let result = new messages.Empty();
				callback(undefined, result);
			});
			let result = await agonesSDK.ready();
			expect(agonesSDK.client.ready).toHaveBeenCalled();
			expect(result).toEqual({});
		});

		it('calls the server and handles failure', async () => {
			spyOn(agonesSDK.client, 'ready').and.callFake((request, callback) => {
				callback('error', undefined);
			});
			try {
				await agonesSDK.ready();
				fail();
			} catch (error) {
				expect(agonesSDK.client.ready).toHaveBeenCalled();
				expect(error).toEqual('error');
			}
		});
	});

	describe('shutdown', () => {
		it('calls the server and handles success', async () => {
			spyOn(agonesSDK.client, 'shutdown').and.callFake((request, callback) => {
				let result = new messages.Empty();
				callback(undefined, result);
			});

			let result = await agonesSDK.shutdown();
			expect(agonesSDK.client.shutdown).toHaveBeenCalled();
			expect(result).toEqual({});
		});

		it('calls the server and handles failure', async () => {
			spyOn(agonesSDK.client, 'shutdown').and.callFake((request, callback) => {
				callback('error', undefined);
			});
			try {
				await agonesSDK.shutdown();
				fail();
			} catch (error) {
				expect(agonesSDK.client.shutdown).toHaveBeenCalled();
				expect(error).toEqual('error');
			}
		});
	});

	describe('health', () => {
		it('calls the server and passes calls to stream', async () => {
			let stream = jasmine.createSpyObj('stream', ['write']);
			spyOn(agonesSDK.client, 'health').and.callFake(() => {
				return stream;
			});

			agonesSDK.health();
			expect(agonesSDK.client.health).toHaveBeenCalled();
			expect(stream.write).toHaveBeenCalled();
		});

		it('uses the same stream for subsequent calls', async () => {
			let stream = jasmine.createSpyObj('stream', ['write']);
			spyOn(agonesSDK.client, 'health').and.callFake(() => {
				return stream;
			});

			agonesSDK.health();
			agonesSDK.health();
			expect(agonesSDK.client.health.calls.count()).toEqual(1);
			expect(stream.write.calls.count()).toEqual(2);
		});

		it('calls the server and silently handles the internal error message', async () => {
			spyOn(agonesSDK.client, 'health').and.callFake((callback) => {
				callback('error', undefined);
			});
			try {
				agonesSDK.health();
				fail();
			} catch (error) {
				expect(agonesSDK.client.health).toHaveBeenCalled();
				expect(error).not.toEqual('error');
			}
		});

		it('calls the server and handles stream completing', async () => {
			let stream = jasmine.createSpyObj('stream', ['write']);
			spyOn(agonesSDK.client, 'health').and.callFake((callback) => {
				let result = new messages.Empty();
				callback(undefined, result);
				return stream;
			});

			agonesSDK.health();
			expect(agonesSDK.client.health).toHaveBeenCalled();
		});
	});

	describe('getGameServer', () => {
		it('calls the server and handles the response', async () => {
			spyOn(agonesSDK.client, 'getGameServer').and.callFake((request, callback) => {
				let status = new messages.GameServer.Status();
				status.setState('up');
				let gameServer = new messages.GameServer();
				gameServer.setStatus(status);
				callback(undefined, gameServer);
			});

			let gameServer = await agonesSDK.getGameServer();
			expect(agonesSDK.client.getGameServer).toHaveBeenCalled();
			expect(gameServer).toBeDefined();
			expect(gameServer.status).toBeDefined();
			expect(gameServer.status.state).toEqual('up');
		});

		it('calls the server and handles failure', async () => {
			spyOn(agonesSDK.client, 'getGameServer').and.callFake((request, callback) => {
				callback('error', undefined);
			});
			try {
				await agonesSDK.getGameServer();
				fail();
			} catch (error) {
				expect(agonesSDK.client.getGameServer).toHaveBeenCalled();
				expect(error).toEqual('error');
			}
		});
	});

	describe('watchGameServer', () => {
		it('calls the server and passes events to the callback', async () => {
			let serverEmitter = new EventEmitter();
			spyOn(agonesSDK.client, 'watchGameServer').and.callFake(() => {
				return serverEmitter;
			});

			let callback = jasmine.createSpy('callback');
			agonesSDK.watchGameServer(callback);
			expect(agonesSDK.client.watchGameServer).toHaveBeenCalled();

			let status = new messages.GameServer.Status();
			status.setState('up');
			let gameServer = new messages.GameServer();
			gameServer.setStatus(status);
			serverEmitter.emit('data', gameServer);

			expect(callback).toHaveBeenCalled();
			let result = callback.calls.argsFor(0)[0];
			expect(result.status).toBeDefined();
			expect(result.status.state).toEqual('up');
		});
		it('captures CANCELLED errors only', async() => {
			let serverEmitter = new EventEmitter();
			spyOn(agonesSDK.client, 'watchGameServer').and.callFake(() => {
				return serverEmitter;
			});

			let callback = jasmine.createSpy('callback');
			agonesSDK.watchGameServer(callback);

			try {
				serverEmitter.emit('error', {
					code: grpc.status.CANCELLED
				});
			} catch (error) {
				fail();
			}

			try {
				serverEmitter.emit('error', {
					code: grpc.status.ABORTED
				});
				fail();
			} catch (error) {
				expect(error.code).toEqual(grpc.status.ABORTED);
			}
		});
	});

	describe('setLabel', () => {
		it('calls the server and handles success', async () => {
			spyOn(agonesSDK.client, 'setLabel').and.callFake((request, callback) => {
				let result = new messages.Empty();
				callback(undefined, result);
			});

			let result = await agonesSDK.setLabel('key', 'value');
			expect(agonesSDK.client.setLabel).toHaveBeenCalled();
			expect(result).toEqual({});
		});

		it('passes arguments to the server', async () => {
			spyOn(agonesSDK.client, 'setLabel').and.callFake((request, callback) => {
				let result = new messages.Empty();
				callback(undefined, result);
			});

			await agonesSDK.setLabel('key', 'value');
			expect(agonesSDK.client.setLabel).toHaveBeenCalled();
			let request = agonesSDK.client.setLabel.calls.argsFor(0)[0];
			expect(request.getKey()).toEqual('key');
			expect(request.getValue()).toEqual('value');
		});

		it('calls the server and handles failure', async () => {
			spyOn(agonesSDK.client, 'setLabel').and.callFake((request, callback) => {
				callback('error', undefined);
			});
			try {
				await agonesSDK.setLabel('key', 'value');
				fail();
			} catch (error) {
				expect(agonesSDK.client.setLabel).toHaveBeenCalled();
				expect(error).toEqual('error');
			}
		});
	});

	describe('setAnnotation', () => {
		it('calls the server and handles success', async () => {
			spyOn(agonesSDK.client, 'setAnnotation').and.callFake((request, callback) => {
				let result = new messages.Empty();
				callback(undefined, result);
			});

			let result = await agonesSDK.setAnnotation('key', 'value');
			expect(agonesSDK.client.setAnnotation).toHaveBeenCalled();
			expect(result).toEqual({});
		});

		it('passes arguments to the server', async () => {
			spyOn(agonesSDK.client, 'setAnnotation').and.callFake((request, callback) => {
				let result = new messages.Empty();
				callback(undefined, result);
			});

			await agonesSDK.setAnnotation('key', 'value');
			expect(agonesSDK.client.setAnnotation).toHaveBeenCalled();
			let request = agonesSDK.client.setAnnotation.calls.argsFor(0)[0];
			expect(request.getKey()).toEqual('key');
			expect(request.getValue()).toEqual('value');
		});

		it('calls the server and handles failure', async () => {
			spyOn(agonesSDK.client, 'setAnnotation').and.callFake((request, callback) => {
				callback('error', undefined);
			});
			try {
				await agonesSDK.setAnnotation('key', 'value');
				fail();
			} catch (error) {
				expect(agonesSDK.client.setAnnotation).toHaveBeenCalled();
				expect(error).toEqual('error');
			}
		});
	});

	describe('close', () => {
		it('closes the client connection when called', async () => {
			spyOn(agonesSDK.client, 'close');
			await agonesSDK.close();
			expect(agonesSDK.client.close).toHaveBeenCalled();
		});
		it('destroys the health stream if set', async () => {
			let stream = jasmine.createSpyObj('stream', ['destroy', 'write']);
			spyOn(agonesSDK.client, 'health').and.callFake(() => {
				return stream;
			});
			agonesSDK.health();
			spyOn(agonesSDK.client, 'close').and.callFake(() => {});
			await agonesSDK.close();
			expect(stream.destroy).toHaveBeenCalled();
		});
		it('cancels any watchers', async () => {
			let serverEmitter = new EventEmitter();
			serverEmitter.call = jasmine.createSpyObj('call', ['cancel']);
			spyOn(agonesSDK.client, 'watchGameServer').and.callFake(() => {
				return serverEmitter;
			});

			let callback = jasmine.createSpy('callback');
			agonesSDK.watchGameServer(callback);

			spyOn(agonesSDK.client, 'close');
			await agonesSDK.close();
			expect(serverEmitter.call.cancel).toHaveBeenCalled();
		});
	});
});
