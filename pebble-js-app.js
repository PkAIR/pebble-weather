//
//
// Get your api key here https://openweathermap.org/appid 
//
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
	"50n": HAZE
}

var options = JSON.parse(localStorage.getItem('options'));
//console.log('read options: ' + JSON.stringify(options));
if (options === null) options = { "use_gps" : "true",
                                  "location" : "",
                                  "units" : "celsius",
                                  "invert_color" : "false"};

function getWeatherFromLatLong(latitude, longitude) {
    console.log(latitude + ", " + longitude);
    var forecastReq = new XMLHttpRequest();
    var unitsCode = "metric"
    if (options.units == "fahrenheit") unitsCode = "imperial"
    else if (options.units == "celsius") unitsCode = "metric"
    var forecastUrl = "https://api.openweathermap.org/data/2.5/weather?lat=" + latitude 
        + "&lon=" + longitude + "&units=" + unitsCode + "&appid=" + API_KEY;
    forecastReq.open('GET', forecastUrl, true);
    forecastReq.onload = function(e)
    {
        //console.log(e.status);
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

function getWeatherForecastIO(data)
{
	var temp = data.main.temp;
	console.log("TEMP: " + temp);
	var icon = data.weather[0].icon;
	Pebble.sendAppMessage({
		"icon" : iconMap[icon],
		"temperature" : Math.round(temp) + "\u00B0",
		"invert_color" : (options.invert_color == "true" ? 1 : 0),
	});
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
  console.warn('location error (' + err.code + '): ' + err.message);
  Pebble.sendAppMessage({
    "icon":11,
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
  //console.log('showing configuration at uri: ' + uri);

  Pebble.openURL(uri);
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e.response) {
    options = JSON.parse(decodeURIComponent(e.response));
    localStorage.setItem('options', JSON.stringify(options));
    //console.log('storing options: ' + JSON.stringify(options));
    updateWeather();
  } else {
    console.log('no options received');
  }
});

Pebble.addEventListener("appmessage", function(e) {
  if(e.payload.request_weather) {
    console.log("Got weather request from watch.");
    updateWeather();
  }
});

Pebble.addEventListener("ready", function(e) {
  //console.log("connect!" + e.ready);
  updateWeather();
  console.log(e.type);
});