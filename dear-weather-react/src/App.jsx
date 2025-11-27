import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, MapPin, Wind, Droplet, Eye, Gauge, 
  Sun, Star, CloudSun, Loader2, Calendar, RefreshCw 
} from 'lucide-react';

// Note: No API Keys here! They are now safely on the server.

const App = () => {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState('metric'); 
  const [suggestions, setSuggestions] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    // Safety check for localStorage (prevents hydration mismatch in some cases)
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('favCities');
        return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // --- Initial Load ---
  useEffect(() => {
    fetchWeatherByCity('Mumbai');
  }, []);

  // --- Refetch Data When Unit Changes ---
  useEffect(() => {
    if (weather) {
      fetchWeatherByCity(weather.name);
    }
  }, [unit]);

  // --- Save Favorites ---
  useEffect(() => {
    localStorage.setItem('favCities', JSON.stringify(favorites));
  }, [favorites]);

  // --- FETCH FUNCTIONS (Updated to use internal API) ---

  const fetchWeatherByCity = useCallback(async (city) => {
    setLoading(true);
    setError('');
    setSuggestions([]);
    try {
      // Call our own serverless function
      const weatherRes = await fetch(`/api/weather?q=${city}&units=${unit}`);
      const forecastRes = await fetch(`/api/forecast?q=${city}&units=${unit}`);

      if (!weatherRes.ok) throw new Error('City not found');
      
      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      setWeather(weatherData);
      setForecast(forecastData);
      setQuery(''); 
    } catch (err) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [unit]);

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError('');
    try {
      const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}&units=${unit}`);
      const forecastRes = await fetch(`/api/forecast?lat=${lat}&lon=${lon}&units=${unit}`);

      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      setWeather(weatherData);
      setForecast(forecastData);
    } catch (err) {
      setError("Location access failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 2) {
      try {
        const res = await fetch(`/api/geo?text=${value}`);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) {
        console.error(e);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        () => setError("Permission denied")
      );
    } else {
      setError("Geolocation not supported");
    }
  };

  const toggleFavorite = () => {
    if (!weather) return;
    const city = weather.name;
    if (favorites.includes(city)) {
      setFavorites(favorites.filter(f => f !== city));
    } else {
      setFavorites([...favorites, city]);
    }
  };

  // --- HELPER FUNCTIONS ---
  const formatTime = (unix, timezone) => {
    const utcDate = new Date(unix * 1000);
    const localDate = new Date(utcDate.getTime() + (timezone * 1000) + (utcDate.getTimezoneOffset() * 60000)); 
    
    const hours = localDate.getHours();
    const minutes = localDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = minutes < 10 ? '0'+minutes : minutes;
    return `${h}:${m} ${ampm}`;
  };

  const dailyForecast = useMemo(() => {
    if (!forecast) return [];
    const days = {};
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' });
      if (!days[date]) {
        days[date] = { ...item, min: item.main.temp_min, max: item.main.temp_max };
      } else {
        days[date].min = Math.min(days[date].min, item.main.temp_min);
        days[date].max = Math.max(days[date].max, item.main.temp_max);
        if (item.sys.pod === 'd') {
            days[date].weather = item.weather;
        }
      }
    });
    return Object.values(days).slice(0, 5);
  }, [forecast]);

  const speedSymbol = unit === 'metric' ? 'km/h' : 'mph';

  return (
    <div className="min-h-screen relative flex flex-col items-center p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      
      {/* --- AMBIENT BACKGROUND --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[100px] animate-float delay-1000"></div>
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[80px] animate-float delay-2000"></div>
      </div>

      <main className="relative z-10 w-full max-w-5xl space-y-8">
        
        {/* HEADER & SEARCH */}
        <header className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
              <CloudSun className="text-cyan-400" size={32} /> Dear Weather
            </h1>
            
            <button 
              onClick={() => setUnit(prev => prev === 'metric' ? 'imperial' : 'metric')}
              className="glass-panel px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 hover:bg-white/10 transition active:scale-95"
            >
              <RefreshCw size={14} /> {unit === 'metric' ? 'Metric (°C)' : 'Imperial (°F)'}
            </button>
          </div>

          <div className="relative z-50">
            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5 group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search city..." 
                  value={query}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && fetchWeatherByCity(query)}
                  className="glass-input w-full py-4 pl-12 pr-4 rounded-2xl text-lg"
                />
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 glass-panel rounded-xl overflow-hidden">
                    {suggestions.map((s, i) => (
                      <div 
                        key={i} 
                        onClick={() => fetchWeatherByCity(s.properties.city || s.properties.name)}
                        className="p-3 hover:bg-white/10 cursor-pointer text-sm text-white/80 border-b border-white/5 last:border-0"
                      >
                        {s.properties.formatted}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={handleGPS}
                className="glass-panel p-4 rounded-2xl hover:bg-cyan-500/20 hover:border-cyan-500/50 transition text-white/80 hover:text-white active:scale-95"
              >
                <MapPin size={24} />
              </button>
            </div>
          </div>

          {/* Favorites Chips */}
          {favorites.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {favorites.map(city => (
                <button 
                  key={city} 
                  onClick={() => fetchWeatherByCity(city)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/5 text-xs transition flex items-center gap-1"
                >
                  <Star size={10} className="fill-yellow-400 text-yellow-400" /> {city}
                </button>
              ))}
            </div>
          )}
        </header>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-cyan-400 w-12 h-12" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* WEATHER DASHBOARD */}
        {!loading && weather && (
          <div className="space-y-6 animate-fade-in">
            
            {/* MAIN CARD */}
            <div className="glass-panel rounded-[2rem] p-8 md:p-12 relative overflow-hidden group transition-all hover:border-white/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 blur-[80px] rounded-full group-hover:bg-cyan-400/20 transition-colors duration-700"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
                      {weather.name}
                    </h2>
                    <button onClick={toggleFavorite} className="text-white/30 hover:text-yellow-400 transition hover:scale-110 active:scale-90">
                      <Star size={28} className={favorites.includes(weather.name) ? "fill-yellow-400 text-yellow-400" : ""} />
                    </button>
                  </div>
                  <p className="text-xl text-cyan-200 capitalize font-medium flex items-center gap-2">
                    {weather.weather[0].description}
                  </p>
                  
                  <div className="mt-8 flex items-center gap-6">
                    <span className="text-7xl md:text-9xl font-bold tracking-tighter">
                      {Math.round(weather.main.temp)}°
                    </span>
                    <div className="flex flex-col space-y-1 pl-6 border-l border-white/10 py-2">
                      <span className="text-white/60 text-sm">Feels Like: <span className="text-white font-semibold">{Math.round(weather.main.feels_like)}°</span></span>
                      <span className="text-white/60 text-sm">High: <span className="text-white font-semibold">{Math.round(weather.main.temp_max)}°</span></span>
                      <span className="text-white/60 text-sm">Low: <span className="text-white font-semibold">{Math.round(weather.main.temp_min)}°</span></span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel bg-white/5 p-6 rounded-3xl backdrop-blur-md border-white/10 shadow-inner">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`} 
                    alt="icon" 
                    className="w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl filter saturate-150"
                  />
                </div>
              </div>
            </div>

            {/* HOURLY FORECAST */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-white/50 px-2">Hourly Forecast</h3>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 cursor-grab active:cursor-grabbing">
                {forecast?.list.slice(0, 12).map((item, i) => (
                  <div key={i} className="flex-shrink-0 w-24 glass-panel rounded-2xl p-4 flex flex-col items-center gap-3 hover:bg-white/10 transition select-none">
                    <span className="text-xs text-white/60 whitespace-nowrap">
                      {formatTime(item.dt, weather.timezone).split(' ')[0]} 
                      <span className="text-[10px] ml-1">{formatTime(item.dt, weather.timezone).split(' ')[1]}</span>
                    </span>
                    <img src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`} className="w-10 h-10" />
                    <span className="font-bold text-lg">{Math.round(item.main.temp)}°</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 5-DAY FORECAST */}
              <div className="lg:col-span-2 glass-panel rounded-3xl p-6 md:p-8">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
                  <Calendar size={16} /> 5-Day Forecast
                </h3>
                <div className="space-y-2">
                  {dailyForecast.map((day, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition">
                      <span className="w-24 font-medium">{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                      <div className="flex items-center gap-2 flex-1 text-cyan-200/80 text-sm">
                        <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} className="w-8 h-8" />
                        <span className="hidden sm:inline capitalize">{day.weather[0].description}</span>
                      </div>
                      <div className="flex gap-4 text-right w-32">
                        <span className="font-bold">{Math.round(day.max)}°</span>
                        <span className="text-white/40">{Math.round(day.min)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HIGHLIGHTS GRID */}
              <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-2 flex items-center gap-2">
                  <Gauge size={16} /> Highlights
                </h3>
                
                <div className="grid grid-cols-2 gap-3 h-full">
                  <HighlightCard icon={<Wind className="text-cyan-300" />} label="Wind" value={weather.wind.speed} unit={speedSymbol} />
                  <HighlightCard icon={<Droplet className="text-blue-400" />} label="Humidity" value={weather.main.humidity} unit="%" />
                  <HighlightCard icon={<Eye className="text-purple-300" />} label="Visibility" value={(weather.visibility / 1000).toFixed(1)} unit="km" />
                  <HighlightCard icon={<Gauge className="text-emerald-300" />} label="Pressure" value={weather.main.pressure} unit="hPa" />
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-white/50 uppercase tracking-wider">Sun Cycle</span>
                    <Sun size={16} className="text-yellow-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-sm text-white/80">Sunrise</span>
                      <span className="font-mono">{formatTime(weather.sys.sunrise, weather.timezone)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-white/80">Sunset</span>
                      <span className="font-mono">{formatTime(weather.sys.sunset, weather.timezone)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 text-center z-10 relative">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-4"></div>
        <p className="text-white/30 text-xs uppercase tracking-widest">Dear Weather React • By Priyansh</p>
      </footer>
    </div>
  );
};

const HighlightCard = ({ icon, label, value, unit }) => (
  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between hover:bg-white/10 transition">
    <span className="text-white/50 text-xs">{label}</span>
    <div className="flex items-end gap-1 mt-3">
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs text-white/60 mb-1">{unit}</span>
    </div>
    <div className="self-end mt-1">{icon}</div>
  </div>
);

export default App;