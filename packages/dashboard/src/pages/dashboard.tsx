import { Route, Routes } from "react-router-dom";
import { Overview } from "../views/overview";
import { GuildSettings } from "../views/guildSettings";
import { Leaderboard } from "../views/leaderboard";
import { Economy } from "../views/economy";

export function DashboardPage() {
  return (
    <Routes>
      <Route path="/" element={<Overview />} />
      <Route path="settings" element={<GuildSettings />} />
      <Route path="leaderboard" element={<Leaderboard />} />
      <Route path="economy" element={<Economy />} />
      <Route path="*" element={<Overview />} />
    </Routes>
  );
}
