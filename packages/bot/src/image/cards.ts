import { createCanvas, loadImage } from "@napi-rs/canvas";
import { uploadToCloudinary } from "./cloudinary.js";

export async function generateLevelUpCard(
  userId: string,
  level: number,
  totalXp: number,
): Promise<string> {
  const canvas = createCanvas(600, 320);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0b1120";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 70px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`LEVEL ${level}`, canvas.width / 2, 110);

  const barX = 120;
  const barY = 150;
  const barW = canvas.width - 240;
  const barH = 24;

  ctx.fillStyle = "#1e293b";
  ctx.roundRect(barX, barY, barW, barH, 12);
  ctx.fill();

  const progress = Math.min(1, totalXp / (level * 100 + 50));
  ctx.fillStyle = "#22d3ee";
  ctx.roundRect(barX, barY, barW * progress, barH, 12);
  ctx.fill();

  const avatar = await loadImage(
    `https://cdn.discordapp.com/avatars/${userId}/0.png`,
  ).catch(() => null);

  if (avatar) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 225, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const draw = avatar;
    const dx = canvas.width / 2 - draw.width / 2;
    const dy = 225 - draw.height / 2;
    ctx.drawImage(draw, dx, dy, draw.width, draw.height);
    ctx.restore();
  }

  ctx.fillStyle = "#94a3b8";
  ctx.font = "16px Inter, system-ui, sans-serif";
  ctx.fillText(`Total XP: ${totalXp.toLocaleString()}`, canvas.width / 2, 300);

  const buffer = canvas.toBuffer("image/png");
  return await uploadToCloudinary(buffer, `levelup-${userId}-${level}.png`);
}

export async function generateLeaderboardCard(
  guildId: string,
  entries: { userId: string; level: number; xp: number }[],
): Promise<string> {
  const canvas = createCanvas(600, 400 + entries.length * 30);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0b1120";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LEADERBOARD", canvas.width / 2, 80);

  entries.forEach((entry, index) => {
    const y = 130 + index * 30;
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
    ctx.fillStyle = index === 0 ? "#fbbf24" : index === 1 ? "#94a3b8" : index === 2 ? "#cd7f32" : "#94a3b8";
    ctx.font = "22px Inter, system-ui, sans-serif";
    ctx.fillText(`${medal}  #${index + 1}`, 40, y);

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Inter, system-ui, sans-serif";
    ctx.fillText(`Lv.${entry.level}  ${entry.xp.toLocaleString()} XP`, 200, y);
  });

  const buffer = canvas.toBuffer("image/png");
  return await uploadToCloudinary(buffer, `leaderboard-${guildId}.png`);
}

export async function generateEconomyCard(
  userId: string,
  cash: number,
  bank: number,
): Promise<string> {
  const canvas = createCanvas(600, 320);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0b1120";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#22d3ee";
  ctx.font = "bold 48px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("💰 WALLET", canvas.width / 2, 80);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Inter, system-ui, sans-serif";
  ctx.fillText(cash.toLocaleString(), canvas.width / 2, 150);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "20px Inter, system-ui, sans-serif";
  ctx.fillText(`Bank: ${bank.toLocaleString()}`, canvas.width / 2, 200);

  ctx.fillStyle = "#64748b";
  ctx.font = "16px Inter, system-ui, sans-serif";
  ctx.fillText(`Total: ${(cash + bank).toLocaleString()}`, canvas.width / 2, 240);

  const buffer = canvas.toBuffer("image/png");
  return await uploadToCloudinary(buffer, `economy-${userId}.png`);
}

export async function generateBlackjackCard(
  userId: string,
  playerTotal: number,
  dealerTotal: number,
  result: string,
  won: number,
): Promise<string> {
  const canvas = createCanvas(600, 420);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0b1120";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BLACKJACK", canvas.width / 2, 80);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "22px Inter, system-ui, sans-serif";
  ctx.fillText(`Your hand: ${playerTotal}  |  Dealer: ${dealerTotal}`, canvas.width / 2, 140);

  const resultColor = result.includes("win") ? "#22d3ee" : result.includes("bust") ? "#f87171" : "#94a3b8";
  ctx.fillStyle = resultColor;
  ctx.font = "bold 34px Inter, system-ui, sans-serif";
  ctx.fillText(result, canvas.width / 2, 210);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "20px Inter, system-ui, sans-serif";
  ctx.fillText(`Bet: 10  |  Payout: ${won}`, canvas.width / 2, 270);

  const buffer = canvas.toBuffer("image/png");
  return await uploadToCloudinary(buffer, `blackjack-${userId}-${Date.now()}.png`);
}
