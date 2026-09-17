import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { replyV2 } from "../components.js";

const choices = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const answers = ["Absolutely.", "Most likely.", "Ask again after a snack.", "The signs point to no.", "I would not count on it."];
const facts = [
  "Octopuses have three hearts.",
  "A day on Venus is longer than its year.",
  "Honey can remain edible for thousands of years when sealed.",
];
const jokes = [
  "Why did the developer go broke? They used up all their cache.",
  "I would tell you a UDP joke, but you might not get it.",
  "A SQL query walks into a bar and asks two tables: can I join you?",
];
const words = ["discord", "galaxy", "typescript", "lighthouse", "treasure", "keyboard", "rainbow"];

const data = new SlashCommandBuilder()
  .setName("fun")
  .setDescription("Games, trivia, and random utilities")
  .addSubcommand((sub) => sub.setName("coinflip").setDescription("Flip a coin"))
  .addSubcommand((sub) => sub.setName("dice").setDescription("Roll a six-sided die"))
  .addSubcommand((sub) => sub.setName("roll").setDescription("Roll a die with an optional number of sides").addIntegerOption((o) => o.setName("sides").setDescription("Number of sides").setMinValue(2).setMaxValue(1000)))
  .addSubcommand((sub) => sub.setName("8ball").setDescription("Ask the magic 8-ball").addStringOption((o) => o.setName("question").setDescription("Your question").setMaxLength(500).setRequired(true)))
  .addSubcommand((sub) => sub.setName("choose").setDescription("Choose between comma-separated options").addStringOption((o) => o.setName("options").setDescription("Example: red, blue, green").setMaxLength(1000).setRequired(true)))
  .addSubcommand((sub) => sub.setName("rps").setDescription("Play rock paper scissors").addStringOption((o) => o.setName("choice").setDescription("Your move").setRequired(true).addChoices({ name: "Rock", value: "rock" }, { name: "Paper", value: "paper" }, { name: "Scissors", value: "scissors" })))
  .addSubcommand((sub) => sub.setName("slots").setDescription("Spin the slot machine"))
  .addSubcommand((sub) => sub.setName("roulette").setDescription("Spin a red/black roulette wheel").addStringOption((o) => o.setName("bet").setDescription("Your color bet").setRequired(true).addChoices({ name: "Red", value: "red" }, { name: "Black", value: "black" })))
  .addSubcommand((sub) => sub.setName("higherlower").setDescription("Guess whether the next number is higher or lower").addStringOption((o) => o.setName("guess").setDescription("Your prediction").setRequired(true).addChoices({ name: "Higher", value: "higher" }, { name: "Lower", value: "lower" })))
  .addSubcommand((sub) => sub.setName("guess").setDescription("Guess a number from 1 to 10").addIntegerOption((o) => o.setName("number").setDescription("Your guess").setMinValue(1).setMaxValue(10).setRequired(true)))
  .addSubcommand((sub) => sub.setName("trivia").setDescription("Get a live trivia question"))
  .addSubcommand((sub) => sub.setName("hangman").setDescription("Start a hangman challenge"))
  .addSubcommand((sub) => sub.setName("scramble").setDescription("Solve a scrambled word"))
  .addSubcommand((sub) => sub.setName("typerace").setDescription("Get a typing race phrase"))
  .addSubcommand((sub) => sub.setName("minesweeper").setDescription("Generate a Minesweeper board"))
  .addSubcommand((sub) => sub.setName("connect4").setDescription("Start a Connect Four board"))
  .addSubcommand((sub) => sub.setName("tictactoe").setDescription("Start a Tic-Tac-Toe board"))
  .addSubcommand((sub) => sub.setName("memory").setDescription("Get a memory challenge"))
  .addSubcommand((sub) => sub.setName("quiz").setDescription("Get a quick knowledge quiz"))
  .addSubcommand((sub) => sub.setName("wouldyourather").setDescription("Get a Would You Rather prompt"))
  .addSubcommand((sub) => sub.setName("neverhavei").setDescription("Get a Never Have I Ever prompt"))
  .addSubcommand((sub) => sub.setName("truthordare").setDescription("Get a truth or dare prompt"))
  .addSubcommand((sub) => sub.setName("joke").setDescription("Tell a programming joke"))
  .addSubcommand((sub) => sub.setName("fact").setDescription("Share a fact"))
  .addSubcommand((sub) => sub.setName("fortune").setDescription("Get a fortune"))
  .addSubcommand((sub) => sub.setName("blackjack-help").setDescription("Explain the blackjack command"));

function board(width: number, height: number, value: string) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => value).join(" ")).join("\n");
}

async function trivia() {
  const response = await fetch("https://opentdb.com/api.php?amount=1&type=multiple", { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Trivia provider is unavailable.");
  const payload = await response.json() as { results?: Array<{ question: string; correct_answer: string; incorrect_answers: string[] }> };
  const item = payload.results?.[0];
  if (!item) throw new Error("No trivia question was returned.");
  const decode = (text: string) => text.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");
  return { question: decode(item.question), answer: decode(item.correct_answer), options: [...item.incorrect_answers, item.correct_answer].sort(() => Math.random() - 0.5).map(decode) };
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    const game = interaction.options.getSubcommand();
    try {
      if (game === "coinflip") return replyV2(interaction, { title: "Coin flip", body: `The coin landed on **${choices(["Heads", "Tails"])}**.` });
      if (game === "dice" || game === "roll") {
        const sides = game === "dice" ? 6 : interaction.options.getInteger("sides") ?? 6;
        return replyV2(interaction, { title: "Dice roll", body: `You rolled **${Math.floor(Math.random() * sides) + 1}** on a d${sides}.` });
      }
      if (game === "8ball") return replyV2(interaction, { title: "Magic 8-ball", body: `**Question:** ${interaction.options.getString("question", true)}\n**Answer:** ${choices(answers)}` });
      if (game === "choose") {
        const options = interaction.options.getString("options", true).split(",").map((item) => item.trim()).filter(Boolean);
        if (options.length < 2) throw new Error("Provide at least two comma-separated options.");
        return replyV2(interaction, { title: "Choice made", body: `I choose **${choices(options)}** from ${options.length} options.` });
      }
      if (game === "rps") {
        const user = interaction.options.getString("choice", true);
        const bot = choices(["rock", "paper", "scissors"]);
        const win = (user === "rock" && bot === "scissors") || (user === "paper" && bot === "rock") || (user === "scissors" && bot === "paper");
        return replyV2(interaction, { title: "Rock paper scissors", body: `You chose **${user}**. I chose **${bot}**.\n\n**${user === bot ? "Draw" : win ? "You win" : "I win"}!**` });
      }
      if (game === "slots") {
        const reels = ["🍒", "🍋", "🔔", "⭐", "💎"].map(() => choices(["🍒", "🍋", "🔔", "⭐", "💎"]));
        return replyV2(interaction, { title: "Slots", body: `${reels.join("  ")}\n\n**${new Set(reels).size === 1 ? "Jackpot!" : reels[0] === reels[1] || reels[1] === reels[2] ? "Two matching reels!" : "No match — try again."}**` });
      }
      if (game === "roulette") {
        const result = choices(["red", "black"]);
        const bet = interaction.options.getString("bet", true);
        return replyV2(interaction, { title: "Roulette", body: `The wheel landed on **${result}**.\nYour **${bet}** bet ${bet === result ? "won" : "lost"}.` });
      }
      if (game === "higherlower") {
        const first = Math.floor(Math.random() * 100) + 1;
        const next = Math.floor(Math.random() * 100) + 1;
        const guess = interaction.options.getString("guess", true);
        const actual = next > first ? "higher" : next < first ? "lower" : "same";
        return replyV2(interaction, { title: "Higher or lower", body: `Starting number: **${first}**\nNext number: **${next}**\nYou guessed **${guess}** — ${actual === "same" ? "the numbers tied" : guess === actual ? "correct" : "incorrect"}.` });
      }
      if (game === "guess") {
        const target = Math.floor(Math.random() * 10) + 1;
        const guess = interaction.options.getInteger("number", true);
        return replyV2(interaction, { title: "Number guess", body: `The number was **${target}**. Your guess was **${guess}** — **${target === guess ? "correct" : "not this time"}**.` });
      }
      if (game === "trivia") {
        const question = await trivia();
        return replyV2(interaction, { title: "Live trivia", body: `**${question.question}**\n\n${question.options.map((option, index) => `${index + 1}. ${option}`).join("\n")}\n\n||Answer: ${question.answer}||` });
      }
      if (game === "hangman") {
        const word = choices(words);
        return replyV2(interaction, { title: "Hangman", body: `Guess the word:\n\`${"_ ".repeat(word.length).trim()}\`\n\nIt has **${word.length}** letters. Start guessing in chat.` });
      }
      if (game === "scramble") {
        const word = choices(words);
        return replyV2(interaction, { title: "Word scramble", body: `Unscramble **${word.split("").sort(() => Math.random() - 0.5).join("")}**.` });
      }
      if (game === "typerace") return replyV2(interaction, { title: "Type race", body: `Type this exactly:\n\`${choices(["Aeris makes every server brighter.", "Fast fingers beat slow packets.", "Components make Discord messages modular."])}\`` });
      if (game === "minesweeper") return replyV2(interaction, { title: "Minesweeper", body: board(8, 5, "·") + "\n\nUse coordinates like **A1** to mark a square." });
      if (game === "connect4") return replyV2(interaction, { title: "Connect Four", body: board(7, 6, "⚪") + "\n\nColumns: **1 2 3 4 5 6 7**" });
      if (game === "tictactoe") return replyV2(interaction, { title: "Tic-Tac-Toe", body: "⬜ ⬜ ⬜\n⬜ ⬜ ⬜\n⬜ ⬜ ⬜\n\nChoose a square from 1–9 to begin." });
      if (game === "memory") return replyV2(interaction, { title: "Memory challenge", body: `Remember this sequence for 10 seconds: **${Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join(" ")}**` });
      if (game === "quiz") return replyV2(interaction, { title: "Quick quiz", body: "Which protocol does Discord use for its real-time gateway?\n\n**A. HTTP** · **B. WebSocket** · **C. FTP**\n\nAnswer: ||WebSocket||" });
      if (game === "wouldyourather") return replyV2(interaction, { title: "Would you rather?", body: choices(["Have unlimited snacks or unlimited sleep?", "Explore space or the deep ocean?", "Always be early or never wait in line?"]) });
      if (game === "neverhavei") return replyV2(interaction, { title: "Never Have I Ever", body: `Never have I ever **${choices(["sent a message to the wrong channel", "stayed up all night gaming", "forgotten why I opened a tab"])}**.` });
      if (game === "truthordare") return replyV2(interaction, { title: "Truth or dare", body: `${choices(["Truth", "Dare"])}: ${choices(["What is a skill you want to learn?", "Send a message using only emojis.", "Describe your day as a movie title."])}` });
      if (game === "joke") return replyV2(interaction, { title: "Joke", body: choices(jokes) });
      if (game === "fact") return replyV2(interaction, { title: "Fact", body: choices(facts) });
      if (game === "fortune") return replyV2(interaction, { title: "Fortune", body: choices(["A small decision will open a big door.", "Your persistence is about to pay off.", "A useful connection is closer than you think."]) });
      if (game === "blackjack-help") return replyV2(interaction, { title: "Blackjack", body: "Use `/blackjack bet:<amount>` to play a complete economy-backed round. Bets require at least 10 coins." });
      throw new Error(`Unknown fun game: ${game}`);
    } catch (error) {
      await replyV2(interaction, { title: "Fun command failed", body: error instanceof Error ? error.message : "The game could not start.", ephemeral: true });
    }
  },
};
