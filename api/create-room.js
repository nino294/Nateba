export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { roomName } = req.body;
  const token = process.env.DAILY_API_KEY;

  const cleanName = (roomName || "room")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${cleanName}`, { method:"GET", headers });
    const getData = await getRes.json();
    if (getData.url) return res.status(200).json({ url: getData.url });

    const createRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: cleanName,
        properties: {
          enable_prejoin_ui: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
        },
      }),
    });
    const createData = await createRes.json();
    if (createData.url) return res.status(200).json({ url: createData.url });
    return res.status(500).json({ error: "Failed", details: createData });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
