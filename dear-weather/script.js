// --- 1. API Configuration ---
// (API keys yahaan se hata di gayi hain. Ab yeh server par hain)

// --- 2. Global Variables ---
let currentUnit = 'metric';
let favouriteCities = [];
let currentDisplayedCity = null;
let autocompleteRequestTimeout;

// --- 3. Selecting HTML Elements ---
const particleContainer = document.getElementById("particle-container");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const autocompleteContainer = document.getElementById("autocomplete-container");
const detectLocationButton = document.getElementById("detect-location-button");
const unitToggle = document.getElementById("unit-toggle");
const unitLabel = document.getElementById("unit-label");
const saveCityButton = document.getElementById("save-city-button");
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
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const tempMin = document.getElementById("temp-min");
const tempMax = document.getElementById("temp-max");
const forecastTitle = document.getElementById("forecast-title");
const forecastRow = document.getElementById("forecast-row");

// --- 4. Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    loadFavourites();
    createParticles(30); 
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


// --- 5. Main Weather Fetching Function (MODIFIED) ---
function fetchWeather(city = null, lat = null, lon = null) {
    showLoading();
    
    let weatherUrl, forecastUrl;
    
    // (MODIFIED) URLs ab humare apne serverless functions ko point kar rahe hain
    if (city) {
        weatherUrl = `/api/currentWeather?q=${city}&units=${currentUnit}`;
        forecastUrl = `/api/forecast?q=${city}&units=${currentUnit}`;
    } else {
        weatherUrl = `/api/currentWeather?lat=${lat}&lon=${lon}&units=${currentUnit}`;
        forecastUrl = `/api/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}`;
    }

    Promise.all([fetch(weatherUrl), fetch(forecastUrl)])
        .then(([weatherRes, forecastRes]) => {
            // Hum Vercel se response check kar rahe hain
            if (!weatherRes.ok) return weatherRes.json().then(err => { throw new Error(err.error || "Current weather not found"); });
            if (!forecastRes.ok) return forecastRes.json().then(err => { throw new Error(err.error || "Forecast data not found"); });
            return Promise.all([weatherRes.json(), forecastRes.json()]);
        })
        .then(([weatherData, forecastData]) => {
            hideLoading();
            updateWeatherUI(weatherData);
            updateForecastUI(forecastData);
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
    
    let rawCelsiusTemp;
    if (currentUnit === 'metric') {
        rawCelsiusTemp = data.main.temp;
    } else {
        rawCelsiusTemp = (data.main.temp - 32) * 5 / 9;
    }
    updateLiftAnimation(rawCelsiusTemp); 
    
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    const speedUnit = currentUnit === 'metric' ? 'km/h' : 'mph';
    const distUnit = currentUnit === 'metric' ? 'km' : 'mi';
    
    const windSpeedVal = currentUnit === 'metric' ? (data.wind.speed * 3.6).toFixed(1) : data.wind.speed.toFixed(1);
    const visibilityVal = currentUnit === 'metric' ? (data.visibility / 1000).toFixed(1) : (data.visibility * 0.000621371).toFixed(1);

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
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    weatherIcon.alt = data.weather[0].description;
    updateDynamicBackground(data.weather[0].main, iconCode);
    weatherCard.classList.remove("d-none");
    weatherCard.classList.add("animate-in");
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

function updateDynamicBackground(condition, iconCode) {
    const body = document.body;
    body.className = "";
    const isNight = iconCode.endsWith('n');
    
    if (isNight) {
        body.classList.add('bg-clear-night');
    } else {
        switch (condition.toLowerCase()) {
            case 'clear': body.classList.add('bg-clear-day'); break;
            case 'clouds': body.classList.add('bg-clouds'); break;
            case 'rain':
            case 'drizzle':
            case 'thunderstorm': body.classList.add('bg-rainy'); break;
            case 'snow': body.classList.add('bg-snowy'); break;
            case 'mist':
            case 'smoke':
            case 'haze':
            case 'dust':
            case 'fog':
            case 'sand':
            case 'ash':
            case 'squall':
            case 'tornado': body.classList.add('bg-mist'); break;
            default: body.classList.add('bg-clear-day');
        }
    }
}

// --- 7. Autocomplete Functions (MODIFIED) ---
function handleSearchInput() {
    clearTimeout(autocompleteRequestTimeout);
    const query = searchInput.value;

    if (query.length < 3) {
        clearAutocomplete();
        return;
    }

    // (MODIFIED) URL ab /api/autocomplete ko call kar raha hai
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


// --- 8. Particle Animation Functions ---
function createParticles(count) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        particle.style.left = `${Math.random() * 100}vw`;
        const size = `${Math.random() * 5 + 3}px`;
        particle.style.width = size;
        particle.style.height = size;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particleContainer.appendChild(particle);
    }
}

function updateLiftAnimation(temp) {
    let duration = "20s"; 
    if (temp > 15) { duration = "15s"; }
    if (temp > 25) { duration = "10s"; }
    if (temp > 35) { duration = "5s"; }
    const particles = document.querySelectorAll(".particle");
    particles.forEach(p => {
        p.style.animationDuration = duration;
    });
}


// --- 9. LocalStorage (Favourites) Functions ---
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

// --- 10. Helper Functions (UI State) ---
function showLoading() {
    loadingSpinner.classList.remove("d-none");
    errorMessage.classList.add("d-none");
    weatherCard.classList.add("d-none");
    forecastTitle.classList.add("d-none");
    forecastRow.classList.add("d-none");
    weatherCard.classList.remove("animate-in");
    forecastTitle.classList.remove("animate-in");
    forecastRow.classList.remove("animate-in");
}
function hideLoading() {
    loadingSpinner.classList.add("d-none");
}
function showError(message) {
    hideLoading();
    weatherCard.classList.add("d-none");
    forecastTitle.classList.add("d-none");
    forecastRow.classList.add("d-none");
    weatherCard.classList.remove("animate-in");
    forecastTitle.classList.remove("animate-in");
    forecastRow.classList.remove("animate-in");
    errorMessage.textContent = message;
    errorMessage.classList.remove("d-none");
}
function formatTime(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${formattedMinutes} ${ampm}`;
}