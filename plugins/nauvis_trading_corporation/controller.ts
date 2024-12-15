import { BaseControllerPlugin, type ControlConnection } from "@clusterio/controller";
import express, { type Request, type Response } from "express";

import fs from "fs-extra";
import path from "path";

import * as lib from "@clusterio/lib";
const { Counter, Gauge } = lib;

import * as routes from "./routes";

import {
	Item,
	ExportFromInstanceEvent,
	ImportRequestFromInstanceEvent,
	SetActualImportFromInstanceEvent
} from "./messages";

type InstanceInformation = {
	name: string,
	instanceId: number,
	status: string,
	port: number
}

type InstanceItems = {
	instanceId: number,
	items: Item[]
}

let _itemsForExport:InstanceItems[] = [];
let _itemsForImport:InstanceItems[] = [];

export class ControllerPlugin extends BaseControllerPlugin {
	subscribedControlLinks!: Set<ControlConnection>;

	async init() {
		this.subscribedControlLinks = new Set();

		this.controller.handle(ExportFromInstanceEvent, this.handleExportFromInstanceEvent.bind(this));
		this.controller.handle(ImportRequestFromInstanceEvent, this.handleImportRequestFromInstanceEvent.bind(this));

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
			//TODO: Check the status before trying to start.
			try {
				this.controller.sendTo({instanceId: parseInt(req.query.id)}, new lib.InstanceStartRequest(undefined))
			} catch (error) {
				res.send(error);
			}
			res.send("Starting");
		});

		this.controller.app.get("/api/nauvis_trading_corporation/getExportsFromInstances", (req: Request, res: Response)=>{
			let poppedItems:InstanceItems[] = [];

			let pop = _itemsForExport.pop();
			while(pop !== undefined){
				poppedItems.push(pop);
				pop = _itemsForExport.pop();
			}

			res.send(poppedItems);
		});

		this.controller.app.get("/api/nauvis_trading_corporation/getImportRequestsFromInstances", (req: Request, res: Response)=>{
			let poppedItems:InstanceItems[] = [];

			let pop = _itemsForImport.pop();
			while(pop !== undefined){
				poppedItems.push(pop);
				pop = _itemsForImport.pop();
			}

			res.send(poppedItems);
		});

		this.controller.app.post(
			"/api/nauvis_trading_corporation/setActualImportsForInstances",
			express.json(),
			(req: Request, res: Response, next: any) => {
				this.handleSetActualImportsForInstances(req, res).catch(next);
			}
		);
	}
	
	async handleSetActualImportsForInstances(req: Request, res: Response){
		let body = req.body;
		for (const instanceId in body){
			const value = body[instanceId]
			let itemList : Item[] = [];
			for (const name in value.items){
				const count = value.items[name];
				this.logger.verbose(`test ${instanceId} ${name} ${count}`);
				itemList.push(new Item(name, count))
			}
			
			this.logger.verbose(
				`Firing handleSetActualImportsForInstances`
			);

			let setEvent = new SetActualImportFromInstanceEvent(itemList);
			this.controller.sendTo({instanceId: parseInt(instanceId)}, setEvent)

			this.logger.verbose(
				`Done handleSetActualImportsForInstances`
			);

		}
		res.send("Ok");
	}

	async handleExportFromInstanceEvent(request: ExportFromInstanceEvent, src: lib.Address){
		let instanceId = src.id;

		if (this.controller.config.get("nauvis_trading_corporation.log_item_transfers")) {
			this.logger.verbose(
				`Imported the following from ${instanceId}:\n${JSON.stringify(request.items)}`
			);
		}

		_itemsForExport.push({instanceId, items: request.items})
	}

	async handleImportRequestFromInstanceEvent(request: ImportRequestFromInstanceEvent, src: lib.Address){
		let instanceId = src.id;

		if (this.controller.config.get("nauvis_trading_corporation.log_item_transfers")) {
			this.logger.verbose(
				`Imported request from ${instanceId}:\n${JSON.stringify(request.items)}`
			);
		}

		_itemsForImport.push({instanceId, items: request.items})
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
