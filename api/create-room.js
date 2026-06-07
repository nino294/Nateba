export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { roomName } = req.body;
  const token = process.env.DAILY_API_KEY;

  // Daily.co requires room names under 35 chars, only letters/numbers/hyphens
  const cleanName = (roomName || "room")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 35);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  try {
    // First try to get existing room
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${cleanName}`, {
      method: "GET",
      headers,
    });
    const getData = await getRes.json();
    if (getData.url) {
      return res.status(200).json({ url: getData.url });
    }
    // Room doesn't exist, create it
    const createRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: cleanName,
        properties: {
          enable_prejoin_ui: false,
          enable_knocking: false,
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
        },
      }),
    });
    const createData = await createRes.json();
    if (createData.url) {
      return res.status(200).json({ url: createData.url });
    }
    return res.status(500).json({ error: "Failed to create room", details: createData });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
