let map; // Global map instance
let markers = []; // Array to hold all markers
const customMarkerIconUrls = {
    default: '../static/default-bike1.png',
    freeBikes: '../static/free-bike.png',
    freeStands: '../static/stands.png',
    searched: '../static/search-result.png'
};

// Initialize the map and load static station data
function initMap() {
    const dublin = { lat: 53.349805, lng: -6.26031 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: dublin
    });
    fetchStaticStations();
}

// Fetch and display static station information
function fetchStaticStations() {
    fetch('/api/stations')
        .then(response => response.json())
        .then(data => displayStations(data.stations, 'default'))
        .catch(error => console.error('Error fetching static stations:', error));
}

// Update markers on the map based on the provided stations and status
function displayStations(stations, status) {
    clearMarkers();
    stations.forEach(station => {
    const iconUrl = determineIconUrl(station, status);
    const marker = new google.maps.Marker({
        position: { lat: station.position_lat, lng: station.position_long },
        map: map,
        title: station.name,
        icon: { url: iconUrl, scaledSize: new google.maps.Size(50, 50) },
        // 保存站点编号到标记中
        stationNumber: station.number
    });

    marker.addListener('click', () => showStationInfo(station));
    markers.push(marker);
    });
}

// 更新标记以反映动态信息
function updateStationMarkers(availabilities) {
    // 遍历可用性信息
    availabilities.forEach(availability => {
        // 查找对应站点编号的标记
        const markerToUpdate = markers.find(marker => marker.stationNumber === availability.number);
        if (markerToUpdate) {
            // 更新标记的图标或其他属性以反映可用性信息
            // 这里以图标为例，你可能需要根据可用自行车数量来选择图标
            const newIconUrl = availability.available_bikes > 0 ? customMarkerIconUrls.freeBikes : customMarkerIconUrls.default;
            markerToUpdate.setIcon({ url: newIconUrl, scaledSize: new google.maps.Size(50, 50) });
        }
    });
}


// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Show station information
function showStationInfo(station) {
    const stationInfoDiv = document.getElementById('stationInfo');
    stationInfoDiv.innerHTML = `
        <h4>${station.name}</h4>
        <p>Address: ${station.address}</p>
        <p>Bike Stands: ${station.bike_stands}</p>
        <p>Available Bikes: ${station.available_bikes || '...'}</p>`;
    stationInfoDiv.classList.remove('hidden');
}

// Determine icon URL based on station status
// Determine icon URL based on station status and availability
function determineIconUrl(station, status) {
    // For searched status, always use the searched icon
    if (status === 'searched') {
        return customMarkerIconUrls.searched;
    }

    // For dynamic status, decide based on availability
    if (status === 'dynamic' || status === 'default') {
        if (station.available_bikes > 0) {
            return customMarkerIconUrls.freeBikes;
        } else if (station.available_bike_stands > 0) {
            return customMarkerIconUrls.freeStands;
        }
    }

    // Use specific icons for freeBikes and freeStands status
    if (status === 'freeBikes' && station.available_bikes > 0) {
        return customMarkerIconUrls.freeBikes;
    }
    if (status === 'freeStands' && station.available_bike_stands > 0) {
        return customMarkerIconUrls.freeStands;
    }

    // Default icon for other cases
    return customMarkerIconUrls.default;
}


// Event listeners for dynamic information loading
document.getElementById('loadAvailabilities').addEventListener('click', fetchAvailabilities);
document.getElementById('free-bikes-btn').addEventListener('click', () => fetchAndDisplayStations('freeBikes'));
document.getElementById('free-stands-btn').addEventListener('click', () => fetchAndDisplayStations('freeStands'));
document.getElementById('searchButton').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchInput').value;
    if (searchTerm) fetchAndDisplayStations('searched', searchTerm);
});

// Fetch and display stations based on search or filter criteria
function fetchAndDisplayStations(status, searchTerm = '') {
    let url;
    if (status === 'freeBikes') {
        url = `/api/free-bikes`;
    } else if (status === 'freeStands') {
        url = `/api/free-stands`;
    } else if (status === 'searched') {
        url = `/api/search-stations?term=${encodeURIComponent(searchTerm)}`;
    } else {
        console.error('Unexpected status:', status);
        return;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            // 根据 API 返回的数据结构调整此处的代码
            displayStations(data.stations, status);
        })
        .catch(error => console.error(`Error fetching stations:`, error));
}


// Fetch dynamic station availability information
function fetchAvailabilities() {
    fetch('/api/availabilities')
        .then(response => response.json())
        .then(data => {
            // 确保这里是 data.availabilities
            updateStationMarkers(data.availabilities);
        })
        .catch(error => console.error('Error fetching availabilities:', error));
}

document.addEventListener('DOMContentLoaded', initMap);
