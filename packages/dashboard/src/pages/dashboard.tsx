import { Route, Routes, Navigate } from "react-router-dom";
import { UserProfile } from "../views/userProfile";
import { GuildList } from "../views/guildList";
import { GuildSettings } from "../views/guildSettings";
import { Leaderboard } from "../views/leaderboard";
import { Economy } from "../views/economy";
import { Integrations } from "../views/integrations";

export function DashboardPage() {
  return (
    <Routes>
      <Route path="/" element={<UserProfile />} />
      <Route path="/guilds" element={<GuildList />} />
      <Route path="/guilds/:guildId" element={<Navigate to="settings" replace />} />
      <Route path="/guilds/:guildId/settings" element={<GuildSettings />} />
      <Route path="/guilds/:guildId/leaderboard" element={<Leaderboard />} />
      <Route path="/guilds/:guildId/economy" element={<Economy />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
