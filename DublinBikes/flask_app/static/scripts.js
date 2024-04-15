var map;
var centerMap;
var markers = [];
var stationsData = [];
var selectedLocationMarker;
var infoWindow;
var userLoc = {};
var currentPolyline;

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
    alert("Failed to load station data. Please try again later."); // Provide feedback
  }
}

async function initMap() {
  centerMap = { lat: 53.3419077, lng: -6.2617028 };
  const mapOptions = {
    center: centerMap,
    zoom: 14,
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
  initAutocomplete();
  handleUserLocation();
}

function handleUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        var marker = new google.maps.Marker({
          position: userLoc,
          map: map,
          title: "Your Location",
          icon: {
            url: "https://cdn-icons-png.flaticon.com/128/6735/6735939.png", // Example custom icon
            scaledSize: new google.maps.Size(40, 40), // Size in pixels
          },
          //   https://cdn-icons-png.flaticon.com/128/6735/6735939.png
        });

        map.setCenter(userLoc);
        loadStationCoordinates(stationsData);
      },
      () => {
        handleLocationError(true, map.getCenter());
      }
    );
  } else {
    handleLocationError(false, map.getCenter());
  }
}

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
      station.distance = Math.round(distance); // Add distance to the station object
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
  console.log(data);
  clearMarkers();
  data.forEach((station) => {
    const marker = createMarkerForStation(station);
    setupMarkerInfoWindow(marker, station);
    markers.push(marker);
  });
  adjustMapViewToFitMarkers();
}

function createMarkerForStation(station) {
  // Updated SVG content with styled text to fit the inner circle
  let svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 38">
      <defs>
          <style>
              .cls-1{fill:#333;} /* Outer marker color */
              .cls-2{fill:#ffffff;} /* Main circle color */
              .cls-3{fill:#ffffff;} /* Inner circle color */
              .cls-4{font-size:16px; font-family:Arial, sans-serif; fill:#333; font-weight:300;} /* Updated text styling for visibility */
          </style>
      </defs>
      <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
              <path class="cls-1" d="M29.93,14.93C29.93,27.14,15,38,15,38S.07,27.14.07,14.93a14.93,14.93,0,0,1,29.86,0Z"/>
              <path class="cls-2" d="M15,24.61a10,10,0,1,1,10-10A10,10,0,0,1,15,24.61Z"/>
              <path class="cls-3" d="M15,5.07a9.52,9.52,0,1,1-9.52,9.52A9.53,9.53,0,0,1,15,5.07m0-1A10.52,10.52,0,1,0,25.52,14.59,10.52,10.52,0,0,0,15,4.07Z"/>
              <text class="cls-4" x="50%" y="42%" dominant-baseline="middle" text-anchor="middle">${station.available_bikes}</text>
          </g>
      </g>
  </svg>`;

  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  // Create and return the marker with the dynamically generated SVG icon
  return new google.maps.Marker({
    position: { lat: station.lat, lng: station.lng },
    map: map,
    title: station.name,
    icon: {
      url: url,
      scaledSize: new google.maps.Size(45, 45),
    },
  });
}
            // `<p>Predicted Bikes at ${p.hour}:00 on ${p.date}: ${p.predicted_bikes}, Predicted Stands: ${p.predicted_stands}</p>`
function updateSlidePanel(data, type) {
    var stationList = document.getElementById("stationList");
    stationList.innerHTML = "";  // Clear current content

    if (type === "stationDetails") {
        // Fetch predictions from the global variable `predictionsData`
        var predictions = predictionsData.filter(p => p.station_number === data.number);
        var predictionInfo = predictions.map(p =>
            `<tr style="background-color: #f9f9f9">
                  <td style="width: 30%">${p.date}</td>
                  <td>${p.hour}:00</td>
                  <td style="text-align: center">${p.predicted_bikes}</td>
                  <td style="text-align: center">${p.predicted_stands}</td>
              </tr>`
        ).join('');

        var elem = document.createElement("div");
        elem.classList.add("card");
        elem.innerHTML = `<h4>${data.title}</h4>
                          <p>Bikes available: ${data.available_bikes}</p>
                          <p>Stands available: ${data.available_bike_stands}</p>
                          <p>Status: ${data.status}</p>
                          <table>
                            <thead>
                                <tr>
                                    <th style="width: 30%">Date</th>
                                    <th>Hour</th>
                                    <th>Predicted Bikes</th>
                                    <th>Predicted Stands</th>
                                </tr>
                            </thead> 
                            <tbody>
                                ${predictionInfo}
                            </tbody>
                          </table>
                          <button onclick="getDirections(${data.lat}, ${data.lng})">Get Directions</button>`;
        stationList.appendChild(elem);
    } else if (type === "searchResults") {
        data.forEach((station) => {
            var predictions = predictionsData.filter(p => p.station_number === station.number);
            var predictionInfo = predictions.map(p =>
                `<p>Predicted Bikes at ${p.hour}:00 on ${p.date}: ${p.predicted_bikes}, Predicted Stands: ${p.predicted_stands}</p>`
            ).join('');

            var elem = document.createElement("div");
            elem.classList.add("card");
            elem.innerHTML = `<h4>${station.title}</h4>
                              <p>Bikes available: ${station.available_bikes}</p>
                              <p>Stands available: ${station.available_bike_stands}</p>
                              <p>Distance: ${station.distance} m</p>
                              ${predictionInfo}`;  // Include prediction info in each card
            stationList.appendChild(elem);
        });
    }
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

// function getDirections(destLat, destLng) {
//   var start = new google.maps.LatLng(userLoc.lat, userLoc.lng);
//   var end = new google.maps.LatLng(destLat, destLng);
//   var request = {
//     origin: start,
//     destination: end,
//     travelMode: "DRIVING", // Change as required
//   };

//   directionsService.route(request, function (result, status) {
//     if (status === "OK") {
//       // Clear previous route
//       if (currentPolyline) {
//         currentPolyline.setMap(null);
//       }

//       // Create a new polyline for the route
//       var routePath = new google.maps.Polyline({
//         path: result.routes[0].overview_path,
//         geodesic: true,
//         strokeColor: "#000000", // Here you can set the color to black
//         strokeOpacity: 1.0,
//         strokeWeight: 2,
//       });

//       routePath.setMap(map);
//       currentPolyline = routePath; // Store it if you need to clear it later
//     } else {
//       window.alert("Directions request failed due to " + status);
//     }
//   });
// }

// function updatePanelContent(station) {
//   var stationList = document.getElementById("stationList");
//   stationList.innerHTML = ""; // Clear current content
//   var elem = document.createElement("div");
//   elem.classList.add("card");
//   elem.innerHTML = `<h4>${station.title}</h4>
//                     <p>Bikes available: ${station.available_bikes}</p>
//                     <p>Stands available: ${station.available_bike_stands}</p>
//                     <p>Status: ${station.status}</p>`; // Add more details as needed
//   stationList.appendChild(elem);
// }

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

async function fetchPredictionData() {
    try {
        const response = await fetch("/predictions");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.predictions || [];
    } catch (error) {
        console.error("Could not fetch prediction data: ", error);
        alert("Failed to load prediction data. Please try again later.");
    }
}

// call this function somewhere in your code to load the data
var predictionsData = [];

async function initialize() {
    try {
        predictionsData = await fetchPredictionData();
        await initMap();
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

initialize(); // Call the function to execute the setup

