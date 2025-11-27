export default async function handler(req, res) {
  const { text } = req.query;
  const apiKey = process.env.GEO_API_KEY;

  if (!text) {
    return res.status(400).json({ message: "Text is required" });
  }

  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${text}&type=city&apiKey=${apiKey}`;

  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}