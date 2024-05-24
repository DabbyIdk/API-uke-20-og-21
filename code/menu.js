// Henter elementene fra DOM-en ved hjelp av ID
const mybtn = document.getElementById('myList');
const rec = document.getElementById('btn');

// Legger til en klikk-hendelse til rec-knappen som kaller openmenu-funksjonen
rec.addEventListener("click", openmenu);

// Definerer funksjonen openmenu som viser eller skjuler recently viewed lista når knappen klikkes
function openmenu() {
    if (mybtn.style.display != 'block') {
        mybtn.style.display = 'block';
    } else {
        mybtn.style.display = 'none';
    }
    console.log('clicked');
}

// Definerer kart-attribusjonen
const attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Initialiserer kartet
var map = L.map('map1', {
    center: [37.7749, -95.4194], // Sentral posisjon på USA
    zoom: 4,
    minZoom: 1,
    worldCopyJump: true, // Aktiverer wrapping av lengdegrad
});

// Legger til fliselag på kartet fra OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution }).addTo(map);

// Initialiserer arrays for markers og nylig viste bryggerier
let markers = [];
let recentlyViewed = [];

// Asynkron funksjon for å vise bryggerier basert på stat
async function showBreweries(state) {
    // Lager API URL for å hente bryggerier fra OpenBreweryDB basert på stat
    const api_url = `https://api.openbrewerydb.org/breweries?by_state=${encodeURIComponent(state)}`;

    // Henter data fra API-et
    let response = await fetch(api_url);
    let data = await response.json();

    // Fjerner eksisterende markers fra kartet
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Legger til nye markers basert på API-data
    data.forEach(brewery => {
        // Sjekker om bryggeriet har gyldig lengdegrad og breddegrad, fordi ellers kan markers komme utenfor USA
        if (brewery.longitude < -49.47804) {
            if (brewery.latitude && brewery.longitude) {
                // Henter nettsiden til bryggeriet hvis den eksisterer
                let website = brewery.website_url ? `<a href="${brewery.website_url}" target="_blank">${brewery.website_url}</a>` : 'No website';
                
                // Lager en marker og legger den til kartet
                let marker = L.marker([brewery.latitude, brewery.longitude]).addTo(map);
                
                // Legger til en popup på markeren med bryggeriets informasjon
                marker.bindPopup(`<b>${brewery.name}</b><br>Address: ${brewery.street}, ${brewery.city}, ${brewery.state}<br>Phone number: ${brewery.phone}<br>Website: ${website}`);
                
                // Legger til en klikk-hendelse som legger bryggeriet til nylig viste
                marker.on('click', () => {
                    addToRecentlyViewed(brewery);
                });
                
                // Legger markeren til markers-arrayen
                markers.push({ marker: marker, id: brewery.id });
            }
        }
    });
}

// Funksjon for å håndtere søk basert på brukerinndata
function handleSearch() {
    const state = document.getElementById('stateInput').value;
    if (state) {
        showBreweries(state);
    }
}

// Legger til klikk-hendelse for søkeknappen
document.getElementById('searchBtn').addEventListener('click', handleSearch);

// Legger til tastatur-hendelse for enter-knappen på søkefeltet
document.getElementById('stateInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

// Funksjon for å legge bryggeri til nylig viste
function addToRecentlyViewed(brewery) {
    // Sjekker om bryggeriet allerede er i nylig viste
    const existingIndex = recentlyViewed.findIndex(item => item.id === brewery.id);
    if (existingIndex !== -1) {
        // Fjerner eksisterende oppføring hvis den finnes
        recentlyViewed.splice(existingIndex, 1);
    }
    // Legger til bryggeriet på toppen av listen
    recentlyViewed.unshift(brewery);

    // Begrenser listen til de siste 6 viste bryggeriene
    if (recentlyViewed.length > 6) {
        recentlyViewed.pop();
    }
    // Oppdaterer visningen av nylig viste
    updateRecentlyViewed();
}

// Funksjon for å oppdatere visningen av nylig viste bryggerier
function updateRecentlyViewed() {
    const myList = document.getElementById('myList');
    myList.innerHTML = '';
    recentlyViewed.forEach(brewery => {
        // Lager et listeelement for hvert nylig vist bryggeri
        const listItem = document.createElement('li');
        listItem.innerHTML = `<b>${brewery.name}`;
        
        // Legger til en klikk-hendelse for å vise bryggeriets marker på kartet om du klikker på bryggeriet.
        listItem.addEventListener('click', () => {
            const markerObj = markers.find(m => m.id === brewery.id);
            if (markerObj) {
                markerObj.marker.openPopup();
                map.setView(markerObj.marker.getLatLng(), 10); // zoomer inn på markeren på kartet
            }
        });
        
        // Legger listeelementet til listen
        myList.appendChild(listItem);
    });
}