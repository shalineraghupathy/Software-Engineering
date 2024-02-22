'use strict';//to enable the use of let
google.charts.load('current', {'packages':['corechart']});
google.charts.load('current', {'packages':['bar']});
var markerMap=new Map();
var stationInfo=new Map();
var infowindow;
var map;
var weekday=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
var weekday2=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
var currentDay;
var hourlyChart;
var dailyChart;
var predictionChart;
var predictionData;
google.charts.setOnLoadCallback(function () {
  hourlyChart = new google.charts.Bar(document.getElementById('hourly-chart'));
  dailyChart=new google.charts.Bar(document.getElementById('daily-chart'));
  predictionChart=new google.charts.Bar(document.getElementById('prediction-chart'));
});
function initMap (){
  infowindow = new google.maps.InfoWindow();
  let myLatLng = {lat: 53.350140, lng: -6.266155};//set the latitude and longitude to Dublin
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: myLatLng,
  });

  //Display Cycle Routes on Map
  const bikeLayer = new google.maps.BicyclingLayer();
    bikeLayer.setMap(map);

  //Geolocation Feature on Map
  let geolocation = new google.maps.InfoWindow();
  const locationButton = document.createElement("button");
  locationButton.textContent = "Pan to Current Location";
  locationButton.type="button";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

  locationButton.addEventListener("click", () => {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          geolocation.setPosition(pos);
          geolocation.setContent("You are here!");
          geolocation.open(map);
          map.setCenter(pos);
        },
        () => {
          handleLocationError(true, geolocation, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, geolocation, map.getCenter());
    }
  });

  //Display Markers on Map
  axios.get('/api/stations/').then(response=>{
    var stations=response.data.data;
    stations.forEach(station=>{
    var scale=getSize(station.available_bike);
    var color=getColor(station.available_bike);
    var marker=new google.maps.Marker({
    position:{lat:station.latitude,lng: station.longitude},
    map:map,
    icon:`https://chart.apis.google.com/chart?chst=d_map_spin&chld=${scale}|0|${color}|11|_|${station.available_bike}`
  });
    markerMap.set(station.number,marker);
    stationInfo.set(station.number,station);
    marker.addListener("click",()=>clickEvent(station.number));
    generateMenu(stations);
    });
  }).catch(error=>{
    console.log(error);
  });
}

//Click event for the marker on our map
function clickEvent(id){
  showStatic(id);
  showHourly(id);
  showDaily(id);
  showPrediction(id);
  showWeather(id);
}

//Show static information about the station
function showStatic(id){
  var station=stationInfo.get(id);
  var marker=markerMap.get(id);
  var content=`
  <h6>Station Information</h6>
  <ul>
  <li>Station Number: ${station.number}</li>
  <li>Station Address: ${station.address}</li>
  <li>Available bikes: ${station.available_bike}</li>
  <li>Free stands: ${station.available_bike_stand}</li>
  <li>Total capacity: ${station.bike_stand}</li>
</ul>
  `;
  infowindow.setContent(content);
  infowindow.open(map,marker);
}

//Create average hourly availability bike number chart
function createHourlyChart(title,chart_data,output_chart){
  try{
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Hour of Day');
    data.addColumn('number','available bikes');
      chart_data.forEach(hourlydata=>{
        data.addRow([hourlydata.hour.toString(),hourlydata.available_bike]);
      });
      var options = {
        title: title,
        width:800,
        colors: ['#074b54'],
        legend: {position: 'none'},
        hAxis: {
          title: 'Hour of day',
          showTextEvery: 1
        },
        vAxis: {
          title: 'available bikes'
        }
      };
      // var hourlyChart = new google.charts.Bar(document.getElementById(elementId));
      output_chart.draw(data, options);
  }catch(error){
    console.log(error);
  }
}

//Show average hourly availability bike number
function showHourly(id){
  axios.get('/api/hour/'+id).then(response=>{
    createHourlyChart('Hourly availability data',response.data,hourlyChart)
  }).catch(error=>{
    console.log(error);
  });
}

//Show average daily availability bike number
function showDaily(id){
  axios.get('/api/day/'+id).then(response=>{
    var data = new google.visualization.DataTable();
      data.addColumn('string', 'Day of Week');
      data.addColumn('number','available bikes');
      response.data.forEach(dailydata=>{
        data.addRow([weekday[dailydata.day],dailydata.available_bike]);
      });
      var options = {
        title: 'Daily availability data',
        width:1000,
        legend: {position: 'none'},
        colors: ['#074b54'],
        hAxis: {
          title: 'day of week',
          showTextEvery: 1
        },
        vAxis: {
          title: 'average number'
        }
      };
      var dailyChart = new google.charts.Bar(document.getElementById('daily-chart'));
      dailyChart.draw(data, options);
  }).catch(error=>{
    console.log(error);
  });
}

//Show hourly prediction chart for the following 5 days
function showPrediction(id){
  currentDay=0;
  document.getElementById('preButton').innerHTML='';
  document.getElementById('nextButton').innerHTML='<button onclick="nextButtonClick()">Next Day</button>';
  axios.get('/api/prediction/'+id).then(response=>{
    predictionData=response.data;
    document.getElementById('prediction-title').innerHTML=weekday[predictionData[currentDay][0].date];
      createHourlyChart(weekday[predictionData[0][0].date],predictionData[0],predictionChart);
      }
  )
}

//Click event for next button
function nextButtonClick(){
  currentDay+=1;
  reloadPredictionChart();
}

//click event for previous button
function preButtonClick(){
  currentDay-=1;
  reloadPredictionChart();
}

//Reload the prediction chart after clicking a button
function reloadPredictionChart(){
  if(currentDay==0){
    document.getElementById('preButton').innerHTML='';
  }
  else if(currentDay==predictionData.length-1){
    document.getElementById('nextButton').innerHTML='';
  }
  else{
    document.getElementById('preButton').innerHTML='<button onclick="preButtonClick()">Prev Day</button>';
    document.getElementById('nextButton').innerHTML='<button onclick="nextButtonClick()">Next Day</button>';
  }
  document.getElementById('prediction-title').innerHTML=weekday[predictionData[currentDay][0].date];
  createHourlyChart(weekday[predictionData[0][0].date],predictionData[currentDay],predictionChart);
}

//Customizing the scale, color and the number shown on the marker
function displayMarker(sign){
    markerMap.forEach(function(value, key){
        var station=stationInfo.get(key);
        var num=sign==0?station.available_bike:station.available_bike_stand;
        var scale=getSize(num);
        var color=getColor(num);
        value.setIcon(`https://chart.apis.google.com/chart?chst=d_map_spin&chld=${scale}|0|${color}|11|_|${num}`)
    })
}

//return the size of the marker
function getSize(num){
    if(num>20){
    return 0.75
  }
  else{
    return 0.5
  }
}

//return the color of the marker
function getColor(num){
  if(num>5){
    return "2E8B57"
  }
  else{
    return "F00000"
  }
}

function handleLocationError(browserHasGeolocation, geolocation, pos) {
  geolocation.setPosition(pos);
  geolocation.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  geolocation.open(map);
}

//Show weather information of the following 5 days
function showWeather(id){
  axios.get('/api/weather/'+id).then(response=>{
    var ret=``;
    var i=0;
    var day;
    for(let dailydata of response.data){
      if(i==6) break;
      var a = new Date(dailydata.dt*1000);
      day=weekday2[a.getDay()];
      if(i==0) day='Today'
      ret+=`
      <div class="col-2">
            <h5>${day}</h5>
            <img src="${iconGenerator(dailydata.weather[0].icon)}">
            <div class="row">
                <div class="col-6">
                ${dailydata.temp.day}°
                </div>
                <div class="col-6">
                    ${dailydata.weather[0].main}
                </div>
            </div>
        </div> 
      `;
    i++;
    }
      document.getElementById('weather').innerHTML=ret;
    }).catch(error=>{
    console.log(error);
  });
}

//Return the corresponding weather icon
function iconGenerator(id){
  return 'http://openweathermap.org/img/wn/'+id+'@2x.png';
}

function generateMenu(stations){
  var content=``;
  content+=`<div class="dropdown">
  <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenu2" data-bs-toggle="dropdown" aria-expanded="false">
    Select Bike Station
  </button>
  <ul class="dropdown-menu" aria-labelledby="dropdownMenu2">`;
  stations.forEach(station=>{
    content+=`<li><button class="dropdown-item" type="button" onclick="clickEvent(${station.number})">${station.address}</button></li>`;
  });
  content+=`</ul></div>`;
  document.getElementById("dropdown-menu").innerHTML=content;
}