// DOM ELEMENT SELECTION
const
    temp = document.getElementById("temp"),
    date = document.getElementById("date-time"),
    currentLocation = document.getElementById("location"),
    condition = document.getElementById("condition"),
    rain = document.getElementById("rain"),
    mainIcon = document.getElementById("icon"),

    uvIndex = document.querySelector(".uv-index"),
    uvText = document.querySelector(".uv-text"),
    windSpeed = document.querySelector(".wind-speed"),
    sunRise = document.querySelector(".sun-rise"),
    sunSet = document.querySelector(".sun-set"),
    humidity = document.querySelector(".humidity"),
    visibility = document.querySelector(".visibility"),
    humidityStatus = document.querySelector(".humidity-status"),
    airQuality = document.querySelector(".air-quality"),
    airQualityStatus = document.querySelector(".air-quality-status"),
    visibilityStatus = document.querySelector(".visibility-status"),

    weatherCards = document.querySelector("#weather-cards"),
    celciusBtn = document.querySelector(".celcius"),
    fahrenheitBtn = document.querySelector(".fahrenheit"),
    hourlyBtn = document.querySelector(".hourly"),
    weekBtn = document.querySelector(".week"),
    tempUnit = document.querySelectorAll(".temp-unit"),
    searchForm = document.querySelector("#search"),
    search = document.querySelector("#query");

let currentCity = "";          //---STORES SELECTED CITY
let currentUnit = "C";         //---DEFAULT UNIT
let hourlyorWeek = "week";     //---DEFAULT FORECAST TYPE
let currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;     //---DEFAULT TO LOCAL TIMEZONE

// DATE AND TIME FUNCTION - LOCATION TIMEZONE AWARE
function getDateTime() {
    let now = new Date();
    let formatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: currentTimezone
    });
    let parts = formatter.formatToParts(now);
    let dayString = parts.find(p => p.type === 'weekday').value;
    let hourStr = parts.find(p => p.type === 'hour').value;
    let minuteStr = parts.find(p => p.type === 'minute').value;
    return `${dayString}, ${hourStr.padStart(2, '0')}:${minuteStr}`;
}

date.innerText = getDateTime();

// Update time every Second
setInterval(() => {
    date.innerText = getDateTime();
}, 1000)

// GET USER LOCATION (API)
function getPublicIp() {
    console.log("=== DEBUG: Fetching IP location ===");
    fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
            console.log("IP API response:", data);
            currentCity = data.city || "Merta City";
            console.log("Set city:", currentCity);
            getWeatherData(currentCity, currentUnit, hourlyorWeek);
        })
        .catch(err => {
            console.error("IP API error:", err);
            currentCity = "Merta City";
            console.log("Fallback city:", currentCity);
            getWeatherData(currentCity, currentUnit, hourlyorWeek);
        });
}
getPublicIp();

// FETCH WEATHER DATA
function getWeatherData(city, unit, hourlyorWeek) {
    const apikey = "L9PEKPRRTFE5WPBD5NJ72MWAE"
    fetch(
        `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}?unitGroup=metric&key=${apikey}&contentType=json`,
        {
            method: "GET"
        })
        
        .then((response) => response.json())
        .then((data) => {
            let today = data.currentConditions || data.days[0];

            // Update timezone for location time display
            currentTimezone = data.timezone || currentTimezone;
            console.log("Updated timezone:", currentTimezone);

            // temperature based unit
            if (unit === "C") {
                temp.innerText = today.temp;
            } else {
                temp.innerText = celciusToFahrenheit(today.temp)
            }

            // change inner text and update current information
            currentLocation.innerText = data.resolvedAddress;
            condition.innerText = today.conditions;
            rain.innerText = "Perc - " + today.precip + "%";
            uvIndex.innerText = today.uvindex;
            windSpeed.innerText = today.windspeed;
            humidity.innerText = today.humidity + "%";
            visibility.innerText = today.visibility + " km";
            airQuality.innerText = today.winddir ? Math.round(today.winddir) : "N/A";

            // status update functions
            measureUvIndex(today.uvindex);
            updateHumidityStatus(today.humidity);
            updateVisibilityStatus(today.visibility);
            updateAirQualityStatus(today.winddir);

            // sunrise and sunset formatting
            sunRise.innerText = convertTimeTo12HourFormat(today.sunrise);
            sunSet.innerText = convertTimeTo12HourFormat(today.sunset);

            // update icon & background
            console.log("=== DEBUG: Current icon:", today.icon);
            mainIcon.src = getIcon(today.icon, null); // null = current time
            changeBackground(today.icon);

            // hourly and weekly forecast selection
            if (hourlyorWeek === "hourly") {
                updateForecast(data.days[0].hours, unit, "day")
            } else {
                updateForecast(data.days, unit, "week")
            }
        })

        .catch((error) => {
            console.error("Weather API error:", error);
            alert("City not found in our database");
        });
}

// UTILITY FUNCTIONS

// Convert celcius to  Fahrenheit
function celciusToFahrenheit(temp) {
    return ((temp * 9) / 5 + 32).toFixed(1)
}

// function to get uv index status
function measureUvIndex(uvIndex) {
    if (uvIndex <= 2) {
        uvText.innerText = "Low";
    } else if (uvIndex <= 5) {
        uvText.innerText = "Moderate";
    } else if (uvIndex <= 7) {
        uvText.innerText = "High";
    } else if (uvIndex <= 10) {
        uvText.innerText = "Very-High";
    } else {
        uvText.innerText = "Extreme";
    }
}

// function to update humidity status
function updateHumidityStatus(humidity) {
    if (humidity <= 30) {
        humidityStatus.innerText = "Low"
    } else if (humidity <= 60) {
        humidityStatus.innerText = "Moderate"
    } else {
        humidityStatus.innerText = "High"
    }
}

// function to update visibility status
function updateVisibilityStatus(visibility) {

    if (visibility <= 0.16) {
        visibilityStatus.innerText = "Dense Fog";
    }
    else if (visibility <= 0.3) {
        visibilityStatus.innerText = "Moderate Fog";
    }
    else if (visibility <= 1) {
        visibilityStatus.innerText = "Light Fog";
    }
    else if (visibility <= 5) {
        visibilityStatus.innerText = "Mist";
    }
    else if (visibility <= 10) {
        visibilityStatus.innerText = "Clear";
    }
    else {
        visibilityStatus.innerText = "Very Clear";
    }
}

// function to update air quality status
function updateAirQualityStatus(airQuality) {
    if (airQuality <= 50) {
        airQualityStatus.innerText = "Good";
    } else if (airQuality <= 100) {
        airQualityStatus.innerText = "Moderate";
    } else if (airQuality <= 150) {
        airQualityStatus.innerText = "Unhealthy for sensitive groups";
    } else if (airQuality <= 200) {
        airQualityStatus.innerText = "Unhealthy";
    } else if (airQuality <= 250) {
        airQualityStatus.innerText = "Very Unhealthy";
    } else {
        airQualityStatus.innerText = "Very Clear Air";
    }
}

// Convert 24-hour time to 12-hour format
function convertTimeTo12HourFormat(time) {
    if (!time) return "N/A";
    let [hour, minute] = time.split(":").map(Number);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

// FIXED GET WEATHER ICON - Smart day/night for current, forecast-aware
function getIcon(condition, datetime = null) {
    if (!condition) return "assets/cloudy.png";

    // Get hour for this slot
    let hour;
    if (datetime) {
        hour = parseInt(datetime.split(':')[0]);
    } else {
        hour = new Date().getHours();
    }
    const isNight = hour >= 18 || hour < 6;

    console.log(`getIcon - Condition: "${condition}", Hour: ${hour}, IsNight: ${isNight}`);

    const iconMap = {
        "clear-day": "assets/day.png",
        "clear-night": "assets/night-moon.png",
        "sunny": "assets/day.png",
        "partly-cloudy-day": "assets/cloudy-day.png",
        "partly-cloudy-night": "assets/partly-cloudy-night.png",
        "cloudy-day": "assets/clouds.png",
        "cloudy-night": "assets/cloudy-night.png",
        "cloudy": "assets/cloudy.png",
        "rain": "assets/rain.png",
        "showers-day": "assets/rain.png",
        "showers-night": "assets/night-raining.png",
        "night-raining": "assets/night-raining.png",
        "thunderstorm": "assets/thunderstorm.png",
        "thunder-rain": "assets/thunderstorm.png",
        "fog": "assets/foggy.png",
        "foggy": "assets/foggy.png",
        "snow": "assets/snow.png",
        "wind": "assets/wind.png",
        "sky": "assets/clouds.png"
    };
    if (condition === "cloudy") {
        condition = isNight ? "cloudy-night" : "cloudy-day";
    }

    let icon = iconMap[condition];
    // Conservative night override: only for clear/partly-cloudy if night and no native -night
    if (isNight && !icon && condition.includes('-day')) {
        let nightCond = condition.replace('-day', '-night');
        icon = iconMap[nightCond] || iconMap[condition.replace('-day', '')] || "assets/cloudy-night.png";
    }

    console.log("Selected icon:", icon || "assets/cloudy.png");
    return icon || "assets/cloudy.png";
}

// GET DAY NAME FROM DATE
function getDayName(date) {
    let day = new Date(date);
    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day.getDay()];
}

// GET HOUR (12-HOUR FORMAT)
function getHour(time) {
    let hour = parseInt(time.split(":")[0]);
    let min = time.split(":")[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${min} ${ampm}`;
}

// UPDATE FORECAST CARDS - Pass datetime for accurate icons
function updateForecast(data, unit, type) {
    weatherCards.innerHTML = "";
    let day = 0;
    let numCards = type === "day" ? 24 : 7;

    for (let i = 0; i < numCards; i++) {
        if (!data[day]) break;
        console.log("Forecast icon:", data[day].icon, "at", data[day].datetime);

        let card = document.createElement("div");
        card.classList.add("card");

        let dayName = type === "week" ? getDayName(data[day].datetime) : getHour(data[day].datetime);

        let dayTemp = unit === "F" ? celciusToFahrenheit(data[day].temp) : data[day].temp;
        let tempUnit = unit === "F" ? "°F" : "°C";

        // Pass datetime for forecast-aware day/night
        let iconScr = getIcon(data[day].icon, data[day].datetime);

        card.innerHTML = `
            <h2 class="day-name">${dayName}</h2>
            <div class="card-icon">
                <img src="${iconScr}" alt="">
            </div>
            <div class="day-temp">
                <h2 class="temp">${Math.round(parseFloat(dayTemp))}</h2>
                <span class="temp-unit">${tempUnit}</span>
            </div>   
        `;
        weatherCards.appendChild(card);
        day++;
    }
}

// CHANGE BACKGROUND BASED ON WEATHER CONDITION
function changeBackground(condition) {
    const body = document.body;
    const bgMap = {
        "clear-day": "assets/sky.jpg",
        "clear-night": "assets/night-sky.jpg",
        "partly-cloudy-day": "assets/cloudy-sky.jpg",
        "partly-cloudy-night": "assets/cloudy-night.jpg",
        "cloudy": "assets/cloudy-sky.jpg",
        "rain": "assets/rain.jpg",
        "fog": "assets/fog-weather.jpg",
        "snow": "assets/snow-weather.jpg",
        "thunderstorm": "assets/thunderstorm-img.jpg"
    };

    const bg = bgMap[condition] || "assets/sky.jpg";
    body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bg})`;
}

// CHANGE TEMPERATURE UNIT (C/F)
function changeUnit(unit) {
    if (currentUnit !== unit) {
        currentUnit = unit;
        tempUnit.forEach((elem) => {
            elem.innerText = `°${unit.toUpperCase()}`;
        });
        document.querySelector(".celcius").classList.toggle("active", unit === "C");
        document.querySelector(".fahrenheit").classList.toggle("active", unit === "F");
        getWeatherData(currentCity, currentUnit, hourlyorWeek);
    }
}

// CHANGE FORECAST TYPE (HOURLY/WEEK)
function changeTimeSpan(span) {
    if (hourlyorWeek !== span) {
        hourlyorWeek = span;
        document.querySelector(".hourly").classList.toggle("active", span === "hourly");
        document.querySelector(".week").classList.toggle("active", span === "week");
        getWeatherData(currentCity, currentUnit, hourlyorWeek);
    }
}

// Event Listeners
document.querySelector(".fahrenheit").addEventListener("click", () => changeUnit("F"));
document.querySelector(".celcius").addEventListener("click", () => changeUnit("C"));
document.querySelector(".hourly").addEventListener("click", () => changeTimeSpan("hourly"));
document.querySelector(".week").addEventListener("click", () => changeTimeSpan("week"));

searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let location = search.value.trim();
    if (location) {
        currentCity = location;
        getWeatherData(currentCity, currentUnit, hourlyorWeek);
    }
});

// Search suggestions - unchanged
const cities = ["Merta City", "Pali", "Jodhpur", "Jaipur", "Ajmer", "Udaipur", "Bikaner", "Bengaluru", "Delhi", "Mumbai", "Indore", "Chandigarh"];

let currentFocus = -1;

// INPUT TYPING SUGGESTIONS
search.addEventListener("input", function () {
    removeSuggestions();
    const val = this.value.trim();
    if (!val) return;

    currentFocus = -1;
    const ul = document.createElement("ul");
    ul.id = "suggestions";

    // city filter
    cities.forEach(city => {
        if (city.toLowerCase().startsWith(val.toLowerCase())) {
            const li = document.createElement("li");
            li.innerHTML = `<strong>${city.substring(0, val.length)}</strong>${city.substring(val.length)}`;
            li.innerHTML += `<input type="hidden" value="${city}">`;

            li.addEventListener("click", () => {
                search.value = city;
                removeSuggestions();
                currentCity = city;
                getWeatherData(city, currentUnit, hourlyorWeek);
            });

            ul.appendChild(li);
        }
    });

    this.parentNode.appendChild(ul);
});

// REMOVE SUGGESTIONS
function removeSuggestions() {
    const suggestions = document.getElementById("suggestions");
    if (suggestions) {
        suggestions.remove();
    }
}

// KEYBOARD NAVIGATION
search.addEventListener("keydown", function (e) {
    let items = document.getElementById("suggestions");
    if (items) items = items.getElementsByTagName("li");

    if (e.key == "ArrowDown") {
        currentFocus++;
        addActive(items);
    } else if (e.key == "ArrowUp") {
        currentFocus--;
        addActive(items);
    }

    if (e.key == "Enter") {
        e.preventDefault();
        if (currentFocus > -1 && items) items[currentFocus].click();
    }
});

// ADD ACTIVE CLASS
function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    x[currentFocus].classList.add("active");
}

// REMOVE ACTIVE CLASS
function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("active");
    }
}