export type PlayerChoice = {
  playerId: string;
  playerName: string;
  championName: string;
  championImage: string;
};

export class Game {
  private _active: boolean;
  private _roundCount: number;
  private _playerCount: number;
  private _gameChosenChampions: Map<string, boolean> = new Map();
  private _playerChoices: PlayerChoice[] = [];
  private _roundProcessing: boolean = false;

  constructor() {
    this._roundCount = 0;
    this._playerCount = 0;
    this._active = false;
  }

  startGame(playerCount: number) {
    if (this._active) {
      throw new Error("A game is already in progress.");
    }

    if (playerCount < 2) {
      throw new Error("Please enter a valid number of players (at least 2).");
    }

    this._playerCount = playerCount;
    this._active = true;
    this._roundCount = 1;
    this._gameChosenChampions.clear();
    this._playerChoices = [];
  }

  finishGame() {
    this._active = false;
  }

  finisheRound() {
    for (const choice of this._playerChoices) {
      this._gameChosenChampions.set(choice.championName.toLowerCase(), true);
    }

    this._playerChoices = [];
    this._roundCount++;
  }

  checkChooseChampion(championName: string) {
    if (this._gameChosenChampions.has(championName.toLowerCase())) {
      throw new Error(`${championName.charAt(0).toUpperCase() + championName.slice(1)} has already been chosen in the game.`);
    }
  }

  chooseChampionInRound(playerId: string, playerName: string, championName: string, championImage: string) {
    const existingChoiceIndex = this._playerChoices.findIndex(choice => choice.playerId === playerId);

    if (existingChoiceIndex !== -1) {
      this._playerChoices[existingChoiceIndex] = {
        playerId,
        playerName,
        championName,
        championImage
      };

      return true
    } 

   
    this._playerChoices.push({
      playerId,
      playerName,
      championName,
      championImage
    });
    
    return false
  }

  allPlayersHaveChosenForRound(): boolean {
    return this._playerChoices.length === this._playerCount;
  }

  didPlayersWinRound(): boolean {
    const choices = this._playerChoices.map(choice => choice.championName.toLowerCase());
    return choices.every(champion => champion === choices[0]);
  }

  getPlayerChoices(): PlayerChoice[] {
    return [...this._playerChoices];
  }

  getChosenChampions() {
    return Array.from(this._gameChosenChampions.keys());
  }

  public isRoundProcessing(): boolean {
    return this._roundProcessing;
  }
  
  public setRoundProcessing(value: boolean): void {
    this._roundProcessing = value;
  }

  get active() {
    return this._active;
  }

  get roundCount() {
    return this._roundCount;
  }

  get playerCount() {
    return this._playerCount;
  }
}
