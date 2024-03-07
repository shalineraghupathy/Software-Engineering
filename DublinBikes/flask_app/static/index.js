let map; // 全局地图实例
let markers = []; // 保存所有标记的数组
let isFilteredView = false; // 标记是否处于过滤视图

function initMap() {
    var dublin = { lat: 53.349805, lng: -6.26031 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: dublin,
    });

    // 初始化地图时加载所有站点
    fetchStationsAndAddMarkers('');
}

function fetchStationsAndAddMarkers(searchTerm) {
    let url = '/api/search-stations?term=';
    if (searchTerm) {
        url += encodeURIComponent(searchTerm);
    }
    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayStations(data.stations);
        })
        .catch(error => console.error('Error fetching stations:', error));
}

function displayStations(stations) {
    clearMarkers(); // 清除现有的所有标记
    stations.forEach(station => {
        const marker = new google.maps.Marker({
            position: { lat: station.position_lat, lng: station.position_long },
            map: map,
            title: station.name,
        });

        // 为每个标记添加点击事件，以显示站点详细信息
        marker.addListener('click', () => {
            showStationInfo(station);
        });

        markers.push(marker); // 将标记添加到数组中
    });

    isFilteredView = false; // 重置过滤视图状态
}

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

function showStationInfo(station) {
    var stationInfoDiv = document.getElementById('stationInfo');
    stationInfoDiv.innerHTML = `
        <h4>${station.name}</h4>
        <p>Address: ${station.address}</p>
        <p>Bike Stands: ${station.bike_stands}</p>
        <p>Available Bikes: ${station.available_bikes || '...'}</p>`;
    stationInfoDiv.classList.remove('hidden');
}

document.getElementById('free-bikes-btn').addEventListener('click', function() {
    if (isFilteredView) {
        fetchStationsAndAddMarkers(''); // 恢复显示所有站点
    } else {
        fetchStationsAndAddMarkers('free-bikes'); // 显示有空闲自行车的站点
    }
});

document.getElementById('free-stands-btn').addEventListener('click', function() {
    if (isFilteredView) {
        fetchStationsAndAddMarkers(''); // 恢复显示所有站点
    } else {
        fetchStationsAndAddMarkers('free-stands'); // 显示有空闲停车位的站点
    }
});

document.getElementById('searchButton').addEventListener('click', function() {
    var searchTerm = document.getElementById('searchInput').value;
    fetchStationsAndAddMarkers(searchTerm); // 根据搜索词重新加载站点标记
});

document.addEventListener('DOMContentLoaded', function() {
    initMap();
    updateWeatherInfo();
});

// 添加点击事件监听器以隐藏navbar
var toggleBtn = document.getElementById('toggleNav');
var navbar = document.querySelector('.navbar');
var mapContainer = document.getElementById('mapContainer');

toggleBtn.addEventListener('click', function() {
    navbar.classList.toggle('hidden');
    mapContainer.classList.toggle('fullwidth');
});

function updateWeatherInfo() {
    fetch('/api/weather')
        .then(response => response.json())
        .then(data => {
            const weatherDiv = document.getElementById('weatherInfo');
            const iconUrl = `http://openweathermap.org/img/wn/${data.weather_icon}.png`;
            weatherDiv.innerHTML = `<img src="${iconUrl}" alt="Weather Icon" /> <span>${data.weather_description}, ${data.temperature}°C</span>`;
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            document.getElementById('weatherInfo').innerHTML = 'Failed to load weather data';
        });
}





