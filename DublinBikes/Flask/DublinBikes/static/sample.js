var map;
var centerMap;
var markers = [];
var stationsdata = [];
var selectedLocationMarker;
function fetchStationData() {
  return fetch("/stations")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Could not fetch station data: ", error);
      return []; // Ensure this catches and handles fetch errors
    });
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
  // Initialise map
  const { Map } = await google.maps.importLibrary("maps");
  map = new Map(document.getElementById("map"), mapOptions);
  fetchStationData()
    .then((data) => {
      stationsdata = data.stations;
    })
    .catch((error) => {
      console.error("Error loading station data:", error);
    });
  initAutocomplete();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        var marker = new google.maps.Marker({
          position: pos,
          map: map,
          title: "Your Location",
          icon: {
            url: "https://cdn-icons-png.flaticon.com/128/6735/6735939.png", // Example custom icon
            scaledSize: new google.maps.Size(40, 40), // Size in pixels
          },
          //   https://cdn-icons-png.flaticon.com/128/6735/6735939.png
        });
        map.setCenter(pos);
        loadStationCoordinates(stationsdata);
      },
      function () {
        handleLocationError(true, map.getCenter());
      }
    );
  } else {
    // Browser doesn't support Geolocation
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

    stationsdata.forEach((station) => {
      const stationLocation = new google.maps.LatLng(station.lat, station.lng);
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        selectedLocation,
        stationLocation
      );
      station.distance = Math.round(distance); // Add distance to the station object
    });

    // Sort stations by distance
    const sortedStations = stationsdata.sort((a, b) => a.distance - b.distance);

    // Select top 5 nearest stations
    const top5Stations = sortedStations.slice(0, 5);

    loadStationCoordinates(top5Stations);

    var stationList = document.getElementById("stationList");
    stationList.innerHTML = ""; // Clear current list

    top5Stations.forEach((station) => {
      var elem = document.createElement("div");
      elem.classList.add("card");
      elem.innerHTML = `<h4>${station.title}</h4>
                          <p>Bikes available: ${station.available_bikes}</p>
                          <p>Stands available: ${station.available_bike_stands}</p>
                          <p>Distance: ${station.distance} m</p>`;
      stationList.appendChild(elem);
    });

    // Open the panel
    openPanel();
  });
}
function openPanel() {
  document.getElementById("stationDetailsPanel").classList.add("open");
  document.querySelector(".content").classList.remove("fullwidth");
  document.querySelector(".content").classList.add("split");
}

function closePanel() {
  document.getElementById("stationDetailsPanel").classList.remove("open");
  document.querySelector(".content").classList.remove("split");
  document.querySelector(".content").classList.add("fullwidth");
  loadStationCoordinates(stationsdata);
  document.getElementById("autocomplete").value = "";
  if (selectedLocationMarker) {
    selectedLocationMarker.setMap(null);
  }
}

function loadStationCoordinates(stationsdata) {
  // Clear existing markers from the map
  markers.forEach((marker) => marker.setMap(null));
  markers = []; // Clear the array
  var infoWindow = new google.maps.InfoWindow();

  stationsdata.forEach((station) => {
    var marker = new google.maps.Marker({
      position: { lat: station.lat, lng: station.lng },
      map: map,
      title: station.name,
      icon: {
        url: "https://cdn-icons-png.flaticon.com/512/6984/6984914.png",
        scaledSize: new google.maps.Size(40, 40), // Size in pixels
      },
    });

    // Create the content for the InfoWindow
    const content = `<div class="container">
                          <h1>${station.number} ${station.title}</h1>
                          <div class="icons">
                              <span class="icon"> <img src="https://www.dublinbikes.ie/assets/icons/svg/velo-meca.svg" alt="Available Bikes" width="20px" height="20px"> ${station.available_bikes}</span>
                              <span class="icon"><img src="https://www.dublinbikes.ie/assets/icons/svg/filtre-map-places-dispos.svg" alt="Available Bikes" width="20px" height="20px"> ${station.available_bike_stands}</span>
                          </div>
                      </div>`;

    // Add mouseover event listener to show the InfoWindow
    marker.addListener("mouseover", () => {
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
    });

    // Add mouseout event listener to close the InfoWindow
    marker.addListener("mouseout", () => {
      infoWindow.close();
    });

    markers.push(marker);
  });

  // Adjust the map view to include all new markers
  if (markers.length) {
    let bounds = new google.maps.LatLngBounds();
    markers.forEach((marker) => bounds.extend(marker.getPosition()));
    map.fitBounds(bounds);
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
