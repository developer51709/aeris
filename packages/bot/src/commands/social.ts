import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { replyV2 } from "../components.js";

const names = ["hug", "pat", "kiss", "slap", "highfive", "poke", "wave", "dance", "cheer", "ship", "match", "rate", "8ball", "coinflip", "roll", "choose", "fortune", "meme", "joke", "fact", "quote", "ascii", "color", "avatar", "banner"] as const;
const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const reactions: Record<string, string> = { hug: "gave a warm hug 🤗", pat: "gave a friendly pat 🫳", kiss: "sent a kiss 💋", slap: "threw a playful slap 👋", highfive: "shared a high five 🙌", poke: "gave a gentle poke 👉", wave: "waved hello 👋", dance: "started dancing 💃", cheer: "is cheering 🎉" };
const jokes = ["Why did the developer go broke? They used up all their cache.", "I would tell you a UDP joke, but you might not get it.", "A SQL query walks into a bar and asks two tables: can I join you?"];
const facts = ["Discord snowflakes contain a timestamp.", "Octopuses have three hearts.", "Bananas are berries, but strawberries are not botanical berries."];

const data = new SlashCommandBuilder().setName("social").setDescription("Social interactions and utilities");
for (const name of names) {
  data.addSubcommand((sub) => {
    sub.setName(name).setDescription(`${name.replace(/-/g, " ")} social command`);
    if (["hug", "pat", "kiss", "slap", "highfive", "poke", "wave", "dance", "cheer", "ship", "match", "rate"].includes(name)) sub.addUserOption((o) => o.setName("user").setDescription("User").setRequired(true));
    if (name === "8ball") sub.addStringOption((o) => o.setName("question").setDescription("Question").setMaxLength(500).setRequired(true));
    if (name === "roll") sub.addIntegerOption((o) => o.setName("sides").setDescription("Number of sides").setMinValue(2).setMaxValue(1000));
    if (name === "choose") sub.addStringOption((o) => o.setName("options").setDescription("Comma-separated options").setMaxLength(1000).setRequired(true));
    if (["avatar", "banner"].includes(name)) sub.addUserOption((o) => o.setName("user").setDescription("User").setRequired(false));
    return sub;
  });
}

export default {
  data,
  async execute(interaction: ChatInputCommandInteraction) {
    const command = interaction.options.getSubcommand();
    try {
      if (reactions[command]) {
        const user = interaction.options.getUser("user", true);
        return replyV2(interaction, { title: command, body: `${interaction.user} ${reactions[command]} ${user}.` });
      }
      if (["ship", "match"].includes(command)) {
        const user = interaction.options.getUser("user", true);
        const score = Math.floor(Math.random() * 101);
        return replyV2(interaction, { title: command === "ship" ? "Ship meter" : "Match meter", body: `${interaction.user} + ${user}\n\n**${score}%** compatibility.` });
      }
      if (command === "rate") {
        const user = interaction.options.getUser("user", true);
        return replyV2(interaction, { title: "Rate meter", body: `${user} gets **${Math.floor(Math.random() * 11)}/10**.` });
      }
      if (command === "8ball") return replyV2(interaction, { title: "Magic 8-ball", body: `**${interaction.options.getString("question", true)}**\n\n${pick(["Absolutely.", "Most likely.", "Ask again later.", "The signs point to no."])}` });
      if (command === "coinflip") return replyV2(interaction, { title: "Coin flip", body: `The coin landed on **${pick(["Heads", "Tails"])}**.` });
      if (command === "roll") {
        const sides = interaction.options.getInteger("sides") ?? 6;
        return replyV2(interaction, { title: "Dice roll", body: `You rolled **${Math.floor(Math.random() * sides) + 1}** on a d${sides}.` });
      }
      if (command === "choose") {
        const options = interaction.options.getString("options", true).split(",").map((item) => item.trim()).filter(Boolean);
        if (options.length < 2) throw new Error("Provide at least two comma-separated options.");
        return replyV2(interaction, { title: "Choice", body: `I choose **${pick(options)}**.` });
      }
      if (command === "fortune") return replyV2(interaction, { title: "Fortune", body: pick(["A useful connection is closer than you think.", "Your persistence is about to pay off.", "A small decision will open a big door."]) });
      if (command === "meme") return replyV2(interaction, { title: "Meme prompt", body: pick(["When the bot passes typecheck on the first try: deploy it immediately.", "Me: I will just make one small change. The codebase: 27 new files later…", "Production is just development with an audience."]) });
      if (command === "joke") return replyV2(interaction, { title: "Joke", body: pick(jokes) });
      if (command === "fact") return replyV2(interaction, { title: "Fact", body: pick(facts) });
      if (command === "quote") return replyV2(interaction, { title: "Quote", body: `“${pick(["The best way out is always through.", "Great things are done by a series of small things brought together.", "Make it work, make it right, make it fast."])}”` });
      if (command === "ascii") return replyV2(interaction, { title: "ASCII art", body: "```text\n /\\_/\\\n( o.o )\n > ^ <\n```" });
      if (command === "color") {
        const hex = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
        return replyV2(interaction, { title: "Random color", body: `**${hex}**`, imageUrls: [`https://singlecolorimage.com/get/${hex.slice(1)}/640x240`] });
      }
      if (["avatar", "banner"].includes(command)) {
        const user = interaction.options.getUser("user") ?? interaction.user;
        const url = command === "avatar" ? user.displayAvatarURL({ size: 1024 }) : user.bannerURL({ size: 1024 });
        return replyV2(interaction, { title: `${user.username}'s ${command}`, body: url ? `Current ${command} for **${user.username}**.` : `${user.username} does not have a profile banner.`, imageUrls: url ? [url] : undefined });
      }
      throw new Error(`Unknown social operation: ${command}`);
    } catch (error) {
      await replyV2(interaction, { title: "Social command failed", body: error instanceof Error ? error.message : "The social command could not be completed.", ephemeral: true });
    }
  },
};
