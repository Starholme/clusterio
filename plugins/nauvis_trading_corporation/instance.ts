import * as lib from "@clusterio/lib";
import { BaseInstancePlugin } from "@clusterio/host";

import {
	ExportFromInstanceEvent,
	Item,
} from "./messages";

type IpcItems = [string, number][];

export class InstancePlugin extends BaseInstancePlugin {
	pendingTasks!: Set<any>;
	pingId?: ReturnType<typeof setTimeout>;

	unexpectedError(err: Error) {
		this.logger.error(`Unexpected error:\n${err.stack}`);
	}

	async init() {
		if (!this.instance.config.get("factorio.enable_script_commands")) {
			throw new Error("nauvis_trading_corporation plugin requires script commands.");
		}

		this.pendingTasks = new Set();
		this.instance.server.on("ipc-nauvis_trading_corporation:exportFromInstance", (output: IpcItems) => {
			this.exportFromInstance(output).catch(err => this.unexpectedError(err));
		});
	}

	async onStart() {
		this.pingId = setInterval(() => {
			if (!this.host.connected) {
				return; // Only ping if we are actually connected to the controller.
			}
			this.sendRcon(
				"/sc __nauvis_trading_corporation__ storage.ticksSinceMasterPinged = 0", true
			).catch(err => this.unexpectedError(err));
		}, 5000);
	}

	async onStop() {
		clearInterval(this.pingId);
		await Promise.all(this.pendingTasks);
	}

	onExit() {
		clearInterval(this.pingId);
	}

	async exportFromInstance(items: IpcItems) {
		this.logger.verbose("Exported the following to controller:");
		this.logger.verbose(JSON.stringify(items));
		if (!this.host.connector.hasSession) {
			// For now the items are voided if the controller connection is
			// down, which is no different from the previous behaviour.
			if (this.instance.config.get("nauvis_trading_corporation.log_item_transfers")) {
				this.logger.verbose("Voided the following items:");
				this.logger.verbose(JSON.stringify(items));
			}
			return;
		}


		const fromIpcItems = items.map(item => new Item(item[0], item[1]));
		this.instance.sendTo("controller", new ExportFromInstanceEvent(fromIpcItems));

		if (this.instance.config.get("nauvis_trading_corporation.log_item_transfers")) {
			this.logger.verbose("Exported the following to controller:");
			this.logger.verbose(JSON.stringify(items));
		}
	}
}
