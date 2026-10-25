
import { db, collection, getDocs, query, orderBy } from './firebase-config.js';

const sightingsList = document.getElementById('sightings-list');

const map = L.map('map').setView([41.0, -73.8], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Makes user-typed text safe to put into HTML
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

async function loadSightings() {
  try {
    const sightingsQuery = query(collection(db, "sightings"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(sightingsQuery);

    if (querySnapshot.empty) {
      sightingsList.textContent = "No sightings reported yet.";
      return;
    }

    sightingsList.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const hasPhoto = data.photoUrl && data.photoUrl.startsWith('http');

      const entry = document.createElement('div');
      entry.classList.add('sighting-entry');
      entry.innerHTML = `
        ${hasPhoto
          ? `<img src="${esc(data.photoUrl)}" class="sighting-photo" alt="${esc(data.species)}">`
          : ''}
        <div class="sighting-info">
          <strong>${esc(data.species)}</strong> — ${esc(data.location)}
          ${data.notes ? `<p>${esc(data.notes)}</p>` : ''}
        </div>
      `;
      sightingsList.appendChild(entry);

      if (data.coords && typeof data.coords.lat === 'number' && typeof data.coords.lng === 'number') {
        const marker = L.marker([data.coords.lat, data.coords.lng]).addTo(map);
        marker.bindPopup(`
          <strong>${esc(data.species)}</strong><br>
          ${esc(data.location)}
          ${hasPhoto
            ? `<br><img src="${esc(data.photoUrl)}" style="width:150px; margin-top:6px; border-radius:4px;">`
            : ''}
        `);
      }
    });

  } catch (error) {
    sightingsList.textContent = "Couldn't load sightings.";
    console.error("Error loading sightings: ", error);
  }
}

loadSightings();