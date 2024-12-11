import { Type, Static } from "@sinclair/typebox";
import * as lib from "@clusterio/lib";
import { type } from "os";

export class Item {
	constructor(
		public name: string,
		public count: number
	) {
	}

	static jsonSchema = Type.Tuple([
		Type.String(),
		Type.Number(),
	]);

	toJSON() {
		return [this.name, this.count];
	}

	static fromJSON(json: Static<typeof Item.jsonSchema>): Item {
		return new this(json[0], json[1]);
	}
}


export class ExportFromInstanceEvent {
	declare ["constructor"]: typeof ExportFromInstanceEvent;
	static type = "event" as const;
	static src = "instance" as const;
	static dst = "controller" as const;
	static plugin = "nauvis_trading_corporation" as const;

	constructor(
		public items: Item[]
	) {
	}

	static jsonSchema = Type.Object({
		"items": Type.Array(Item.jsonSchema),
	});

	static fromJSON(json: Static<typeof ExportFromInstanceEvent.jsonSchema>): ExportFromInstanceEvent {
		return new this(json.items.map(item => Item.fromJSON(item)));
	}
}
