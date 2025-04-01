import {
	Client,
	GatewayIntentBits,
	type GuildMember,
	type Interaction,
	REST,
	Routes,
} from "discord.js";
import { Champion } from "../domain/champions.js";
import { Game } from "../domain/game.js";

export class Bot {
	private _client: Client;
	private _games: Map<string, Game>;
	private _championsData: Champion[];

	constructor() {
		this._client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
			],
		});
		this._games = new Map();
		this._championsData = [];

		this._client.login(process.env.DISCORD_TOKEN as string);
	}

	private getGame(channelId: string): Game {
		if (!this._games.has(channelId)) {
			this._games.set(channelId, new Game());
		}
		return this._games.get(channelId) as Game;
	}

	async start() {
		this._client.on("ready", async () => {
			console.log(`Logged in as ${this._client.user?.tag}!`);
			this._championsData = Champion.loadAll();
			await this.registerCommands();
		});

		this._client.on("interactionCreate", this.handleInteraction.bind(this));
	}

	async registerCommands() {
		const rest = new REST({ version: "10" }).setToken(
			process.env.DISCORD_TOKEN as string,
		);

		const commands = [
			{
				name: "telepathy",
				description:
					"Start a telepathy game with a specified number of players",
				options: [
					{
						name: "players",
						description: "Number of players",
						type: 4,
						required: true,
					},
				],
			},
			{
				name: "show_chosen",
				description: "Show champions chosen so far",
			},
			{
				name: "champion",
				description: "Choose a League of Legends champion",
				options: [
					{
						name: "champion_name",
						description: "Type the name of the champion",
						type: 3,
						required: true,
						autocomplete: true,
					},
				],
			},
			{
				name: "surrender",
				description: "End the current game",
			},
		];

		try {
			await rest.put(
				Routes.applicationCommands(process.env.DISCORD_BOT_ID as string),
				{ body: commands },
			);
			await rest.put(
				Routes.applicationCommands(process.env.DISCORD_BOT_ID as string),
				{ body: commands },
			);
		} catch (error) {
			console.error(error);
		}
	}

	async handleInteraction(interaction: Interaction) {
		if (interaction.isChatInputCommand()) {
			const channelId = interaction.channelId;
			const game = this.getGame(channelId);

			if (interaction.commandName === "telepathy") {
				const playerCount = interaction.options.getInteger("players");

				try {
					game.startGame(playerCount as number);
					await interaction.reply(
						`Starting a telepathy game with **${playerCount}** players!`,
					);
				} catch (error) {
					await interaction.reply(
						error instanceof Error
							? error.message
							: "An unknown error occurred.",
					);
				}
			}

			if (interaction.commandName === "show_chosen") {
				if (!game.active) {
					await interaction.reply(
						"The game has not started. Use /telepathy <number_of_players> to start the game.",
					);
					return;
				}

				const chosenChampions = game.getChosenChampions();
				if (chosenChampions.length > 0) {
					await interaction.reply(
						`Champions chosen so far: ${chosenChampions.join(", ")}`,
					);
				} else {
					await interaction.reply("No champions have been chosen yet.");
				}
			}

			if (interaction.commandName === "surrender") {
				if (!game.active) {
					await interaction.reply("There is no active game to surrender.");
					return;
				}

				game.finishGame();
				await interaction.reply(
					"Game has been surrendered. Use /telepathy to start a new game.",
				);
			}

			if (interaction.commandName === "champion") {
				if (!game.active) {
					await interaction.reply(
						"The game has not started. Use /telepathy <number_of_players> to start the game.",
					);
					return;
				}

				const championName =
					interaction.options.getString("champion_name")?.toLowerCase() || "";
				const champion = this._championsData.find(
					(champ) => champ.name.toLowerCase() === championName,
				);

				if (!champion) {
					await interaction.reply({
						content: "Champion not found.",
						ephemeral: true,
					});
					return;
				}

				try {
					const playerId = interaction.user.id;
					const playerName =
						(interaction.member as GuildMember).displayName ||
						interaction.user.username;
					const championImage = champion.imageUrl;

					game.checkChooseChampion(championName);
					const choice = game.chooseChampionInRound(
						playerId,
						playerName,
						championName,
						championImage,
					);

					if (choice) {
						await interaction.reply({
							content: `You have changed your choice to **${champion.name}**.`,
							files: [champion.imageUrl],
							ephemeral: true,
						});
					} else {
						await interaction.reply({
							content: `Your chose **${champion.name}**`,
							files: [champion.imageUrl],
							ephemeral: true,
						});
					}

					if (game.allPlayersHaveChosenForRound()) {
						if (game.isRoundProcessing()) {
							return;
						}

						game.setRoundProcessing(true);

						const playerChoices = game.getPlayerChoices();

						const embeds = playerChoices.map((choice) => ({
							title: `${choice.playerName} chose ${choice.championName.charAt(0).toUpperCase() + choice.championName.slice(1)}`,
							image: { url: choice.championImage },
						}));

						if (game.didPlayersWinRound()) {
							const channel = interaction.channel;
							if (channel && "send" in channel) {
								await channel.send({
									content: `🎉 **VICTORY!** 🎉\nAll players chose **${champion.name}**! You win round ${game.roundCount}! 🏆`,
									files: [champion.imageUrl],
								});
								await channel.send({
									files: [
										"https://media.tenor.com/17pFKrJQR4AAAAAM/default-dance-fortnite.gif",
									],
								});
							}
							game.finishGame();
						} else {
							const channel = interaction.channel;
							if (channel && "send" in channel) {
								await channel.send({
									content: `Players picked different champions. You lost the round. ${game.roundCount}.`,
									embeds,
								});
								await channel.send({
									files: [
										"https://www.imagensanimadas.com/data/media/562/linha-imagem-animada-0124.gif",
									],
								});
								await channel.send({
									content: `**Round ${game.roundCount + 1} started! chose your champion**`,
								});
							}
							game.finisheRound();
						}
						game.setRoundProcessing(false);
					}
				} catch (error) {
					await interaction.reply(
						error instanceof Error
							? error.message
							: "An unknown error occurred.",
					);
				}
			}

			return;
		}

		if (interaction.isAutocomplete()) {
			const channelId = interaction.channelId;
			const game = this.getGame(channelId);
			const focusedOption = interaction.options.getFocused();
			const chosenChampions = game
				.getChosenChampions()
				.map((champ) => champ.toLowerCase());
			const filteredChampions = this._championsData
				.filter(
					(champ) =>
						champ.name.toLowerCase().startsWith(focusedOption.toLowerCase()) &&
						!chosenChampions.includes(champ.name.toLowerCase()),
				)
				.slice(0, 25);

			await interaction.respond(
				filteredChampions.map((champ) => ({
					name: champ.name,
					value: champ.name,
				})),
			);
		}
	}
}
