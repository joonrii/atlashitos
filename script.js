const ROUNDS_PER_GAME = 6;

let candidatePool = [];
let candidateIndex = 0;
let roundsPlayed = 0;
let totalScore = 0;

let guessMap, guessMarker, actualMarker, guessLine;
let guessLatLng = null;
let locked = false;

let currentLandmark = null;

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function haversine(lat1, lon1, lat2, lon2){
  const R = 6371;
  const toRad = d => d*Math.PI/180;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R*c;
}

function scoreForDistance(km){
  const s = Math.round(5000 * Math.exp(-km/1500));
  return Math.max(0, Math.min(5000, s));
}

function setPhotoStatus(text, isError){
  const el = document.getElementById('photoStatus');
  if(!text){ el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.classList.toggle('error', !!isError);
  el.textContent = text;
}

// --- Wikipedia lookup -------------------------------------------------------
// Usa la API pública REST de Wikipedia (sin token, sin límites de bbox).
// Devuelve la URL de la imagen principal del artículo, o null si no tiene.

async function fetchWithTimeout(url, ms){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try{
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLandmarkImage(wikiTitle){
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
  let res;
  try{
    res = await fetchWithTimeout(url, 5000);
  }catch(err){
    return null; // timeout o error de red: se descarta este monumento, sin bloquear
  }
  if(!res.ok) return null;
  const data = await res.json();
  const img = (data.originalimage && data.originalimage.source) || (data.thumbnail && data.thumbnail.source);
  return img || null;
}

// --- Map setup --------------------------------------------------------------

function initGuessMap(){
  guessMap = L.map('guessMap', { worldCopyJump:true }).setView([20,0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:18,
    attribution:'&copy; OpenStreetMap'
  }).addTo(guessMap);

  guessMap.on('click', (e) => {
    if(locked) return;
    guessLatLng = e.latlng;
    if(guessMarker){
      guessMarker.setLatLng(e.latlng);
    } else {
      const icon = L.divIcon({
        className:'', html:'<div style="width:16px;height:16px;background:#C9A227;border:2px solid #1B3A4B;border-radius:50%;box-shadow:0 0 8px rgba(201,162,39,0.8);"></div>',
        iconSize:[16,16], iconAnchor:[8,8]
      });
      guessMarker = L.marker(e.latlng, {icon}).addTo(guessMap);
    }
    document.getElementById('confirmBtn').disabled = false;
    document.getElementById('hintText').textContent = 'Marcador colocado — pulsa confirmar cuando estés listo';
  });
}

// --- Game flow ----------------------------------------------------------

async function startGame(){
  candidatePool = shuffle(LANDMARKS);
  candidateIndex = 0;
  roundsPlayed = 0;
  totalScore = 0;

  document.getElementById('introScreen').classList.remove('show');
  document.getElementById('introScreen').style.display = 'none';
  document.getElementById('finalScreen').classList.remove('show');
  document.getElementById('gameScreen').style.display = 'block';

  if(!guessMap){ initGuessMap(); }

  await advanceRound();
}

async function advanceRound(){
  locked = false;
  guessLatLng = null;
  document.getElementById('resultPanel').classList.remove('show');
  document.getElementById('confirmBtn').disabled = true;
  document.getElementById('confirmBtn').style.display = 'inline-block';
  document.getElementById('hintText').style.display = 'block';
  document.getElementById('hintText').textContent = 'Haz clic en el mapa para colocar tu marcador';

  if(guessMarker){ guessMap.removeLayer(guessMarker); guessMarker=null; }
  if(actualMarker){ guessMap.removeLayer(actualMarker); actualMarker=null; }
  if(guessLine){ guessMap.removeLayer(guessLine); guessLine=null; }
  guessMap.setView([20,0], 2);

  document.getElementById('landmarkImg').style.display = 'none';
  document.getElementById('landmarkImg').src = '';
  setPhotoStatus('Buscando foto…', false);

  let found = null;
  while(candidateIndex < candidatePool.length && !found){
    const l = candidatePool[candidateIndex++];
    setPhotoStatus(`Probando ${l.name}… (${candidateIndex}/${candidatePool.length})`, false);
    const imageUrl = await fetchLandmarkImage(l.wiki);
    if(imageUrl){ found = { landmark:l, imageUrl }; }
  }

  if(!found){
    setPhotoStatus('No se ha podido cargar ninguna foto más. Fin de la partida.', true);
    endGame();
    return;
  }

  currentLandmark = found.landmark;
  roundsPlayed++;

  const img = document.getElementById('landmarkImg');
  img.onload = () => {
    img.style.display = 'block';
    setPhotoStatus(null);
  };
  img.onerror = () => {
    setPhotoStatus('No se pudo cargar esta imagen. Pasando a la siguiente ronda…', true);
    setTimeout(advanceRound, 800);
  };
  img.src = found.imageUrl;

  updateScoreboard();
}

function updateScoreboard(){
  document.getElementById('ledRound').textContent = `${roundsPlayed}/${ROUNDS_PER_GAME}`;
  document.getElementById('ledScore').textContent = totalScore;
}

function confirmGuess(){
  if(!guessLatLng || locked || !currentLandmark) return;
  locked = true;
  const landmark = currentLandmark;
  const dist = haversine(guessLatLng.lat, guessLatLng.lng, landmark.lat, landmark.lng);
  const pts = scoreForDistance(dist);
  totalScore += pts;

  const actualIcon = L.divIcon({
    className:'', html:'<div style="width:16px;height:16px;background:#6B8068;border:2px solid #1B3A4B;border-radius:50%;box-shadow:0 0 8px rgba(107,128,104,0.8);"></div>',
    iconSize:[16,16], iconAnchor:[8,8]
  });
  actualMarker = L.marker([landmark.lat, landmark.lng], {icon:actualIcon}).addTo(guessMap);
  guessLine = L.polyline([guessLatLng, [landmark.lat, landmark.lng]], {color:'#C1440E', weight:2, dashArray:'6,6'}).addTo(guessMap);
  const bounds = L.latLngBounds([guessLatLng, [landmark.lat, landmark.lng]]);
  guessMap.fitBounds(bounds, {padding:[60,60], maxZoom:8});

  document.getElementById('resStadium').textContent = landmark.name;
  document.getElementById('resMeta').textContent = `${landmark.country} · ${landmark.category}`;
  document.getElementById('resFact').textContent = landmark.fact;
  document.getElementById('resDist').textContent = dist < 10 ? dist.toFixed(1) : Math.round(dist);
  document.getElementById('resPoints').textContent = pts;
  document.getElementById('resultPanel').classList.add('show');
  document.getElementById('confirmBtn').style.display = 'none';
  document.getElementById('hintText').style.display = 'none';

  updateScoreboard();
}

function rankFor(score){
  const max = ROUNDS_PER_GAME * 5000;
  const pct = score/max;
  if(pct >= 0.85) return "Cartógrafo maestro";
  if(pct >= 0.65) return "Trotamundos experto";
  if(pct >= 0.45) return "Viajero con mapa";
  if(pct >= 0.25) return "Turista despistado";
  return "Se te ha ido el vuelo";
}

function endGame(){
  document.getElementById('gameScreen').style.display = 'none';
  const finalScreen = document.getElementById('finalScreen');
  finalScreen.classList.add('show');
  document.getElementById('finalRank').textContent = rankFor(totalScore);
  document.getElementById('finalScore').textContent = `${totalScore} / ${roundsPlayed*5000} puntos`;
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('confirmBtn').addEventListener('click', confirmGuess);
document.getElementById('nextBtn').addEventListener('click', async () => {
  if(roundsPlayed >= ROUNDS_PER_GAME){
    endGame();
  } else {
    await advanceRound();
  }
});
document.getElementById('restartBtn').addEventListener('click', () => {
  document.getElementById('finalScreen').classList.remove('show');
  document.getElementById('introScreen').style.display = 'block';
  document.getElementById('introScreen').classList.add('show');
  document.getElementById('gameScreen').style.display = 'none';
});
