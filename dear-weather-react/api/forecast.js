export default async function handler(req, res) {
  const { q, lat, lon, units } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  let url = "";
  if (q) {
    url = `https://api.openweathermap.org/data/2.5/forecast?q=${q}&units=${units}&appid=${apiKey}`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
  }

  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ message: data.message });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}