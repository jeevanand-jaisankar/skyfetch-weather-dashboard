// ------------------------------------
// WeatherApp Constructor
// ------------------------------------
function WeatherApp(apiKey) {
    this.apiKey = apiKey;

    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

    // DOM Elements
    this.searchBtn = document.getElementById('search-btn');
    this.cityInput = document.getElementById('city-input');
    this.weatherDisplay = document.getElementById('weather-display');

    this.init();
}

// ------------------------------------
// Init Method
// ------------------------------------
WeatherApp.prototype.init = function () {
    this.searchBtn.addEventListener(
        'click',
        this.handleSearch.bind(this)
    );

    this.cityInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            this.handleSearch();
        }
    });

    this.showWelcome();
};

// ------------------------------------
// Welcome UI
// ------------------------------------
WeatherApp.prototype.showWelcome = function () {
    this.weatherDisplay.innerHTML = `
        <div class="welcome-message">
            <h2>🌍 Check the Weather</h2>
            <p>Enter a city name and press search.</p>
        </div>
    `;
};

// ------------------------------------
// Handle Search
// ------------------------------------
WeatherApp.prototype.handleSearch = function () {
    if (this.searchBtn.disabled) return;

    const city = this.cityInput.value.trim();

    if (!city) {
        this.showError('Please enter a city name');
        return;
    }

    if (city.length < 2) {
        this.showError('City name too short');
        return;
    }

    this.getWeather(city);
    this.cityInput.value = '';
};

// ------------------------------------
// Fetch BOTH Weather + Forecast
// ------------------------------------
WeatherApp.prototype.getWeather = async function (city) {
    this.showLoading();

    this.searchBtn.disabled = true;
    this.searchBtn.textContent = '⏳ Searching...';

    const currentWeatherUrl = `${this.apiUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;

    try {
        const [currentWeather, forecastData] = await Promise.all([
            axios.get(currentWeatherUrl),
            this.getForecast(city)
        ]);

        this.displayWeather(currentWeather.data);
        this.displayForecast(forecastData);

    } catch (error) {
        console.error('Error:', error);

        if (error.response) {
            if (error.response.status === 404) {
                this.showError('City not found. Check spelling.');
            } else if (error.response.status === 401) {
                this.showError('Invalid API key.');
            } else {
                this.showError('Server error. Try again later.');
            }
        } else if (error.request) {
            this.showError('No response. Check internet connection.');
        } else {
            this.showError('Something went wrong.');
        }

    } finally {
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = '🔍 Search';
    }
};

// ------------------------------------
// Fetch Forecast
// ------------------------------------
WeatherApp.prototype.getForecast = async function(city) {
    const url = `${this.forecastUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching forecast:', error);
        throw error;
    }
};

// ------------------------------------
// Display Current Weather
// ------------------------------------
WeatherApp.prototype.displayWeather = function (data) {
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description
        .replace(/\b\w/g, char => char.toUpperCase());
    const icon = data.weather[0].icon;

    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    this.weatherDisplay.innerHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;

    this.cityInput.focus();
};

// ------------------------------------
// Process Forecast Data
// ------------------------------------
WeatherApp.prototype.processForecastData = function(data) {
    const dailyForecasts = data.list.filter(function(item) {
        return item.dt_txt.includes('12:00:00');
    });

    return dailyForecasts.slice(0, 5);
};

// ------------------------------------
// Display Forecast
// ------------------------------------
WeatherApp.prototype.displayForecast = function(data) {
    const dailyForecasts = this.processForecastData(data);

    const forecastHTML = dailyForecasts.map(function(day) {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const temp = Math.round(day.main.temp);
        const description = day.weather[0].description;
        const icon = day.weather[0].icon;

        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        return `
            <div class="forecast-card">
                <h4 class="forecast-day">${dayName}</h4>
                <img src="${iconUrl}" class="forecast-icon" />
                <div class="forecast-temp">${temp}°C</div>
                <p class="forecast-desc">${description}</p>
            </div>
        `;
    }).join('');

    const forecastSection = `
        <div class="forecast-section">
            <h3 class="forecast-title">5-Day Forecast</h3>
            <div class="forecast-container">
                ${forecastHTML}
            </div>
        </div>
    `;

    this.weatherDisplay.innerHTML += forecastSection;
};

// ------------------------------------
// Loading UI
// ------------------------------------
WeatherApp.prototype.showLoading = function () {
    this.weatherDisplay.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Fetching weather...</p>
        </div>
    `;
};

// ------------------------------------
// Error UI
// ------------------------------------
WeatherApp.prototype.showError = function (message) {
    this.weatherDisplay.innerHTML = `
        <div class="error-message">
            <h3>⚠️ Error</h3>
            <p>${message}</p>
        </div>
    `;

    this.cityInput.focus();
};

// ------------------------------------
// App Initialization
// ------------------------------------
const app = new WeatherApp('75ea8f183d0e6b0c83858c7857b178fa');

