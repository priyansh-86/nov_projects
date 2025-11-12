// Yeh Vercel Serverless Function hai
// Yeh file /api/forecast.js par hai

export default async function handler(request, response) {
    // Naam: OPENWEATHER_API_KEY
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    const { q, lat, lon, units } = request.query;
    
    let url;
    if (q) {
        url = `https://api.openweathermap.org/data/2.5/forecast?q=${q}&appid=${API_KEY}&units=${units || 'metric'}`;
    } else {
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units || 'metric'}`;
    }

    try {
        const apiRes = await fetch(url);
        
        if (!apiRes.ok) {
            const errorData = await apiRes.json();
            return response.status(apiRes.status).json({ error: errorData.message || 'Forecast not found' });
        }
        
        const data = await apiRes.json();
        response.status(200).json(data);
        
    } catch (error) {
        response.status(500).json({ error: 'Server error' });
    }
}