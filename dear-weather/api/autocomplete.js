// Yeh Vercel Serverless Function hai
// Yeh file /api/autocomplete.js par hai

export default async function handler(request, response) {
    // Naam: GEOAPIFY_API_KEY
    const API_KEY = process.env.GEOAPIFY_API_KEY;
    const { text } = request.query;

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${text}&type=city&apiKey=${API_KEY}`;

    try {
        const apiRes = await fetch(url);
        
        if (!apiRes.ok) {
            const errorData = await apiRes.json();
            return response.status(apiRes.status).json({ error: errorData.message || 'Autocomplete error' });
        }
        
        const data = await apiRes.json();
        response.status(200).json(data);
        
    } catch (error) {
        response.status(500).json({ error: 'Server error' });
    }
}