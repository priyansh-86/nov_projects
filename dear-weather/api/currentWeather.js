// Yeh Vercel Serverless Function hai
// Yeh file /api/currentWeather.js par hai

export default async function handler(request, response) {
    // Environment variable se API key padho
    // Naam: OPENWEATHER_API_KEY
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    
    // Frontend se query parameters (city, lat, lon) lo
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
            // Agar OpenWeatherMap se error aaye, toh woh error frontend ko bhej do
            const errorData = await apiRes.json();
            return response.status(apiRes.status).json({ error: errorData.message || 'City not found' });
        }
        
        const data = await apiRes.json();
        // Sab theek raha, toh weather data frontend ko bhej do
        response.status(200).json(data);
        
    } catch (error) {
        response.status(500).json({ error: 'Server error' });
    }
}
