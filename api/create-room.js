export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { roomName } = req.body;
  try {
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
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
    const data = await response.json();
    if (data.url) {
      res.status(200).json({ url: data.url });
    } else {
      res.status(500).json({ error: "Failed to create room", details: data });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
