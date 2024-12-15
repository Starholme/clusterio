import * as lib from "@clusterio/lib";
import * as messages from "./messages";

declare module "@clusterio/lib" {
	export interface ControllerConfigFields {
		"nauvis_trading_corporation.log_item_transfers": boolean;
	}
	export interface InstanceConfigFields {
		"nauvis_trading_corporation.log_item_transfers": boolean;
	}
}

lib.definePermission({
	name: "nauvis_trading_corporation.storage.view",
	title: "View Vaults",
	description: "View the items stored in the vaults.",
	grantByDefault: true,
});

export const plugin: lib.PluginDeclaration = {
	name: "nauvis_trading_corporation",
	title: "Nauvis Trading Corporation",
	description: "Provides vault storage across instances for the Nauvis Trading Corporation mod",
	instanceEntrypoint: "dist/node/instance",
	instanceConfigFields: {
		"nauvis_trading_corporation.log_item_transfers": {
			title: "Log Item Transfers",
			description: "Spam host console with item transfers done.",
			type: "boolean",
			initialValue: false,
		},
	},

	controllerEntrypoint: "dist/node/controller",
	controllerConfigFields: {
		"nauvis_trading_corporation.log_item_transfers": {
			title: "Log Item Transfers",
			description: "Spam controller console with item transfers done.",
			type: "boolean",
			initialValue: false,
		},
	},

	messages: [
		messages.ExportFromInstanceEvent,
		messages.ImportRequestFromInstanceEvent,
		messages.SetActualImportFromInstanceEvent
	],
	webEntrypoint: "./web",
	routes: ["/ntc"],
};
