import axios from "axios";

export class Champion {
  private _name: string;
  private _imageUrl: string;

  constructor(name: string, imageUrl: string) {
    this._name = name;
    this._imageUrl = imageUrl;
  }

  static async loadAll() {
    const { data } = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${process.env.LOL_PATH}/data/pt_BR/champion.json`);
    return Object.values(data.data).map((champ: any) => new Champion(
      champ.name,
      `https://ddragon.leagueoflegends.com/cdn/${process.env.LOL_PATH}/img/champion/${champ.image.full}`
    ));
  }

	get name() {
    return this._name;
  }

	get imageUrl() {
    return this._imageUrl;
  }
}
