import { db, collection, addDoc, auth, onAuthStateChanged, serverTimestamp } from './firebase-config.js';
import { IMGBB_API_KEY } from './config.js';

// --- DOM Element References ---
const form = document.getElementById('sighting-form');
const confirmation = document.getElementById('confirmation');
const photoInput = document.getElementById('photo');
const idSuggestion = document.getElementById('id-suggestion');
const idSuggestionBox = document.getElementById('id-suggestion-box');
const previewImage = document.getElementById('preview-image');
const speciesSelect = document.getElementById('species');
const locationBtn = document.getElementById('get-location');
const locationStatus = document.getElementById('location-status');

let coords = null;

// --- Teachable Machine Model Setup ---
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/iZLBySy-R/";
let tmModel = null;

async function loadTMModel() {
  try {
    tmModel = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
    console.log("Teachable Machine Model Loaded Successfully!");
  } catch (err) {
    console.error("Failed to load TM model:", err);
  }
}
loadTMModel();

// --- Location Capture ---
locationBtn.addEventListener('click', function() {
  if (!navigator.geolocation) {
    locationStatus.textContent = "Geolocation isn't supported on this browser.";
    return;
  }

  locationStatus.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    function(position) {
      coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      locationStatus.textContent = `Location captured (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
    },
    function(error) {
      locationStatus.textContent = "Couldn't get your location. You can still submit without it.";
    }
  );
});

// --- Photo Change & AI Auto-Detection Handler ---
photoInput.addEventListener('change', function() {
  const file = photoInput.files[0]; 
  document.getElementById('photo-filename').textContent = file ? `Selected: ${file.name}` : '';
  
  if (!file || !tmModel) return;


  const reader = new FileReader();
  reader.onload = function(e) {
    previewImage.src = e.target.result;
    document.getElementById('preview-container').style.display = 'block';

    previewImage.onerror = function() {
      idSuggestionBox.style.display = 'block';
      idSuggestion.textContent = "Couldn't read this image format (HEIC photos from iPhone aren't supported). Please upload a JPG or PNG, or select the species manually below.";
    };

    previewImage.onload = async function() {
      idSuggestionBox.style.display = 'block';
      idSuggestion.textContent = "Identifying plant...";

      const predictions = await tmModel.predict(previewImage);
      predictions.sort((a, b) => b.probability - a.probability);
      const top = predictions[0];

      const confidencePercent = Math.round(top.probability * 100);
      idSuggestion.textContent = `We think this might be: ${top.className} (${confidencePercent}% confident) — please confirm below.`;

      for (let option of speciesSelect.options) {
        if (option.value === top.className) {
          speciesSelect.value = top.className;
          break;
        }
      }
    };
  };
  reader.readAsDataURL(file);
});

// --- Photo Upload to ImgBB ---
async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });

  const result = await response.json();

  if (result.success) {
    return result.data.url;
  } else {
    throw new Error("Image upload failed");
  }
}

// --- Form Submission Handler ---
form.addEventListener('submit', async function(event) {
  event.preventDefault();
  
  if (!auth.currentUser) {
    confirmation.textContent = "Still connecting, please try submitting again in a second.";
    return;
  }

  const species = speciesSelect.value;
  const location = document.getElementById('location').value;
  const notes = document.getElementById('notes').value;
  const photoFile = photoInput.files[0];

  confirmation.textContent = "Submitting...";

  try {
    let photoUrl = null;

    if (photoFile) {
      photoUrl = await uploadPhoto(photoFile);
    }

    await addDoc(collection(db, "sightings"), {
      species: species,
      location: location,
      notes: notes,
      photoUrl: photoUrl,
      coords: coords,
      timestamp: serverTimestamp()
    });

    confirmation.textContent = `Thanks! Your report of ${species} near "${location}" has been saved.`;
    form.reset();
    coords = null;
    locationStatus.textContent = '';
    
    // Clear image status updates on success
    idSuggestionBox.style.display = 'none';
    document.getElementById('photo-filename').textContent = '';
    previewImage.src = '';

  } catch (error) {
    confirmation.textContent = "Something went wrong saving your report. Please try again.";
    console.error("Error: ", error);
  }
});
