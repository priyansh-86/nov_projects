// --- 2. Global Variables ---
let currentUnit = 'metric';
let favouriteCities = [];
let currentDisplayedCity = null;
let autocompleteRequestTimeout;
let vantaEffect = null; 

// --- 3. Selecting HTML Elements ---
const vantaBg = document.getElementById("vanta-bg"); 
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const autocompleteContainer = document.getElementById("autocomplete-container");
const detectLocationButton = document.getElementById("detect-location-button");
const unitToggle = document.getElementById("unit-toggle");
const unitLabel = document.getElementById("unit-label");
const saveCityButton = document.getElementById("save-city-button");
const shareButton = document.getElementById("share-button"); 
const favouritesContainer = document.getElementById("favourites-container");
const loadingSpinner = document.getElementById("loading-spinner");
const errorMessage = document.getElementById("error-message");
const weatherCard = document.getElementById("weather-card");
const cityName = document.getElementById("city-name");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const weatherDescription = document.getElementById("weather-description");
const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const windIcon = document.getElementById("wind-icon"); 
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const tempMin = document.getElementById("temp-min");
const tempMax = document.getElementById("temp-max");

// (NEW) Hourly Forecast Elements
const hourlyTitle = document.getElementById("hourly-title");
const hourlyForecastContainer = document.getElementById("hourly-forecast-container");
const hourlyForecastRow = document.getElementById("hourly-forecast-row");

const forecastTitle = document.getElementById("forecast-title");
const forecastRow = document.getElementById("forecast-row");

// --- 4. Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    loadFavourites();
    // Default Vanta background (Using NET for better performance)
    updateDynamicBackground("Clear", "01d"); 
});
searchButton.addEventListener("click", () => {
    const city = searchInput.value;
    if (city) {
        fetchWeather(city);
        clearAutocomplete();
    }
});
searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        fetchWeather(searchInput.value);
        clearAutocomplete();
    }
});
searchInput.addEventListener("input", handleSearchInput);
document.addEventListener("click", (e) => {
    if (e.target.id !== "search-input") {
        clearAutocomplete();
    }
});
detectLocationButton.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeather(null, latitude, longitude);
        },
        (error) => {
            console.error("Geolocation error:", error);
            showError("You blocked location access or it failed.");
        }
    );
});
unitToggle.addEventListener("change", () => {
    currentUnit = unitToggle.checked ? 'imperial' : 'metric';
    unitLabel.textContent = unitToggle.checked ? '°F' : '°C';
    if (currentDisplayedCity) {
        fetchWeather(currentDisplayedCity);
    }
});
saveCityButton.addEventListener("click", toggleFavourite);
shareButton.addEventListener("click", shareWeather); 


// --- 5. Main Weather Fetching Function ---
function fetchWeather(city = null, lat = null, lon = null) {
    showLoading();
    
    let weatherUrl, forecastUrl;
    
    if (city) {
        weatherUrl = `/api/currentWeather?q=${city}&units=${currentUnit}`;
        forecastUrl = `/api/forecast?q=${city}&units=${currentUnit}`;
    } else {
        weatherUrl = `/api/currentWeather?lat=${lat}&lon=${lon}&units=${currentUnit}`;
        forecastUrl = `/api/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}`;
    }

    Promise.all([fetch(weatherUrl), fetch(forecastUrl)])
        .then(([weatherRes, forecastRes]) => {
            if (!weatherRes.ok) return weatherRes.json().then(err => { throw new Error(err.error || "Current weather not found"); });
            if (!forecastRes.ok) return forecastRes.json().then(err => { throw new Error(err.error || "Forecast data not found"); });
            return Promise.all([weatherRes.json(), forecastRes.json()]);
        })
        .then(([weatherData, forecastData]) => {
            hideLoading();
            updateWeatherUI(weatherData);
            updateForecastUI(forecastData);
            updateHourlyUI(forecastData); // (NEW) Hourly UI update
            currentDisplayedCity = weatherData.name;
            updateSaveButtonState(weatherData.name);
        })
        .catch(error => {
            console.error("Fetch error:", error);
            showError(error.message.includes("not found") ? "City not found. Check spelling." : error.message);
        });
}


// --- 6. UI Update Functions ---
function updateWeatherUI(data) {
    errorMessage.classList.add("d-none");
    
    // Wind Speed Animation
    const windSpeedKmh = currentUnit === 'metric' ? (data.wind.speed * 3.6) : (data.wind.speed * 1.60934 * 3.6);
    const windAnimDuration = Math.max(0.5, 3.5 - (windSpeedKmh / 15));
    windIcon.style.animationDuration = `${windAnimDuration}s`;
    
    // Units
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    const speedUnit = currentUnit === 'metric' ? 'km/h' : 'mph';
    const distUnit = currentUnit === 'metric' ? 'km' : 'mi';
    
    const windSpeedVal = currentUnit === 'metric' ? (data.wind.speed * 3.6).toFixed(1) : data.wind.speed.toFixed(1);
    const visibilityVal = currentUnit === 'metric' ? (data.visibility / 1000).toFixed(1) : (data.visibility * 0.000621371).toFixed(1);

    // Update Text
    cityName.textContent = data.name;
    temperature.textContent = `${Math.round(data.main.temp)}${tempUnit}`;
    weatherDescription.textContent = data.weather[0].description;
    feelsLike.textContent = `Feels like: ${Math.round(data.main.feels_like)}${tempUnit}`;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${windSpeedVal} ${speedUnit}`;
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = `${visibilityVal} ${distUnit}`;
    tempMin.textContent = `${Math.round(data.main.temp_min)}${tempUnit}`;
    tempMax.textContent = `${Math.round(data.main.temp_max)}${tempUnit}`;
    sunriseEl.textContent = formatTime(data.sys.sunrise, data.timezone);
    sunsetEl.textContent = formatTime(data.sys.sunset, data.timezone);
    
    // Update Icon
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    weatherIcon.alt = data.weather[0].description;
    
    // Update Vanta Background
    updateDynamicBackground(data.weather[0].main, iconCode);

    // Show Card
    weatherCard.classList.remove("d-none");
    weatherCard.classList.add("animate-in");
}

// (NEW) Hourly Forecast UI Update
function updateHourlyUI(data) {
    hourlyForecastRow.innerHTML = "";
    // Agle 8 intervals (24 hours)
    const hourlyForecasts = data.list.slice(0, 8); 

    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';

    hourlyForecasts.forEach(hour => {
        const date = new Date(hour.dt * 1000);
        // Timezone ko use karke time format karo
        const time = formatTime(hour.dt, data.city.timezone).split(' ')[0]; // Sirf time part

        const iconCode = hour.weather[0].icon;
        const temp = Math.round(hour.main.temp);

        const cardHtml = `
            <div class="hourly-card-item"> 
                <h6>${time}</h6>
                <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${hour.weather[0].description}" style="width: 50px; margin: -5px 0;">
                <p>${temp}${tempUnit}</p>
            </div>
        `;
        hourlyForecastRow.innerHTML += cardHtml;
    });

    hourlyTitle.classList.remove("d-none");
    hourlyForecastContainer.classList.remove("d-none");
    
    hourlyTitle.classList.add("animate-in");
    hourlyForecastContainer.classList.add("animate-in");
}

function updateForecastUI(data) {
    forecastRow.innerHTML = ""; 
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));
    
    if (dailyForecasts.length === 0) {
        for (let i = 0; i < data.list.length; i += 8) {
             dailyForecasts.push(data.list[i]);
        }
        if(dailyForecasts.length > 5) dailyForecasts.length = 5;
    }
    
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';

    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleString("en-US", { weekday: 'short' });
        const iconCode = day.weather[0].icon;
        const temp = Math.round(day.main.temp);

        const cardHtml = `
            <div class="col">
                <div class="forecast-card-item"> 
                    <h6>${dayName}</h6>
                    <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${day.weather[0].description}" style="width: 60px;">
                    <p class="fw-bold mb-0">${temp}${tempUnit}</p>
                </div>
            </div>
        `;
        forecastRow.innerHTML += cardHtml;
    });

    forecastTitle.classList.remove("d-none");
    forecastRow.classList.remove("d-none", "row-cols-5");
    forecastRow.classList.add("row", "row-cols-3", "row-cols-md-5", "g-2");
    
    forecastTitle.classList.add("animate-in");
    forecastRow.classList.add("animate-in");
}

// --- 7. Vanta.js Dynamic Background Function (OPTIMIZED) ---
function updateDynamicBackground(condition, iconCode) {
    if (vantaEffect) {
        vantaEffect.destroy();
    }

    const isNight = iconCode.endsWith('n');

    if (isNight) {
        // Night: Waves/NET (Less demanding than GLOBE)
        vantaEffect = VANTA.WAVES({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            color: 0x3a4b5b, // Dark stormy color
            waveSpeed: 0.50,
            zoom: 0.8
        });
    } else {
        // Day
        switch (condition.toLowerCase()) {
            case 'clear':
            case 'clouds':
                // Using NET (Lighter than GLOBE)
                vantaEffect = VANTA.NET({
                    el: "#vanta-bg",
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    color: 0x3f9eff, // Light blue
                    backgroundColor: 0x050f23, // Dark space blue
                    points: 10.00,
                    maxDistance: 20.00,
                    spacing: 15.00
                });
                break;
            case 'rain':
            case 'drizzle':
            case 'thunderstorm':
                // Waves effect for rainy weather
                vantaEffect = VANTA.WAVES({
                    el: "#vanta-bg",
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    color: 0x3a4b5b, 
                    shininess: 25.00,
                    waveHeight: 10.00,
                    waveSpeed: 0.50,
                    zoom: 0.8
                });
                break;
            case 'mist':
            case 'smoke':
            case 'haze':
            case 'fog':
            case 'sand':
            case 'ash':
            case 'squall':
            case 'tornado':
                // Fog effect
                vantaEffect = VANTA.FOG({
                    el: "#vanta-bg",
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    highlightColor: 0xc0c0c0,
                    midtoneColor: 0x8d8d8d,
                    lowlightColor: 0x9b9b9b,
                    baseColor: 0xffffff,
                    blurFactor: 0.60,
                    speed: 1.50,
                    zoom: 0.6
                });
                break;
            default:
                // Default fallback (NET)
                vantaEffect = VANTA.NET({
                    el: "#vanta-bg",
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    color: 0x3f9eff, 
                    backgroundColor: 0x050f23
                });
        }
    }
}

// --- 8. Autocomplete Functions ---
function handleSearchInput() {
    clearTimeout(autocompleteRequestTimeout);
    const query = searchInput.value;
    if (query.length < 3) {
        clearAutocomplete();
        return;
    }
    autocompleteRequestTimeout = setTimeout(() => {
        fetch(`/api/autocomplete?text=${query}`)
            .then(response => response.json())
            .then(data => {
                displayAutocomplete(data.features);
            })
            .catch(err => console.error("Autocomplete error:", err));
    }, 300);
}

function displayAutocomplete(features) {
    clearAutocomplete();
    if (!features || features.length === 0) return;
    features.forEach(feature => {
        const name = feature.properties.formatted;
        const item = document.createElement("a");
        item.className = "list-group-item list-group-item-action";
        item.textContent = name;
        item.onclick = (e) => {
            e.preventDefault();
            searchInput.value = feature.properties.city || feature.properties.name;
            fetchWeather(searchInput.value);
            clearAutocomplete();
        };
        autocompleteContainer.appendChild(item);
    });
}

function clearAutocomplete() {
    autocompleteContainer.innerHTML = "";
}


// --- 9. Share Function ---
async function shareWeather() {
    loadingSpinner.classList.remove("d-none");
    errorMessage.classList.add("d-none");

    try {
        const canvas = await html2canvas(weatherCard, {
            useCORS: true, 
            backgroundColor: null 
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'weather-report.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Weather Report',
                text: `Here is the weather for ${currentDisplayedCity}:`,
                files: [file],
            });
            hideLoading();
        } else {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'weather-report.png';
            link.click();
            hideLoading();
        }
    } catch (error) {
        console.error('Share error:', error);
        showError('Could not share image. Please try again.');
    }
}


// --- 10. LocalStorage (Favourites) Functions ---
function toggleFavourite() {
    if (!currentDisplayedCity) return;
    const cityIndex = favouriteCities.indexOf(currentDisplayedCity);
    if (cityIndex > -1) {
        favouriteCities.splice(cityIndex, 1);
        saveCityButton.classList.remove("active");
        saveCityButton.innerHTML = '<i class="bi bi-star"></i>';
    } else {
        favouriteCities.push(currentDisplayedCity);
        saveCityButton.classList.add("active");
        saveCityButton.innerHTML = '<i class="bi bi-star-fill"></i>';
    }
    saveFavourites();
    displayFavourites();
}
function updateSaveButtonState(city) {
    if (favouriteCities.includes(city)) {
        saveCityButton.classList.add("active");
        saveCityButton.innerHTML = '<i class="bi bi-star-fill"></i>';
    } else {
        saveCityButton.classList.remove("active");
        saveCityButton.innerHTML = '<i class="bi bi-star"></i>';
    }
}
function loadFavourites() {
    const cities = localStorage.getItem('favouriteWeatherCities');
    if (cities) {
        favouriteCities = JSON.parse(cities);
    }
    displayFavourites();
}
function saveFavourites() {
    localStorage.setItem('favouriteWeatherCities', JSON.stringify(favouriteCities));
}
function displayFavourites() {
    favouritesContainer.innerHTML = "";
    if (favouriteCities.length === 0) {
        favouritesContainer.innerHTML = '<span class="text-white-50">No saved cities yet.</span>';
        return;
    }
    favouriteCities.forEach(city => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm fav-city-btn';
        btn.textContent = city;
        btn.onclick = () => {
            searchInput.value = city;
            fetchWeather(city);
        };
        favouritesContainer.appendChild(btn);
    });
}

// --- 11. Helper Functions (UI State) ---
function showLoading() {
    loadingSpinner.classList.remove("d-none");
    errorMessage.classList.add("d-none");
    weatherCard.classList.add("d-none");
    forecastTitle.classList.add("d-none");
    forecastRow.classList.add("d-none");
    hourlyTitle.classList.add("d-none"); // (NEW)
    hourlyForecastContainer.classList.add("d-none"); // (NEW)
    weatherCard.classList.remove("animate-in");
    forecastTitle.classList.remove("animate-in");
    forecastRow.classList.remove("animate-in");
    hourlyTitle.classList.remove("animate-in"); // (NEW)
    hourlyForecastContainer.classList.remove("animate-in"); // (NEW)
}
function hideLoading() {
    loadingSpinner.classList.add("d-none");
}
function showError(message) {
    hideLoading();
    weatherCard.classList.add("d-none");
    forecastTitle.classList.add("d-none");
    forecastRow.classList.add("d-none");
    hourlyTitle.classList.add("d-none"); // (NEW)
    hourlyForecastContainer.classList.add("d-none"); // (NEW)
    weatherCard.classList.remove("animate-in");
    forecastTitle.classList.remove("animate-in");
    forecastRow.classList.remove("animate-in");
    hourlyTitle.classList.remove("animate-in"); // (NEW)
    hourlyForecastContainer.classList.remove("animate-in"); // (NEW)
    errorMessage.textContent = message;
    errorMessage.classList.remove("d-none");
}
function formatTime(timestamp, timezone) {
    // Timezone offset ko seconds se milliseconds mein convert karke local time calculate karo
    const date = new Date((timestamp + timezone) * 1000); 
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${formattedMinutes} ${ampm}`;
}