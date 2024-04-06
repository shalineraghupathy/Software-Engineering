let map; // Global map instance
let markers = []; // Array to hold all markers
let currentView = 'default'; // 默认视图，表示没有选择任何特定的视图模式

let staticInfo = {};
let dynamicInfo = {};
const customMarkerIconUrls = {
    default: '../static/default-bike.png',
    freeBikes: '../static/free-bike.png',
    freeStands: '../static/stands.png',
    searched: '../static/search-result.png'
};
// Event listeners for dynamic information loading
document.getElementById('free-bikes-btn').addEventListener('click', () => {
    currentView = 'freeBikes';
    fetchAndDisplayStations('free-bikes'); // 正确的API路径
});
document.getElementById('free-stands-btn').addEventListener('click', () => {
    currentView = 'freeStands';
    fetchAndDisplayStations('free-stands'); // 正确的API路径
});

document.getElementById('searchButton').addEventListener('click', () => {
    currentView = 'searched';
    const searchTerm = document.getElementById('searchInput').value;
    if (searchTerm) fetchAndDisplayStations('searched', searchTerm);
});


function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            // 在地图上显示用户位置
            showUserPosition(userPos);
        }, function() {
            alert('获取用户位置失败。');
        });
    } else {
        // 浏览器不支持 Geolocation
        alert('浏览器不支持 Geolocation。');
    }
}
function showUserPosition(position) {
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: "您的位置",
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' // 使用蓝色标记表示用户位置
        }
    });
    map.setCenter(position); // 将地图中心移动到用户位置
}

// Initialize the map and load static station data
function initMap() {
    getUserLocation();
    const dublin = { lat: 53.349805, lng: -6.26031 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: dublin
    });
    fetchStaticStations();
    fetchWeatherInfo(); // 获取天气信息
}
// 添加获取天气信息的函数
function fetchWeatherInfo() {
    fetch('/api/weather')
        .then(response => response.json())
        .then(data => {
            document.getElementById('weatherInfo').innerHTML = `
                Temp: ${data.temperature}°C , ${data.weather_main}
            `;
        })
        .catch(error => console.error('Error fetching weather:', error));
}
// Fetch and display static station information
// Fetch and display static station information
function fetchStaticStations() {
    fetch('/api/stations')
        .then(response => response.json())
        .then(data => {
            // 存储静态站点信息
            staticInfo = data.stations.reduce((acc, station) => {
                acc[station.number] = station;
                return acc;
            }, {});
            displayStations(data.stations, 'default');
        })
        .catch(error => console.error('Error fetching static stations:', error));
}


// Update markers on the map based on the provided stations and status
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
            stationNumber: station.number // 保存站点编号到标记中
        });

        // 为每个标记添加点击事件监听器，显示站点详细信息
        marker.addListener('click', () => showStationInfo(station.number)); // 修改这里，传递站点编号
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
// Show station information
function showStationInfo(stationNumber) {
    const stationStaticInfo = staticInfo[stationNumber];
    const stationDynamicInfo = dynamicInfo[stationNumber] || {};

    const stationInfoDiv = document.getElementById('stationInfo');
    stationInfoDiv.innerHTML = `
        <h4>${stationStaticInfo.name}</h4>
        <p>Address: ${stationStaticInfo.address}</p>
        <p>Bike Stands: ${stationStaticInfo.bike_stands}</p>
        ${currentView !== 'default' ? `
        <p>Available Bikes: ${stationDynamicInfo.available_bikes || 'N/A'}</p>
        <p>Available Bike Stands: ${stationDynamicInfo.available_bike_stands || 'N/A'}</p>
<!--        <p>Last Update: ${stationDynamicInfo.last_update ? new Date(stationDynamicInfo.last_update).toLocaleString() : 'N/A'}</p>-->
        ` : ''}
    `;
    stationInfoDiv.classList.remove('hidden');
}





// Determine icon URL based on station status
// Determine icon URL based on station status and availability
function determineIconUrl(station, status) {
    switch (status) {
        case 'freeBikes':
            return station.available_bikes > 0 ? customMarkerIconUrls.freeBikes : customMarkerIconUrls.default;
        case 'freeStands':
            return station.available_bike_stands > 0 ? customMarkerIconUrls.freeStands : customMarkerIconUrls.default;
        case 'searched':
            return customMarkerIconUrls.searched;
        default:
            return customMarkerIconUrls.default;
    }
}





// Fetch and display stations based on search or filter criteria
function fetchAndDisplayStations(status, searchTerm = '') {
    let url;
    // 根据状态确定请求的URL
    switch(status) {
        case 'free-bikes':
        case 'free-stands':
            url = `/api/${status}`; // 适用于动态数据的端点
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    // 存储动态信息以供后续使用
                    dynamicInfo = data.stations.reduce((acc, station) => {
                        acc[station.number] = station;
                        return acc;
                    }, {});
                    // 更新标记以反映动态信息
                    updateStationMarkers(dynamicInfo);
                })
                .catch(error => console.error(`Error fetching ${status}:`, error));
            break;
            case 'searched':
                url = `/api/search-stations?term=${encodeURIComponent(searchTerm)}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    // 清除当前所有标记
                    clearMarkers();
                    // 显示搜索结果的站点
                    displayStations(data.stations, 'searched');
                })
                .catch(error => console.error(`Error fetching searched stations:`, error));
            break;
            default:
                url = '/api/stations'; // 适用于默认的端点
    }
}

document.addEventListener('DOMContentLoaded', initMap);
