"use strict";
const libLink = require("@clusterio/lib/link");
const libPlugin = require("@clusterio/lib/plugin");
const libErrors = require("@clusterio/lib/errors");


class InstanceConnection extends libLink.Link {
	constructor(connector, slave, instanceId) {
		super("slave", "instance", connector);
		this.slave = slave;
		this.instanceId = instanceId;
		this.plugins = new Map();
		this.status = "stopped";
		libLink.attachAllMessages(this);

		for (let pluginInfo of slave.pluginInfos) {
			libPlugin.attachPluginMessages(this, { info: pluginInfo });
		}
	}

	async forwardRequestToMaster(message, request) {
		return await request.send(this.slave, message.data);
	}

	async forwardRequestToInstance(message, request) {
		let instanceId = message.data.instance_id;
		let instanceConnection = this.slave.instanceConnections.get(instanceId);
		if (!instanceConnection) {
			// Instance is probably on another slave
			return await this.forwardRequestToMaster(message, request);
		}

		if (request.plugin && !instanceConnection.plugins.has(request.plugin)) {
			throw new libErrors.RequestError(`Instance ID ${instanceId} does not have ${request.plugin} plugin loaded`);
		}

		return await request.send(instanceConnection, message.data);
	}


	async forwardEventToInstance(message, event) {
		let instanceId = message.data.instance_id;
		let instanceConnection = this.slave.instanceConnections.get(instanceId);
		if (!instanceConnection) {
			// Instance is probably on another slave
			await this.forwardEventToMaster(message, event);
			return;
		}
		if (event.plugin && !instanceConnection.plugins.has(event.plugin)) { return; }

		event.send(instanceConnection, message.data);
	}

	async forwardEventToMaster(message, event) {
		if (!this.slave.connector.hasSession) {
			return;
		}

		event.send(this.slave, message.data);
	}

	async broadcastEventToInstance(message, event) {
		for (let instanceConnection of this.slave.instanceConnections.values()) {
			// Do not broadcast back to the source
			if (instanceConnection === this) { continue; }
			if (event.plugin && !instanceConnection.plugins.has(event.plugin)) { continue; }

			event.send(instanceConnection, message.data);
		}
	}

	async instanceInitializedEventHandler(message, event) {
		this.plugins = new Map(Object.entries(message.data.plugins));
	}

	async instanceStatusChangedEventHandler(message, event) {
		this.status = message.data.status;
		if (this.status === "stopped") {
			this.slave.instanceConnections.delete(this.instanceId);
		}
		this.forwardEventToMaster(message, event);
	}
}

module.exports = InstanceConnection;