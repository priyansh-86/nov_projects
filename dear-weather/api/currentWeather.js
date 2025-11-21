// Yeh Vercel Serverless Function hai
// Yeh file /api/currentWeather.js par hai

export default async function handler(request, response) {
    // FIX: Local testing ke liye apni OPENWEATHER API key yahan daalein.
    // Deployment ke liye isko wapas process.env.OPENWEATHER_API_KEY kar dein.
    const API_KEY = process.env.OPENWEATHER_API_KEY || "1c76c52d7815c15e10452972e43baeb8"; // <--- CHANGE THIS
    
    const { q, lat, lon, units } = request.query;
    
    let url;
    if (q) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${API_KEY}&units=${units || 'metric'}`;
    } else {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units || 'metric'}`;
    }

    try {
        const apiRes = await fetch(url);
        
        if (!apiRes.ok) {
            const errorData = await apiRes.json();
            return response.status(apiRes.status).json({ error: errorData.message || 'City not found' });
        }
        
        const data = await apiRes.json();
        response.status(200).json(data);
        
    } catch (error) {
        response.status(500).json({ error: 'Server error' });
    }
}