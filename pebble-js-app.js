//
//
// Get your api key here https://openweathermap.org/appid
// API documentation https://openweathermap.org/weather-conditions
//
var API_KEY = "api_key";
//
//
//
//
//

var CLEAR_DAY = 0;
var CLEAR_NIGHT = 1;
var WINDY = 2;
var COLD = 3;
var PARTLY_CLOUDY_DAY = 4;
var PARTLY_CLOUDY_NIGHT = 5;
var HAZE = 6;
var CLOUD = 7;
var RAIN = 8;
var SNOW = 9;
var HAIL = 10;
var CLOUDY = 11;
var STORM = 12;
var NA = 13;

var iconMap = {
    "01d": CLEAR_DAY,
    "01n": CLEAR_NIGHT,
    "02d": PARTLY_CLOUDY_DAY,
    "02n": PARTLY_CLOUDY_NIGHT,
    "03d": CLOUD,
    "03n": COLD,
    "04d": CLOUDY,
    "04n": CLOUDY,
    "09d": RAIN,
    "09n": RAIN,
    "10d": RAIN,
    "10n": RAIN,
    "11d": STORM,
    "11n": STORM,
    "13d": SNOW,
    "13n": SNOW,
    "50d": HAZE,
    "50n": HAZE,
    // special icons
    "w": WINDY,
    "h": HAZE
}

const TempUnits = {
  "fahrenheit":"fahrenheit", 
  "celsius":"celsius"}
Object.freeze(TempUnits)

var options = JSON.parse(localStorage.getItem('options'));
if (options === null) options = { "use_gps" : "true",
                                  "location" : "",
                                  "units" : "celsius",
                                  "invert_color" : "false"};

function getWeatherFromLatLong(latitude, longitude) {
    var forecastReq = new XMLHttpRequest();
    var unitsCode = "metric"
    if (options.units == TempUnits.fahrenheit) {
      unitsCode = "imperial"
    } else {
      if (options.units == TempUnits.celsius) {
        unitsCode = "metric"
      }
    }

    var forecastUrl = "https://api.openweathermap.org/data/2.5/weather?lat=" + latitude 
        + "&lon=" + longitude + "&units=" + unitsCode + "&appid=" + API_KEY;
    forecastReq.open('GET', forecastUrl, true);
    forecastReq.onload = function(e)
    {
        if(forecastReq.status == 200)
        {
            var data = JSON.parse(forecastReq.responseText);
            if(data)
            {
                getWeatherForecastIO(data);
            }
        }
    }
    
    forecastReq.send(null);
    return;
}

function getWeatherForecastIO(data) {
	var temp = data.main.temp;
	var icon = getWeatherIcon(data);
	Pebble.sendAppMessage({
		"icon" : iconMap[icon],
		"temperature" : Math.round(temp) + "\u00B0",
		"invert_color" : (options.invert_color == "true" ? 1 : 0),
	});
}

function getWeatherIcon(data) {
  var icon = data.weather[0].icon;

  // Check for clear condition and a wind speed
  if ((icon == "01d" || icon == "01n") && isHeavyWind(data))
    return "w";

  if (isHail(data))
    return "h";
  
  return icon;
}

function isHeavyWind(data) {
  if (options.units == TempUnits.fahrenheit) {
    return data.wind.speed > 12.3
  } else if (options.units == TempUnits.celsius) {
    return data.wind.speed > 5.5;
  }

  return false;
}

function isHail(data) {
  // ID 511 from OpenWeather equals to 'freezing rain'
  return data.weather[0].id == 511;
}

var locationOptions = {
  "timeout": 15000,
  "maximumAge": 60000
};

function updateWeather() {
	navigator.geolocation.getCurrentPosition(locationSuccess,
                                                    locationError,
                                                    locationOptions);
}

function locationSuccess(pos) {
  var coordinates = pos.coords;
  getWeatherFromLatLong(coordinates.latitude, coordinates.longitude);
}

function locationError(err) {
  console.warn('Location error (' + err.code + '): ' + err.message);
  Pebble.sendAppMessage({
    "icon":13,
    "temperature":""
  });
}

Pebble.addEventListener('showConfiguration', function(e) {
  var uri = 'http://client.flip.net.au/reno/circle.html?' +
    'use_gps=' + encodeURIComponent(options.use_gps) +
    '&location=' + encodeURIComponent(options.location) +
    '&units=' + encodeURIComponent(options.units) +
    '&invert_color=' + encodeURIComponent(options.invert_color) +
    '&account_token=' + encodeURIComponent(Pebble.getAccountToken());

  Pebble.openURL(uri);
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e.response) {
    options = JSON.parse(decodeURIComponent(e.response));
    localStorage.setItem('options', JSON.stringify(options));
    updateWeather();
  } else {
    console.warn('No options received');
  }
});

Pebble.addEventListener("appmessage", function(e) {
  if(e.payload.request_weather) {
    console.info("Got weather request from watch.");
    updateWeather();
  }
});

Pebble.addEventListener("ready", function(e) {
  updateWeather();
  console.info(e.type);
});