export interface LavalinkNode {
  name: string;
  url: string;
  password: string;
}

interface LoadedTrack {
  info?: {
    title?: string;
    uri?: string;
    identifier?: string;
    length?: number;
  };
}

function configuredNodes(): LavalinkNode[] {
  const raw = process.env.LAVALINK_NODES;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Array<Partial<LavalinkNode>>;
      return parsed
        .filter((node) => node.url)
        .map((node, index) => ({
          name: node.name ?? `node-${index + 1}`,
          url: node.url!.replace(/\/$/, ""),
          password: node.password ?? process.env.LAVALINK_PASSWORD ?? "youshallnotpass",
        }));
    } catch {
      console.error("LAVALINK_NODES must be a JSON array; falling back to individual node variables");
    }
  }

  const nodes: LavalinkNode[] = [];
  const urls = process.env.LAVALINK_NODE_URLS
    ?.split(",")
    .map((url) => url.trim())
    .filter(Boolean) ?? [];
  for (const [index, url] of urls.entries()) {
    nodes.push({
      name: `node-${index + 1}`,
      url: url.replace(/\/$/, ""),
      password: process.env[`LAVALINK_NODE_${index + 1}_PASSWORD`] ?? process.env.LAVALINK_PASSWORD ?? "youshallnotpass",
    });
  }
  for (let index = 1; index <= 10; index += 1) {
    const url = process.env[`LAVALINK_NODE_${index}_URL`];
    if (!url || urls.includes(url)) continue;
    nodes.push({
      name: process.env[`LAVALINK_NODE_${index}_NAME`] ?? `node-${index}`,
      url: url.replace(/\/$/, ""),
      password: process.env[`LAVALINK_NODE_${index}_PASSWORD`] ?? process.env.LAVALINK_PASSWORD ?? "youshallnotpass",
    });
  }
  return nodes;
}

export async function loadTrack(identifier: string) {
  const nodes = configuredNodes();
  if (nodes.length === 0) {
    throw new Error("No Lavalink nodes configured. Set LAVALINK_NODES or LAVALINK_NODE_1_URL.");
  }

  let lastError: unknown;
  for (const node of nodes) {
    try {
      const response = await fetch(
        `${node.url}/v4/loadtracks?identifier=${encodeURIComponent(identifier)}`,
        {
          headers: { Authorization: node.password },
          signal: AbortSignal.timeout(8_000),
        },
      );
      if (!response.ok) throw new Error(`${node.name} returned HTTP ${response.status}`);
      const payload = (await response.json()) as { loadType?: string; data?: LoadedTrack | LoadedTrack[] };
      const tracks = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
      const track = tracks[0];
      if (!track?.info?.title) throw new Error(`${node.name} returned no playable tracks`);
      return { node: node.name, track };
    } catch (error) {
      lastError = error;
      console.error(`Lavalink node ${node.name} failed; trying the next node`);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All Lavalink nodes failed");
}
