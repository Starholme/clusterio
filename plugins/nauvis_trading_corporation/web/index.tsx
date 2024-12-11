import React, { useContext, useEffect, useState } from "react";
import { Input, Table, Typography } from "antd";

import * as lib from "@clusterio/lib";
import {
	BaseWebPlugin, PageLayout, PageHeader, Control, ControlContext,
	notifyErrorHandler, useItemMetadata, useLocale,
} from "@clusterio/web_ui";
import { Item, ExportFromInstanceEvent } from "../messages";

import "./style.css";

const { Paragraph } = Typography;


function useStorage(control: Control) {
	let plugin = control.plugins.get("subspace_storage") as WebPlugin;
	let [storage, setStorage] = useState([...plugin.storage]);

	useEffect(() => {
		function update() {
			setStorage([...plugin.storage]);
		}

		plugin.onUpdate(update);
		return () => {
			plugin.offUpdate(update);
		};
	}, []);
	return storage;
}

function StoragePage() {
	return <PageLayout nav={[{ name: "NTC" }]}>
		<PageHeader title="NTC" />
		
	</PageLayout>;
}

export class WebPlugin extends BaseWebPlugin {
	storage = new Map<string, number>();
	callbacks: (() => void)[] = [];

	async init() {
		this.pages = [
			{
				path: "/ntc",
				sidebarName: "NTC",
				permission: "nauvis_trading_corporation.storage.view",
				content: <StoragePage/>,
			},
		];
	}

	onControllerConnectionEvent(event: "connect" | "drop" | "resume" | "close") {
		if (event === "connect") {

		}
	}

	onUpdate(callback: () => void) {
		this.callbacks.push(callback);
		if (this.callbacks.length) {

		}
	}

	offUpdate(callback: () => void) {
		let index = this.callbacks.lastIndexOf(callback);
		if (index === -1) {
			throw new Error("callback is not registered");
		}

		this.callbacks.splice(index, 1);
		if (!this.callbacks.length) {

		}
	}
}
