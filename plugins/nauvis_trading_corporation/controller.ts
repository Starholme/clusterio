import { BaseControllerPlugin, type ControlConnection } from "@clusterio/controller";

import fs from "fs-extra";
import path from "path";

import * as lib from "@clusterio/lib";
const { Counter, Gauge } = lib;

import * as routes from "./routes";

import {
	Item,
	ExportFromInstanceEvent
} from "./messages";

export class ControllerPlugin extends BaseControllerPlugin {
	subscribedControlLinks!: Set<ControlConnection>;

	async init() {
		this.subscribedControlLinks = new Set();

		this.controller.handle(ExportFromInstanceEvent, this.handleExportFromInstanceEvent.bind(this));
	}
	
	async handleExportFromInstanceEvent(request: ExportFromInstanceEvent, src: lib.Address){
		let instanceId = src.id;
		
		if (this.controller.config.get("nauvis_trading_corporation.log_item_transfers")) {
			this.logger.verbose(
				`Imported the following from ${instanceId}:\n${JSON.stringify(request.items)}`
			);
		}
	}

	onControlConnectionEvent(connection: ControlConnection, event: string) {
		if (event === "close") {
			this.subscribedControlLinks.delete(connection);
		}
	}

	async onShutdown() {
		
	}

	async onSaveData() {
		
	}
}
