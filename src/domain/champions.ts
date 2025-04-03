import championsData from "./champions.json" with { type: "json" };

interface ChampionData {
	name: string;
	imageUrl: string;
}

export class Champion {
	private _name: string;
	private _imageUrl: string;

	constructor(name: string, imageUrl: string) {
		this._name = name;
		this._imageUrl = imageUrl;
	}

	static loadAll(): Champion[] {
		return championsData.champions.map(
			(champion: ChampionData) =>
				new Champion(champion.name, champion.imageUrl),
		);
	}

	get name() {
		return this._name;
	}

	get imageUrl() {
		return this._imageUrl;
	}
}
