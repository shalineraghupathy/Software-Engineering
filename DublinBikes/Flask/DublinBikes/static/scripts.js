var map;
var centerMap;
var markers = [];
var stationsData = [];
var selectedLocationMarker;
var infoWindow;
var userLoc = {};
var currentPolyline;
var displayType = "bikes";
var dateValue = null;
var timeValue = null;
var predictionsData = [];
var dateSelector;
var hourSelector;
var metaTag = document.createElement("meta");
metaTag.name = "viewport";
metaTag.content = "width=device-width, initial-scale=0.75";
document.getElementsByTagName("head")[0].appendChild(metaTag);

async function fetchStationData() {
  try {
    const response = await fetch("/stations");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    stationsData = data.stations || [];
  } catch (error) {
    console.error("Could not fetch station data: ", error);
    alert("Failed to load station data. Please try again later.");
  }
}

async function fetchPredictionData() {
  try {
    const response = await fetch("/predictions");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    predictionsData = data.predictions || [];
    // console.log(predictionsData);
  } catch (error) {
    console.error("Could not fetch prediction data: ", error);
    alert("Failed to load prediction data. Please try again later.");
  }
}

async function initMap() {
  centerMap = { lat: 53.3419077, lng: -6.2617028 };
  const mapOptions = {
    center: centerMap,
    zoom: 17,
    disableDefaultUI: true,
    styles: [
      {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [
          {
            saturation: 36,
          },
          {
            color: "#333333",
          },
          {
            lightness: 40,
          },
        ],
      },
      {
        featureType: "administrative",
        elementType: "labels",
        stylers: [
          {
            visibility: "off",
          },
        ],
      },
      {
        featureType: "administrative",
        elementType: "labels.text.fill",
        stylers: [
          {
            color: "#444444",
          },
        ],
      },
      {
        featureType: "all",
        elementType: "labels.text.stroke",
        stylers: [
          {
            visibility: "on",
          },
          {
            color: "#ffffff",
          },
          {
            lightness: 16,
          },
        ],
      },
      {
        featureType: "all",
        elementType: "labels.icon",
        stylers: [
          {
            visibility: "off",
          },
        ],
      },
      {
        featureType: "administrative",
        elementType: "geometry.fill",
        stylers: [
          {
            color: "#fefefe",
          },
          {
            lightness: 20,
          },
        ],
      },
      {
        featureType: "administrative",
        elementType: "geometry.stroke",
        stylers: [
          {
            color: "#fefefe",
          },
          {
            lightness: 17,
          },
          {
            weight: 1.2,
          },
        ],
      },
      {
        featureType: "administrative.locality",
        elementType: "labels.icon",
        stylers: [
          {
            color: "#bd081c",
          },
        ],
      },
      {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [
          {
            color: "#f5f5f5",
          },
          {
            lightness: 20,
          },
        ],
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [
          {
            color: "#f5f5f5",
          },
          {
            lightness: 21,
          },
        ],
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [
          {
            color: "#dedede",
          },
          {
            lightness: 21,
          },
        ],
      },
      {
        featureType: "road.highway",
        elementType: "geometry.fill",
        stylers: [
          {
            color: "#ffffff",
          },
          {
            lightness: 17,
          },
        ],
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [
          {
            color: "#ffffff",
          },
          {
            lightness: 29,
          },
          {
            weight: 0.2,
          },
        ],
      },
      {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [
          {
            color: "#ffffff",
          },
          {
            lightness: 18,
          },
        ],
      },
      {
        featureType: "road.local",
        elementType: "geometry",
        stylers: [
          {
            color: "#ffffff",
          },
          {
            lightness: 16,
          },
        ],
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [
          {
            color: "#f2f2f2",
          },
          {
            lightness: 19,
          },
        ],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [
          {
            color: "#e9e9e9",
          },
          {
            lightness: 17,
          },
        ],
      },
    ],
  };

  const { Map } = await google.maps.importLibrary("maps");
  map = new Map(document.getElementById("map"), mapOptions);
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);
  infoWindow = new google.maps.InfoWindow();

  await fetchStationData();
  await fetchPredictionData();
  initAutocomplete();
  filterPredictionsByDate;
  handleUserLocation();
  getWeather();
  loadForecast();
  // loadStationCoordinates(stationsData);
}

function handleUserLocation() {
  userLoc = {
    lat: 53.3452147,
    lng: -6.2600541,
  };

  var marker = new google.maps.Marker({
    position: userLoc,
    map: map,
    title: "Your Location",
    icon: {
      url: "https://cdn-icons-png.flaticon.com/128/6735/6735939.png",
      scaledSize: new google.maps.Size(40, 40),
    },
  });
  map.setCenter(userLoc);
  loadStationCoordinates(stationsData);
}

// function handleUserLocation() {
//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         userLoc = {
//           lat: position.coords.latitude,
//           lng: position.coords.longitude,
//         };

//         var marker = new google.maps.Marker({
//           position: userLoc,
//           map: map,
//           title: "Your Location",
//           icon: {
//             url: "https://cdn-icons-png.flaticon.com/128/6735/6735939.png",
//             scaledSize: new google.maps.Size(40, 40),
//           },
//         });
//         map.setCenter(userLoc);
//         loadStationCoordinates(stationsData);
//       },
//       () => {
//         handleLocationError(true, map.getCenter());
//       }
//     );
//   } else {
//     handleLocationError(false, map.getCenter());
//   }
// }

function initAutocomplete() {
  var input = document.getElementById("autocomplete");
  var autocomplete = new google.maps.places.Autocomplete(input);

  autocomplete.addListener("place_changed", async function () {
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }

    var selectedLocation = place.geometry.location;
    if (selectedLocationMarker) {
      selectedLocationMarker.setMap(null);
    }

    // Create a new marker at the selected location
    selectedLocationMarker = new google.maps.Marker({
      position: selectedLocation,
      map: map,
      title: place.name,
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        scaledSize: new google.maps.Size(40, 40),
      },
    });

    stationsData.forEach((station) => {
      const stationLocation = new google.maps.LatLng(station.lat, station.lng);
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        selectedLocation,
        stationLocation
      );
      station.distance = Math.round(distance);
    });

    // Sort stations by distance
    const sortedStations = stationsData.sort((a, b) => a.distance - b.distance);

    // Select top 5 nearest stations
    const top5Stations = sortedStations.slice(0, 5);

    loadStationCoordinates(top5Stations);
    updateSlidePanel(top5Stations, "searchResults");
    openPanel();
  });
}

function loadStationCoordinates(data) {
  // console.log(data);
  clearMarkers();
  data.forEach((station) => {
    const marker = createMarkerForStation(station, displayType);
    setupMarkerInfoWindow(marker, station);
    markers.push(marker);
  });
  adjustMapViewToFitMarkers();
}

function createMarkerForStation(station, type) {
  var displayText;
  if (type == "bikes") {
    displayText = station.available_bikes;
  } else {
    displayText = station.available_bike_stands;
  }

  let svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 38">
  <defs>
    <style>
      .cls-1{fill:#fff;}
      .cls-2{fill:#527D84;}
      .cls-3{fill:#c2c2c2;}
      .cls-4{font-size:14px; font-family:Arial, sans-serif; fill:#fff; font-weight:250;} 
    </style>
    </defs>
    <g id="offre-abo-on">
      <path class="cls-1" d="M29.93,14.93C29.93,27.14,15,38,15,38S.07,27.14.07,14.93a14.93,14.93,0,0,1,29.86,0Z"/>
      <path d="M15,2A12.94,12.94,0,0,1,27.93,14.93c0,9.12-9.54,17.75-12.93,20.53C11.61,32.69,2.07,24.08,2.07,14.93A12.94,12.94,0,0,1,15,2m0-2A14.93,14.93,0,0,0,.07,14.93C.07,27.14,15,38,15,38S29.93,27.14,29.93,14.93A14.93,14.93,0,0,0,15,0Z"/>
      <path class="cls-2" d="M15,24.61a10,10,0,1,1,10-10A10,10,0,0,1,15,24.61Z"/>
      <path class="cls-3" d="M15,5.07a9.52,9.52,0,1,1-9.52,9.52A9.53,9.53,0,0,1,15,5.07m0-1A10.52,10.52,0,1,0,25.52,14.59,10.52,10.52,0,0,0,15,4.07Z"/>
      <text class="cls-4" x="50%" y="42%" dominant-baseline="middle" text-anchor="middle">${displayText}</text>
      </g>
      </svg>`;

  // fff 0097d1 c2c2c2
  // 333 ffffff ffffff

  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  // Create and return the marker with the dynamically generated SVG icon
  return new google.maps.Marker({
    position: { lat: station.lat, lng: station.lng },
    map: map,
    title: station.name,
    icon: {
      url: url,
      scaledSize: new google.maps.Size(45, 35),
    },
  });
}
function getWeather() {
  var city = "Dublin";
  var country = "IE";
  fetch(`/weather?city=${city}&country=${country}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        document.getElementById("weatherResult").textContent = data.error;
      } else {
        console.log(data);
        document.getElementById(
          "weatherIcon"
        ).src = `https://openweathermap.org/img/w/${data.weather[0].icon}.png`;
        document.getElementById("temperature").textContent =
          (data.main.temp - 273.15).toFixed(0) + " °C";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("weatherResult").textContent =
        "Error fetching data";
    });
}

function loadForecast() {
  var city = "Dublin";
  var country = "IE";
  var url = `/forecast?city=${city}&country=${country}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.list) {
        var forecastContainer = document.getElementById("weather-forecast");
        forecastContainer.innerHTML = ""; // Clear previous content

        data.list.forEach(function (day) {
          var date = new Date(day.dt * 1000);
          var dateString = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          var main = day.weather[0].main;
          var iconCode = day.weather[0].icon;
          var tempCelsius = (day.temp.day - 273.15).toFixed(0);
          var iconUrl = `https://openweathermap.org/img/w/${iconCode}.png`;

          var dayForecastDiv = document.createElement("div");
          dayForecastDiv.className = "day-forecast";
          dayForecastDiv.innerHTML = `
                      <h6 class="fore-date">${dateString}</h6>
                      <img src="${iconUrl}" alt="Weather icon" class="weather-icon">
                      <h6 class="fore-tmp">${tempCelsius} °C</h6>
                  `;

          forecastContainer.appendChild(dayForecastDiv);
        });
      } else {
        console.error("No forecast data received");
      }
    })
    .catch((error) => console.error("Fetching weather data failed", error));
}

function updateSlidePanel(data, type) {
  const stationList = document.getElementById("stationList");
  stationList.innerHTML = ""; // Clear the existing content

  if (type === "stationDetails") {
    addStationDetailsCard(data, stationList);
    addDateTimeSelectors(data, stationList);
  } else if (type === "searchResults") {
    data.forEach((station) => addStationCard(station, stationList));
  }
}

function addStationDetailsCard(data, container) {
  const directionsButtonHTML = `<button onclick="getDirections(${data.lat}, ${data.lng})" style="border:none; background-color:transparent;" class="get-directions">
      <img src="https://www.svgrepo.com/show/351956/directions.svg" alt="Directions" width="20px" height="20px">
  </button>`;

  const stationCardHTML = `<div class="card">
      <h5>${data.title}</h5>
      <div class="icons">
          <span class="icon"><img src="https://www.dublinbikes.ie/assets/icons/svg/velo-meca.svg" alt="Available Bikes" width="30px" height="30px"> ${data.available_bikes}</span>
          <span class="icon"><img src="https://www.dublinbikes.ie/assets/icons/svg/filtre-map-places-dispos.svg" alt="Available Spaces" width="30px" height="30px"> ${data.available_bike_stands}</span>
          ${directionsButtonHTML}
      </div>
  </div>`;

  const cardElement = document.createElement("div");
  cardElement.innerHTML = stationCardHTML;
  container.appendChild(cardElement);
}

function addStationCard(station, container) {
  const cardHTML = `<div class="card">
      <h5>${station.title}</h5>
      <div class="icons">
          <span class="icon"><img src="https://www.dublinbikes.ie/assets/icons/svg/velo-meca.svg" alt="Available Bikes" width="30px" height="30px">${station.available_bikes}</span>
          <span class="icon"><img src="https://www.dublinbikes.ie/assets/icons/svg/filtre-map-places-dispos.svg" alt="Available Spaces" width="30px" height="30px">${station.available_bike_stands}</span>
          <button onclick="getDirections(${station.lat}, ${station.lng})" style="border:none; background-color:transparent;" class="get-directions">
              <img src="https://www.svgrepo.com/show/351956/directions.svg" alt="Directions" width="20px" height="20px">
          </button>
      </div>
  </div>`;

  const elem = document.createElement("div");
  elem.innerHTML = cardHTML;
  container.appendChild(elem);
}

function setupMarkerInfoWindow(marker, station) {
  marker.addListener("mouseover", () => {
    const content = `<div class="container">
                          <h4>${station.number} ${station.title}</h4>
                          <div class="icons">
                              <span class="icon"> <img src="https://www.dublinbikes.ie/assets/icons/svg/velo-meca.svg" alt="Available Bikes" width="20px" height="20px"> ${station.available_bikes}</span>
                              <span class="icon"><img src="https://www.dublinbikes.ie/assets/icons/svg/filtre-map-places-dispos.svg" alt="Available Bikes" width="20px" height="20px"> ${station.available_bike_stands}</span>
                          </div>
                      </div>`;
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
  });
  marker.addListener("click", () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
    }
    updateSlidePanel(station, "stationDetails");
    openPanel();
  });
}
function getDirections(destLat, destLng) {
  var start = new google.maps.LatLng(userLoc.lat, userLoc.lng);
  var end = new google.maps.LatLng(destLat, destLng);
  var request = {
    origin: start,
    destination: end,
    travelMode: "DRIVING", // Change as required
  };
  if (directionsRenderer) {
    directionsRenderer.setDirections({ routes: [] });
  }
  directionsService.route(request, function (result, status) {
    if (status === "OK") {
      directionsRenderer.setDirections(result);
    }
  });
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
}

function adjustMapViewToFitMarkers() {
  if (!markers.length) return;
  const bounds = new google.maps.LatLngBounds();
  markers.forEach((marker) => bounds.extend(marker.getPosition()));
  map.fitBounds(bounds);
}

function openPanel() {
  document.getElementById("stationDetailsPanel").classList.add("open");
  document.querySelector(".content").classList.remove("fullwidth");
  document.querySelector(".content").classList.add("split");
}
function closePanel() {
  if (directionsRenderer) {
    directionsRenderer.setDirections({ routes: [] });
  }
  // if (currentPolyline) {
  //   currentPolyline.setMap(null);
  // }
  document.getElementById("stationDetailsPanel").classList.remove("open");
  document.querySelector(".content").classList.remove("split");
  document.querySelector(".content").classList.add("fullwidth");
  loadStationCoordinates(stationsData);
  document.getElementById("autocomplete").value = "";
  if (selectedLocationMarker) {
    selectedLocationMarker.setMap(null);
  }
}

function handleLocationError(browserHasGeolocation, pos) {
  var infoWindow = new google.maps.InfoWindow();
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

document.getElementById("filter-bikes").addEventListener("click", function () {
  updateMarkers("bikes");
  setActiveButton(this);
});

document.getElementById("filter-spaces").addEventListener("click", function () {
  updateMarkers("spaces");
  setActiveButton(this);
});

function updateMarkers(type) {
  removeMarkers();
  displayType = type;
  stationsData.forEach((station) => {
    const marker = createMarkerForStation(station, displayType);
    setupMarkerInfoWindow(marker, station);
    markers.push(marker);
  });
}
function removeMarkers() {
  markers.forEach((marker) => {
    // Fade out effect
    let opacity = 1.0;
    let interval = setInterval(() => {
      if (opacity <= 0.1) {
        clearInterval(interval);
        marker.setMap(null);
      } else {
        opacity -= 0.1;
        marker.setOpacity(opacity);
      }
    }, 50);
  });
  markers = [];
}
function setActiveButton(selectedButton) {
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.remove("active");
  });

  selectedButton.classList.add("active");
}

function addDateTimeSelectors(station, container) {
  dateSelector = document.createElement("select");
  dateSelector.id = "dateSelector";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a date";
  defaultOption.selected = true;
  defaultOption.disabled = true;
  dateSelector.appendChild(defaultOption);

  predictionsData
    .map((p) => p.date)
    .forEach((date) => {
      if (!dateSelector.querySelector(`option[value="${date}"]`)) {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = `Date: ${date}`;
        dateSelector.appendChild(option);
      }
    });
  var lineBreak = document.createElement("br");

  hourSelector = document.createElement("select");
  hourSelector.id = "hourSelector";
  hourSelector.style.display = "none";

  dateSelector.addEventListener("change", () => {
    populateHourOptions(hourSelector, dateSelector.value);
    hourSelector.style.display = "block";
  });

  hourSelector.addEventListener("change", () => {
    updatePredictionDetails(station, container);
    updateChart(station, container);
  });

  const pickerDiv = document.createElement("div");
  pickerDiv.classList.add("date-time-picker");
  pickerDiv.appendChild(dateSelector);
  pickerDiv.appendChild(lineBreak);
  pickerDiv.appendChild(hourSelector);

  populateHourOptions(hourSelector, dateSelector.value);
  container.appendChild(pickerDiv);
}

function populateHourOptions(hourSelector, selectedDate) {
  const hours = predictionsData
    .filter((p) => p.date === selectedDate)
    .map((p) => p.hour);

  // Create a set from the hours array to ensure all values are unique
  const uniqueHours = Array.from(new Set(hours));

  hourSelector.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select Time";
  defaultOption.selected = true;
  defaultOption.disabled = true;
  hourSelector.appendChild(defaultOption);

  // Use uniqueHours here instead of hours
  uniqueHours.forEach((hour) => {
    const option = document.createElement("option");
    option.value = hour;
    option.textContent = `Time: ${hour}:00`;
    hourSelector.appendChild(option);
  });
}

function filterPredictionsByDate() {
  // Assuming you have a function to filter data based on selected date and time
  console.log(
    "Filtering predictions for date:",
    dateValue,
    "and time:",
    timeValue
  );
  const filteredPredictions = predictionsData.filter(
    (p) => p.date === dateValue && p.time === timeValue
  );
  console.log(filteredPredictions); // Display or process filtered predictions
}

function updatePredictionDetails(station, container) {
  const selectedDate = dateSelector.value;
  const selectedHour = hourSelector.value;

  const prediction = predictionsData.find(
    (p) =>
      p.station_number === station.number &&
      p.date === selectedDate &&
      p.hour === parseInt(selectedHour)
  );

  let resultsContainer = document.getElementById("predictionResults");
  let chartContainer = document.getElementById("predictionChart");

  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.id = "predictionResults";
    document.body.appendChild(resultsContainer);
  }
  if (!chartContainer) {
    chartContainer = document.createElement("div");
    chartContainer.id = "predictionChart";
    document.body.appendChild(chartContainer);
  }

  if (prediction) {
    const content = ` <h5>Predicted Availability</h5>
                         <p>Bikes: ${prediction.predicted_bikes}</p>
                         <p>Stands: ${prediction.predicted_stands}</p>`;
    resultsContainer.innerHTML = content;
  } else {
    resultsContainer.innerHTML = "<p>No prediction data available.</p>";
  }
  if (prediction) {
    const content = ` <canvas id="standsChart"></canvas>`;
    chartContainer.innerHTML = content;
  } else {
    chartContainer.innerHTML = "<p>No prediction data available.</p>";
  }

  container.appendChild(resultsContainer);
  container.appendChild(chartContainer);
}

function updateChart(station, container) {
  const selectedStation = station.number;
  const selectedDate = dateSelector.value;
  const filteredData = predictionsData.filter(
    (item) =>
      item.station_number == selectedStation && item.date == selectedDate
  );

  const ctx = document.getElementById("standsChart").getContext("2d");
  const labels = filteredData.map((item) => `${item.hour}:00`);
  const data = filteredData.map((item) => item.predicted_stands);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Predicted Stands",
          data: data,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
