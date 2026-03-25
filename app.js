// Your OpenWeatherMap API Key
const API_KEY = 'bcf7ec295066110ab7f78d1fb87f05ba';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// WeatherApp constructor for DOM caching and setup
function WeatherApp(apiKey) {
    // Store API key
    this.apiKey = apiKey;

    // Store API URLs
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

    // Store DOM references (query once for better performance)
    this.searchBtn = document.getElementById('search-btn');
    this.cityInput = document.getElementById('city-input');
    this.weatherDisplay = document.getElementById('weather-display');

    // New DOM references for recent searches
    this.recentSearchesSection = document.getElementById('recent-searches-section');
    this.recentSearchesContainer = document.getElementById('recent-searches-container');

    // Recent searches array and max limit
    this.recentSearches = [];
    this.maxRecentSearches = 5;

    // Initialize event listeners, recent searches, and last city
    this.init();
}

WeatherApp.prototype.init = function() {
    // Event listeners
    this.searchBtn.addEventListener('click', this.handleSearch.bind(this));
    this.cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            this.handleSearch();
        }
    }.bind(this));

    // Load recent searches first
    this.loadRecentSearches();

    // Load last searched city if any
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        this.getWeather(lastCity);
    } else {
        this.showWelcome();
    }

    // Clear history button
    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', this.clearHistory.bind(this));
    }
};

// Welcome message
WeatherApp.prototype.showWelcome = function() {
    const welcomeHTML = `
        <div class="welcome-message">
            <h2>🌤️ Welcome to WeatherApp!</h2>
            <p>Search for a city to get started. Try: London, Paris, Tokyo</p>
        </div>
    `;
    this.weatherDisplay.innerHTML = welcomeHTML;
};

// Handle search
WeatherApp.prototype.handleSearch = function() {
    const city = this.cityInput.value.trim();

    if (!city) {
        this.showError("Please enter a city name.");
        return;
    }
    if (city.length < 2) {
        this.showError("City name too short.");
        return;
    }

    this.getWeather(city);
    this.cityInput.value = "";
};

// Fetch weather and forecast
WeatherApp.prototype.getWeather = async function(city) {
    this.showLoading();
    this.searchBtn.disabled = true;
    this.searchBtn.textContent = 'Searching...';

    const currentUrl = `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    try {
        const [currentWeather, forecastData] = await Promise.all([
            axios.get(currentUrl),
            this.getForecast(city)
        ]);

        this.displayWeather(currentWeather.data);
        this.displayForecast(forecastData);

        // Save recent search
        this.saveRecentSearch(city);

        // Save last searched city
        localStorage.setItem('lastCity', city);

    } catch (error) {
        console.error('Error:', error);
        if (error.response && error.response.status === 404) {
            this.showError('City not found. Please check spelling and try again.');
        } else {
            this.showError('Something went wrong. Please try again later.');
        }
    } finally {
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = 'Get Weather';
    }
};

// Show error message
WeatherApp.prototype.showError = function(message) {
    const errorHTML = `
        <div class="error-message">
            <p>❌ Error</p>
            <p>${message}</p>
        </div>
    `;
    this.weatherDisplay.innerHTML = errorHTML;
    this.cityInput.focus();
};

// Show loading state
WeatherApp.prototype.showLoading = function() {
    const loadingHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading weather data...</p>
        </div>
    `;
    this.weatherDisplay.innerHTML = loadingHTML;
};

// Fetch 5-day forecast
WeatherApp.prototype.getForecast = async function(city) {
    const url = `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching forecast:', error);
        throw error;
    }
};

// Display current weather
WeatherApp.prototype.displayWeather = function(data) {
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const weatherHTML = `
        <div class="weather-info">
            <h2>${cityName}</h2>
            <img src="${iconUrl}" alt="${description}">
            <p>🌡️ ${temperature}°C</p>
            <p>${description}</p>
        </div>
    `;

    this.weatherDisplay.innerHTML = weatherHTML;
    this.cityInput.focus();
};

// Display 5-day forecast
WeatherApp.prototype.displayForecast = function(data) {
    const dailyForecasts = this.processForecastData(data);

    const forecastHTML = dailyForecasts.map(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(day.main.temp);
        const description = day.weather[0].description;
        const icon = day.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        return `
            <div class="forecast-card">
                <h4>${dayName}</h4>
                <img src="${iconUrl}" alt="${description}">
                <p>🌡️ ${temp}°C</p>
                <p>${description}</p>
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

// Process forecast data for one entry per day
WeatherApp.prototype.processForecastData = function(data) {
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    return dailyForecasts.slice(0, 5);
};

// ---------- Recent Searches Functionality ----------

// Load recent searches from localStorage
WeatherApp.prototype.loadRecentSearches = function() {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
        this.recentSearches = JSON.parse(saved);
    }
    this.displayRecentSearches();
};

// Save a new search
WeatherApp.prototype.saveRecentSearch = function(city) {
    const cityName = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    const index = this.recentSearches.indexOf(cityName);
    if (index > -1) {
        this.recentSearches.splice(index, 1);
    }
    this.recentSearches.unshift(cityName);
    if (this.recentSearches.length > this.maxRecentSearches) {
        this.recentSearches.pop();
    }
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    this.displayRecentSearches();
};

// Display recent searches as buttons
WeatherApp.prototype.displayRecentSearches = function() {
    this.recentSearchesContainer.innerHTML = '';
    if (this.recentSearches.length === 0) {
        this.recentSearchesSection.style.display = 'none';
        return;
    }
    this.recentSearchesSection.style.display = 'block';

    this.recentSearches.forEach(function(city) {
        const btn = document.createElement('button');
        btn.className = 'recent-search-btn';
        btn.textContent = city;

        btn.addEventListener('click', function() {
            this.cityInput.value = city;
            this.getWeather(city);
        }.bind(this));

        this.recentSearchesContainer.appendChild(btn);
    }.bind(this));
};

// Load last searched city
WeatherApp.prototype.loadLastCity = function() {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        this.getWeather(lastCity);
    } else {
        this.showWelcome();
    }
};

// Clear history button
WeatherApp.prototype.clearHistory = function() {
    if (confirm('Clear all recent searches?')) {
        this.recentSearches = [];
        localStorage.removeItem('recentSearches');
        this.displayRecentSearches();
    }
};

// Create app instance
const app = new WeatherApp(API_KEY);