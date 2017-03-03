/*
Requriements:
  1. Show weather in users current location: temperature and cloud cover; possibly other such as windspeed and barometric preasure
  2. show different background image or icon based on current conditions.
  3. Bonus: add button to switch between farenheig and celsius
to do:
add cacheing function with time stamp and only get new weather data every 10 minutes
*/

//Main function starts here
$("document").ready(function(){
  var prot = window.location.protocol; //get connection protocol being used
  var wuLogo = prot + "//icons.wxug.com/graphics/wu2/logo_130x80.png"; //logo to display on website. using hack since cannot store image locally
  var date = new Date();  //get current date
  var tempUnit = "F";

  var cache,
  cacheTime,
  hour,
  city,
  timeStamp,
  temp,
  conditions,
  weatherURL,
  conditionsIcon;


  $("#wu-logo").attr("src", wuLogo); //hack to set link to http or https to avoid errors

  //Set handler for weather button
  $("#weather").on("click", function(){
    getData();
  });

  getData(); //gets the ball rolling

  /*============================================================================================================
  START OF FUNCITON DECLARATIONS
  ==============================================================================================================*/

  //getData() : checks cache for weather data, and if not found, gets location and weather data
  function getData(){

    cache = getCache();
    timeStamp = sessionStorage.getItem('cacheTime');

    if(cache && (Date.now() - timeStamp) / (1000 * 60) < 1.0){ //to to see if there is a cache
                                                            // and that time since last refresh
      setWeather(cache);                                      // is less than 1 minute
    }
    else{

    date = new Date();
      getLoc(); //Try to get location from browser - gets app going
    }
  } //end of getData()

  //setCache(data) : sets the cache on sessionStorage using data from api call
  function setCache(data){
    //set time cache is set in 'cacheTime'
    sessionStorage.setItem('cacheTime', Date.now());
    //set cache
    sessionStorage.setItem('cache', JSON.stringify(data));
  }

  //getCache(): returns the cache
  function getCache(){
    return JSON.parse(sessionStorage.getItem('cache'));
  }
  //getLoc(): gets the current location and then calls getWeather with location data
  // Note: because geolocation no longer works from non https servers, must use fallback api for geolocation
  function getLoc(){
    navigator.geolocation.getCurrentPosition(success, error);
    function success(position){
      var lat = position.coords.latitude;
      var lon = position.coords.longitude;
      getWeather({lat: lat, lon: lon}); //function to get current weather conditions from Weather Underground using latitude and longitude
    }
    function error( error ){ //if we cannot use browser navigator, then look up service using ip lookup at Weather Underground
      getWeather();
    }
  } //end of getLoc()

  //setWeather(data) : takes data from api call and sets weather conditions on display
  function setWeather(data){
    city = data.current_observation.display_location.full;
    temp = data.current_observation.temp_f;
    conditions = data.current_observation.weather;
    weatherURL = data.current_observation.ob_url;
    conditionsIcon = prot + "//icons.wxug.com/i/c/f/" + data.current_observation.icon + ".gif";

    //set up the display using data from api call
    $("h1 a").attr("href", weatherURL);
    $("#city").text(city);
    $("#date").text(formatDate(date));
    $("#temp").text(temp);
    $("#conditions").text(conditions);
    $("#condition-icon").attr("src", conditionsIcon);

    //Set background color and font color according to sky cover and percipitation
    setMood(data.current_observation.icon, date);
  } // end of setWeather()

  //function to make api call to Weather Underground
  function getWeather(){
    var zzz = "2a437a96975257dc";
    var apiURL = prot + "//api.wunderground.com/api/" + zzz + "/conditions/q/";

    //if we recieved some arguments for lat & lon, we use them for the call
    if(arguments[0]){
      apiURL += arguments[0].lat + ","+ arguments[0].lon + ".json";
    }
    else{ /* If not, then use autoip look up service */
     apiURL += "autoip.json";
    }
    //ajax call to retrieve weather data using jsonp because of cross-server shenanigans
    // why couldn't WU have enabled CORS?  Why?
    var request = $.ajax({
      url: apiURL,
      dataType: "jsonp",
      success: handleRequest,
      jsonp: "callback"

    });

    //handle request once it is complete
    function handleRequest( data ){
      if( data ){
        setCache(data); //cache data
        setWeather(data); //send weather data to the view
      } //end of if(data)
      else{
        console.log("No Data!"); //This would be bad.
      }
    } //end of handleRequest()
  } //end of getWeather()

  //Set mood color scheme depending on weather conditions and day/night
  function setMood(conditionsIcon, date){
    hour = date.getHours();
    $("#container").removeClass(); //clear all classes
    if(hour >= 20 || hour <= 4){ //If night time
    $("#container").addClass("night"); //set to night
    switch(conditionsIcon){
      case "clear":
      case "cloudy":
      case "fog":
      case "hazy":
      case "mostlycloudy":
      case "partlycloudy":
      case "partlysunny":
        $("#container").addClass("clear");
        break;
      case "chancerain":
      case "chancesleet":
      case "sleet":
      case "rain":
        $("#container").addClass("rain");
        break;
      case "chancetstorms":
      case "tstorms":
        $("#container").addClass("lightning");
        break;
      case "chanceflurries":
      case "chancesnow":
      case "flurries":
      case "snow":
        $("#container").addClass("snow");
        break;
      default:
        $("#container").addClass("clear");
    } ////end switch statement with lovely fallthroughs (or not)
    } //end if
    else{
    switch(conditionsIcon){
      case "clear":
      case "partlycloudy":
      case "partlysunny":
         $("#container").addClass("day clear");
        break;
      case "cloudy":
      case "fog":
      case "hazy":
      case "mostlycloudy":
        $("#container").addClass("day-overcast clear");
        break;
      case "chancerain":
      case "chancesleet":
        $("#container").addClass("day-overcast rain");
        break;
      case "sleet":
      case "rain":
        $("#container").addClass("day-stormy rain");
        break;
      case "chancetstorms":
        $("#container").addClass("day-overcast lightning");
        break;
      case "tstorms":
        $("#container").addClass("day-stormy lightning");
        break;
      case "chanceflurries":
      case "chancesnow":
      case "flurries":
        $("#container").addClass("day-overcast snow");
        break;
      case "snow":
        $("#container").addClass("day-stormy snow");
        break;
      default:
        $("#container").addClass("day clear");
    } //end switch statement with lovely fallthroughs (or not)
    } //end else
  } //end of setMood()

  //hack to make my decimal places round out when converting between celsius and farenheit
  Number.prototype.round = function(places) {
    return +(Math.round(this + "e+" + places)  + "e-" + places);
  }

  //utility function to convert farenheit to celsius
  function convertToCelsius(temp){
    return ((temp - 32) / 1.8).round(1);
  }

  /*============================================================================================================
    INTERFACE COPONENTS
  ==============================================================================================================*/
  //click handler to convert betwen F and C
  $("#measure").on("click", function(){
    if(temp && tempUnit === "F"){
      $("#temp").text(convertToCelsius(temp));
      tempUnit = "C";
      $("#measure").text(" " + tempUnit);
      }
    else{
      $("#temp").text(temp);
      tempUnit = "F";
      $("#measure").text(" " + tempUnit);
    }
  });

  //Utility function for pretty formating of dates
  function formatDate(date){
    var m = date.getMonth();
    var d = date.getDay();
    var y = date.getFullYear();
    //var hour = date.getHours();
    //var minutes = date.getMinutes();
    //var oclock = "am";
    var t = date.toLocaleTimeString().toLowerCase();

    return m + "-" + d + "-" + y + " " + t;
  }

  function test(key){
    var url = 'https://query.yahooapis.com/v1/public/yql?format=json&q=';
    var statement = 'select * from weather.forecast where woeid=' + key;
    var url2 = url + 'select * from weather.forecast where woeid in (SELECT woeid FROM geo.places WHERE text="({42.107413},{-88.021074})")';
    /*var url = 'https://query.yahooapis.com/v1/public/yql?format=json&q=' +
        statement;*/


    $.getJSON(url2, function(data){
      console.log(data);
    });
  }
  test('2459115');

}); //end of $("document").ready
//# sourceURL=pen.js
