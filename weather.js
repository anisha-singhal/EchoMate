const apiKey = "039cc26a00cc678b3ebefe0950e98570";
const weatherElement = document.getElementById("weather");

async function fetchWeather() {
    try {
        if (!navigator.geolocation) {
            weatherElement.textContent = "Geolocation is not supported by this browser.";
            return;
        }
        
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.main) {
                const temp = Math.round(data.main.temp);
                const weatherDesc = data.weather[0].description;
                weatherElement.textContent = `${temp}°C, ${weatherDesc}`;
            } else {
                weatherElement.textContent = "Weather data unavailable";
            }
        }, () => {
            weatherElement.textContent = "Unable to retrieve location.";
        });
    } catch (error) {
        console.error("Error fetching weather data:", error);
        weatherElement.textContent = "Error fetching weather.";
    }
}

document.addEventListener("DOMContentLoaded", fetchWeather);
