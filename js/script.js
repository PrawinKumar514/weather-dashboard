// ==================== WEATHER DASHBOARD PRO ====================
// OpenWeather API configuration – replace with your API key
const API_KEY = "df02b422bc961885c986d3ada737f090";   // <-- Replace with your actual API key
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// DOM Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const darkModeToggle = document.getElementById("darkModeToggle");

const weatherCard = document.getElementById("weatherCard");
const loadingSpinner = document.getElementById("loadingSpinner");
const errorMessageDiv = document.getElementById("errorMessage");
const errorTextSpan = document.getElementById("errorText");
const welcomeNote = document.getElementById("welcomeNote");

const cityNameSpan = document.getElementById("cityName");
const countryCodeSpan = document.getElementById("countryCode");
const currentDateTimeSpan = document.getElementById("currentDateTime");
const weatherIconImg = document.getElementById("weatherIcon");
const temperatureSpan = document.getElementById("temperature");
const weatherDescSpan = document.getElementById("weatherDesc");
const feelsLikeSpan = document.getElementById("feelsLike");
const humiditySpan = document.getElementById("humidity");
const windSpeedSpan = document.getElementById("windSpeed");

// -------------------- UI Helpers --------------------
function showLoading() {
    weatherCard.style.display = "none";
    errorMessageDiv.style.display = "none";
    loadingSpinner.style.display = "flex";
    if (welcomeNote) welcomeNote.style.display = "none";
}

function hideLoading() {
    loadingSpinner.style.display = "none";
}

function showWeatherCard() {
    weatherCard.style.display = "block";
    errorMessageDiv.style.display = "none";
    if (welcomeNote) welcomeNote.style.display = "none";
}

function showError(message) {
    hideLoading();
    weatherCard.style.display = "none";
    errorMessageDiv.style.display = "flex";
    errorTextSpan.innerText = message;
    if (welcomeNote) welcomeNote.style.display = "block";
}

// Format date/time using timezone offset (seconds)
function formatLocalDateTime(offsetSeconds) {
    const utcNow = Date.now();
    const localTimestamp = utcNow + (offsetSeconds * 1000);
    const localDate = new Date(localTimestamp);
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return localDate.toLocaleString(undefined, options);
}

// Update UI with fetched data
function updateWeatherUI(data) {
    cityNameSpan.textContent = data.name;
    countryCodeSpan.textContent = data.sys.country;
    temperatureSpan.textContent = Math.round(data.main.temp);
    feelsLikeSpan.textContent = Math.round(data.main.feels_like);
    humiditySpan.textContent = data.main.humidity;
    windSpeedSpan.textContent = data.wind.speed;
    const description = data.weather[0].description;
    weatherDescSpan.textContent = description.charAt(0).toUpperCase() + description.slice(1);
    const iconCode = data.weather[0].icon;
    weatherIconImg.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIconImg.alt = description;
    const formattedDateTime = formatLocalDateTime(data.timezone);
    currentDateTimeSpan.textContent = formattedDateTime;
}

// -------------------- Fetch Weather (async/await) --------------------
async function fetchWeatherData(cityName) {
    if (!cityName || cityName.trim() === "") {
        showError("❌ Please enter a city name.");
        return false;
    }
    const trimmedCity = cityName.trim();
    const url = `${BASE_URL}?q=${encodeURIComponent(trimmedCity)}&units=metric&appid=${API_KEY}`;
    showLoading();

    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) throw new Error(`City "${trimmedCity}" not found.`);
            if (response.status === 401) throw new Error("Invalid API key. Please check your OpenWeather API key.");
            throw new Error(`Server error (${response.status}). Try again later.`);
        }
        const data = await response.json();
        if (!data.main || !data.weather) throw new Error("Incomplete weather data.");
        updateWeatherUI(data);
        hideLoading();
        showWeatherCard();
        localStorage.setItem("lastSearchedCity", trimmedCity);
        return true;
    } catch (error) {
        let friendlyMsg = "⚠️ Unable to fetch weather. ";
        if (error.message.includes("City")) friendlyMsg = error.message;
        else if (error.message.includes("API key")) friendlyMsg = "🔑 API key error. Set a valid OpenWeather API key.";
        else if (error.message === "Failed to fetch") friendlyMsg = "🌐 Network error. Check your internet connection.";
        else friendlyMsg = `⚠️ ${error.message}`;
        showError(friendlyMsg);
        return false;
    }
}

// Search handlers
async function handleSearch() {
    const queryCity = cityInput.value.trim();
    if (queryCity === "") {
        showError("📛 Please enter a city name.");
        return;
    }
    await fetchWeatherData(queryCity);
}

searchBtn.addEventListener("click", handleSearch);
cityInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        handleSearch();
    }
});

// -------------------- Dark Mode --------------------
function initDarkMode() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateDarkModeButtonUI(true);
    } else {
        document.body.classList.remove("dark-mode");
        updateDarkModeButtonUI(false);
    }
}

function updateDarkModeButtonUI(isDark) {
    const icon = darkModeToggle.querySelector("i");
    const span = darkModeToggle.querySelector("span");
    if (isDark) {
        icon.className = "fas fa-sun";
        span.textContent = "Light";
    } else {
        icon.className = "fas fa-moon";
        span.textContent = "Dark";
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateDarkModeButtonUI(isDark);
}

darkModeToggle.addEventListener("click", toggleDarkMode);

// -------------------- Load last searched city --------------------
async function loadLastCityWeather() {
    const lastCity = localStorage.getItem("lastSearchedCity");
    if (lastCity && lastCity.trim() !== "") {
        cityInput.value = lastCity;
        await fetchWeatherData(lastCity);
    } else {
        cityInput.value = "Chennai";
        await fetchWeatherData("Chennai");
    }
}

// -------------------- Initialize App --------------------
document.addEventListener("DOMContentLoaded", () => {
    initDarkMode();
    loadLastCityWeather();
});