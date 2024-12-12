import { BaseControllerPlugin, type ControlConnection } from "@clusterio/controller";
import type { Application, Request, Response } from "express";

import fs from "fs-extra";
import path from "path";

import * as lib from "@clusterio/lib";
const { Counter, Gauge } = lib;

import * as routes from "./routes";

import {
	Item,
	ExportFromInstanceEvent
} from "./messages";

type InstanceInformation = {
	name: string,
	instanceId: number,
	status: string,
	port: number
}

export class ControllerPlugin extends BaseControllerPlugin {
	subscribedControlLinks!: Set<ControlConnection>;

	async init() {
		this.subscribedControlLinks = new Set();

		this.controller.handle(ExportFromInstanceEvent, this.handleExportFromInstanceEvent.bind(this));

		this.controller.app.get("/api/nauvis_trading_corporation/instances", (req: Request, res: Response) => {
			let servers: InstanceInformation[] = [];
			for (let instance of this.controller.instances.values()) {
				let name = instance.config.get("factorio.settings")["name"] as string
				let instanceId = instance.id
				let status = instance.status
				let port = instance.gamePort || 0
				servers.push({name, instanceId, status, port});
			}
			res.send(servers);
		});
		
		this.controller.app.get("/api/nauvis_trading_corporation/startInstance", (req: Request<{},{},{},{id:string}>, res: Response) => {
			try {
				this.controller.sendTo({instanceId: parseInt(req.query.id)}, new lib.InstanceStartRequest(undefined))
			} catch (error) {
				res.send(error);
			}
			res.send("Starting");
		});
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
