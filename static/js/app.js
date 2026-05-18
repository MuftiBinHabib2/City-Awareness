document.addEventListener('DOMContentLoaded', () => {
    // Initialize Map (Centered on Bangladesh)
    const map = L.map('map').setView([23.6850, 90.3563], 7);

    // Use a dark theme map tile
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    let currentMarker = null;
    const markersLayer = L.layerGroup().addTo(map);

    // Map click event for setting coordinates
    map.on('click', function(e) {
        const lat = e.latlng.lat.toFixed(5);
        const lng = e.latlng.lng.toFixed(5);
        
        document.getElementById('lat').value = lat;
        document.getElementById('lng').value = lng;

        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        
        currentMarker = L.marker([lat, lng]).addTo(map);
        
        // Highlight the form inputs
        document.getElementById('lat').style.borderColor = 'var(--primary)';
        document.getElementById('lng').style.borderColor = 'var(--primary)';
        setTimeout(() => {
            document.getElementById('lat').style.borderColor = 'var(--border)';
            document.getElementById('lng').style.borderColor = 'var(--border)';
        }, 500);
    });

    // Handle manual coordinate inputs
    function updateMarkerFromInput() {
        const lat = parseFloat(document.getElementById('lat').value);
        const lng = parseFloat(document.getElementById('lng').value);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            if (currentMarker) {
                map.removeLayer(currentMarker);
            }
            currentMarker = L.marker([lat, lng]).addTo(map);
            map.flyTo([lat, lng], 14, { duration: 1.0 });
        }
    }
    
    document.getElementById('lat').addEventListener('input', updateMarkerFromInput);
    document.getElementById('lng').addEventListener('input', updateMarkerFromInput);

    // Handle Form Submission
    const form = document.getElementById('incident-form');
    
    // Set default date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('date').value = now.toISOString().slice(0, 16);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const lat = document.getElementById('lat').value;
        const lng = document.getElementById('lng').value;
        
        if (!lat || !lng) {
            alert('Please click on the map to set a location.');
            return;
        }

        const incident = {
            id: Date.now().toString(),
            title: document.getElementById('title').value,
            type: document.getElementById('type').value,
            date: document.getElementById('date').value,
            newsLink: document.getElementById('newsLink').value,
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        };

        saveIncident(incident);
        form.reset();
        
        // Reset date to now
        const currentNow = new Date();
        currentNow.setMinutes(currentNow.getMinutes() - currentNow.getTimezoneOffset());
        document.getElementById('date').value = currentNow.toISOString().slice(0, 16);
        document.getElementById('lat').value = '';
        document.getElementById('lng').value = '';
        
        if (currentMarker) {
            map.removeLayer(currentMarker);
            currentMarker = null;
        }

        loadIncidents();
    });

    // LocalStorage Functions
    function saveIncident(incident) {
        const incidents = getIncidents();
        incidents.push(incident);
        localStorage.setItem('city_incidents', JSON.stringify(incidents));
    }

    function getIncidents() {
        const stored = localStorage.getItem('city_incidents');
        return stored ? JSON.parse(stored) : [];
    }

    function deleteIncident(id) {
        let incidents = getIncidents();
        incidents = incidents.filter(inc => inc.id !== id);
        localStorage.setItem('city_incidents', JSON.stringify(incidents));
        loadIncidents();
    }

    // Clear all
    document.getElementById('clear-all').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all incidents?')) {
            localStorage.removeItem('city_incidents');
            loadIncidents();
        }
    });

    // Custom Icons based on type
    const getIconColor = (type) => {
        const colors = {
            'traffic': '#F59E0B',
            'accident': '#EF4444',
            'crime': '#8B5CF6',
            'protest': '#3B82F6',
            'hazard': '#10B981',
            'other': '#64748B'
        };
        return colors[type] || colors['other'];
    };

    const createCustomIcon = (type) => {
        const color = getIconColor(type);
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #1E293B; box-shadow: 0 0 12px ${color};"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    };

    // Load and Display Incidents
    function loadIncidents() {
        const incidents = getIncidents();
        const listEl = document.getElementById('incidents-list');
        
        // Clear current UI
        listEl.innerHTML = '';
        markersLayer.clearLayers();

        // Sort by date descending
        incidents.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (incidents.length === 0) {
            listEl.innerHTML = '<li style="text-align: center; color: var(--text-muted); padding: 20px;">No incidents reported yet.</li>';
            return;
        }

        incidents.forEach(inc => {
            // Add to Sidebar
            const formattedDate = new Date(inc.date).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });

            const li = document.createElement('li');
            li.className = 'incident-item';
            li.style.borderLeft = `5px solid ${getIconColor(inc.type)}`;
            li.innerHTML = `
                <div class="incident-header">
                    <span class="incident-title">${inc.title}</span>
                    <div>
                        <span class="incident-badge badge-${inc.type}">${inc.type}</span>
                        <button class="delete-item-btn" data-id="${inc.id}" title="Delete"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <div class="incident-date"><i class="fa-regular fa-clock"></i> ${formattedDate}</div>
                <a href="${inc.newsLink}" target="_blank" class="incident-link" rel="noopener noreferrer"><i class="fa-solid fa-link"></i> Source News</a>
            `;

            // Fly to marker on click
            li.addEventListener('click', (e) => {
                if(e.target.closest('.delete-item-btn') || e.target.closest('.incident-link')) return;
                map.flyTo([inc.lat, inc.lng], 14, { duration: 1.5 });
            });

            listEl.appendChild(li);

            // Add delete listener
            li.querySelector('.delete-item-btn').addEventListener('click', () => {
                deleteIncident(inc.id);
            });

            // Add to Map
            const marker = L.marker([inc.lat, inc.lng], { icon: createCustomIcon(inc.type) });
            
            const popupContent = `
                <div class="popup-content">
                    <h3>${inc.title}</h3>
                    <p><strong>Type:</strong> <span style="color: ${getIconColor(inc.type)}; text-transform: capitalize;">${inc.type}</span></p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <a href="${inc.newsLink}" target="_blank" rel="noopener noreferrer">Read News Source</a>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
        });
    }

    // Initial load
    loadIncidents();
});
