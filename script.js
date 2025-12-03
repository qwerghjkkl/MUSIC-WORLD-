// API Base URL
const API_BASE_URL = 'https://musicapi.x007.workers.dev';

// State Management
let currentTrack = null;
let currentQueue = [];
let currentTrackIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];

// DOM Elements
const audioPlayer = document.getElementById('audio-player');
const searchInput = document.getElementById('search-input');
const searchEngine = document.getElementById('search-engine');
const searchBtn = document.getElementById('search-btn');
const resultsContainer = document.getElementById('results-container');
const lyricsContainer = document.getElementById('lyrics-container');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressSlider = document.getElementById('progress-slider');
const currentTimeSpan = document.getElementById('current-time');
const durationSpan = document.getElementById('duration');
const volumeSlider = document.getElementById('volume-slider');
const currentTrackTitle = document.getElementById('current-track-title');
const currentTrackArtist = document.getElementById('current-track-artist');
const currentTrackImg = document.getElementById('current-track-img');
const playerTrackTitle = document.getElementById('player-track-title');
const playerTrackArtist = document.getElementById('player-track-artist');
const playerTrackImg = document.getElementById('player-track-img');
const likeBtn = document.getElementById('like-btn');
const playerLikeBtn = document.getElementById('player-like-btn');
const queueModal = document.getElementById('queue-modal');
const queueList = document.getElementById('queue-list');
const queueBtn = document.getElementById('queue-btn');
const queueToggle = document.getElementById('queue-toggle');
const lyricsToggle = document.getElementById('lyrics-toggle');
const closeModal = document.querySelector('.close-modal');

// Search Function
async function searchSongs() {
    const query = searchInput.value.trim();
    const engine = searchEngine.value;
    
    if (!query) return;
    
    try {
        resultsContainer.innerHTML = '<p class="placeholder-text">Searching...</p>';
        
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&searchEngine=${engine}`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            displayResults(data.data);
        } else {
            resultsContainer.innerHTML = '<p class="placeholder-text">No results found. Try a different search.</p>';
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<p class="placeholder-text">Error searching. Please try again.</p>';
    }
}

// Display Search Results
function displayResults(tracks) {
    resultsContainer.innerHTML = '';
    
    tracks.forEach((track, index) => {
        const trackCard = document.createElement('div');
        trackCard.className = 'track-card';
        trackCard.innerHTML = `
            <img src="${track.image || 'https://via.placeholder.com/160'}" alt="${track.title}">
            <h4>${track.title}</h4>
            <p>${track.artists || 'Unknown Artist'}</p>
            <button onclick="playTrack(${index})">Play</button>
            <button onclick="addToQueue(${index})">Add to Queue</button>
        `;
        trackCard.dataset.trackData = JSON.stringify(track);
        resultsContainer.appendChild(trackCard);
    });
}

// Play Track
async function playTrack(trackIndex) {
    const trackCards = document.querySelectorAll('.track-card');
    const trackData = JSON.parse(trackCards[trackIndex].dataset.trackData);
    
    currentTrack = trackData;
    currentQueue = Array.from(document.querySelectorAll('.track-card')).map(card => 
        JSON.parse(card.dataset.trackData)
    );
    currentTrackIndex = trackIndex;
    
    updatePlayerUI();
    
    try {
        // Fetch the stream URL
        const response = await fetch(`${API_BASE_URL}/fetch?id=${trackData.id}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            audioPlayer.src = data.data;
            await audioPlayer.play();
            isPlaying = true;
            updatePlayPauseButton();
            updateNowPlaying();
            fetchLyrics();
        }
    } catch (error) {
        console.error('Error playing track:', error);
        alert('Error playing track. Please try another song.');
    }
}

// Update Player UI
function updatePlayerUI() {
    if (!currentTrack) return;
    
    playerTrackTitle.textContent = currentTrack.title;
    playerTrackArtist.textContent = currentTrack.artists || 'Unknown Artist';
    playerTrackImg.src = currentTrack.image || 'https://via.placeholder.com/50';
    currentTrackTitle.textContent = currentTrack.title;
    currentTrackArtist.textContent = currentTrack.artists || 'Unknown Artist';
    currentTrackImg.src = currentTrack.image || 'https://via.placeholder.com/80';
    
    // Update like button
    const isLiked = likedSongs.some(song => song.id === currentTrack.id);
    const likeIcon = isLiked ? 'fas fa-heart' : 'far fa-heart';
    likeBtn.innerHTML = `<i class="${likeIcon}"></i>`;
    playerLikeBtn.innerHTML = `<i class="${likeIcon}"></i>`;
}

// Update Now Playing Section
function updateNowPlaying() {
    // This would be expanded to show more details
}

// Fetch Lyrics
async function fetchLyrics() {
    if (!currentTrack) return;
    
    try {
        lyricsContainer.innerHTML = '<p class="placeholder-text">Loading lyrics...</p>';
        
        const response = await fetch(`${API_BASE_URL}/lyrics?id=${currentTrack.id}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            lyricsContainer.innerHTML = data.data;
        } else {
            lyricsContainer.innerHTML = '<p class="placeholder-text">No lyrics available for this track.</p>';
        }
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        lyricsContainer.innerHTML = '<p class="placeholder-text">Error loading lyrics.</p>';
    }
}

// Add to Queue
function addToQueue(trackIndex) {
    const trackCards = document.querySelectorAll('.track-card');
    const trackData = JSON.parse(trackCards[trackIndex].dataset.trackData);
    
    currentQueue.push(trackData);
    updateQueueModal();
    
    // Show notification
    showNotification(`Added "${trackData.title}" to queue`);
}

// Update Queue Modal
function updateQueueModal() {
    queueList.innerHTML = '';
    
    currentQueue.forEach((track, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${track.title}</strong>
                <br>
                <small>${track.artists || 'Unknown Artist'}</small>
            </div>
            <button onclick="removeFromQueue(${index})">Remove</button>
        `;
        queueList.appendChild(li);
    });
}

// Remove from Queue
function removeFromQueue(index) {
    currentQueue.splice(index, 1);
    updateQueueModal();
}

// Toggle Like
function toggleLike() {
    if (!currentTrack) return;
    
    const index = likedSongs.findIndex(song => song.id === currentTrack.id);
    
    if (index === -1) {
        likedSongs.push(currentTrack);
        showNotification('Added to Liked Songs');
    } else {
        likedSongs.splice(index, 1);
        showNotification('Removed from Liked Songs');
    }
    
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    updatePlayerUI();
}

// Show Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Play/Pause Toggle
function togglePlayPause() {
    if (!audioPlayer.src) return;
    
    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play();
    }
    
    isPlaying = !isPlaying;
    updatePlayPauseButton();
}

// Update Play/Pause Button
function updatePlayPauseButton() {
    const icon = isPlaying ? 'fa-pause' : 'fa-play';
    playPauseBtn.innerHTML = `<i class="fas ${icon}"></i>`;
}

// Next Track
function nextTrack() {
    if (currentQueue.length === 0) return;
    
    if (isShuffle) {
        currentTrackIndex = Math.floor(Math.random() * currentQueue.length);
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % currentQueue.length;
    }
    
    const nextTrackData = currentQueue[currentTrackIndex];
    currentTrack = nextTrackData;
    playTrackFromQueue();
}

// Previous Track
function prevTrack() {
    if (currentQueue.length === 0) return;
    
    currentTrackIndex = (currentTrackIndex - 1 + currentQueue.length) % currentQueue.length;
    const prevTrackData = currentQueue[currentTrackIndex];
    currentTrack = prevTrackData;
    playTrackFromQueue();
}

// Play Track from Queue
async function playTrackFromQueue() {
    updatePlayerUI();
    
    try {
        const response = await fetch(`${API_BASE_URL}/fetch?id=${currentTrack.id}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            audioPlayer.src = data.data;
            await audioPlayer.play();
            isPlaying = true;
            updatePlayPauseButton();
            fetchLyrics();
        }
    } catch (error) {
        console.error('Error playing track:', error);
    }
}

// Update Progress
function updateProgress() {
    if (!audioPlayer.duration) return;
    
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressSlider.value = percent;
    
    // Update time displays
    currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
    durationSpan.textContent = formatTime(audioPlayer.duration);
}

// Format Time (seconds to MM:SS)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Set Progress
function setProgress() {
    const percent = progressSlider.value;
    audioPlayer.currentTime = (percent / 100) * audioPlayer.duration;
}

// Set Volume
function setVolume() {
    audioPlayer.volume = volumeSlider.value / 100;
}

// Toggle Shuffle
function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.style.color = isShuffle ? 'var(--primary-color)' : 'var(--gray-color)';
}

// Toggle Repeat
function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.style.color = isRepeat ? 'var(--primary-color)' : 'var(--gray-color)';
    audioPlayer.loop = isRepeat;
}

// Event Listeners
searchBtn.addEventListener('click', searchSongs);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchSongs();
});

playPauseBtn.addEventListener('click', togglePlayPause);
prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);

audioPlayer.addEventListener('timeupdate', updateProgress);
audioPlayer.addEventListener('ended', () => {
    if (!isRepeat) {
        nextTrack();
    }
});

progressSlider.addEventListener('input', setProgress);
volumeSlider.addEventListener('input', setVolume);

likeBtn.addEventListener('click', toggleLike);
playerLikeBtn.addEventListener('click', toggleLike);

queueBtn.addEventListener('click', () => {
    updateQueueModal();
    queueModal.style.display = 'block';
});

queueToggle.addEventListener('click', () => {
    updateQueueModal();
    queueModal.style.display = 'block';
});

lyricsToggle.addEventListener('click', () => {
    lyricsContainer.scrollIntoView({ behavior: 'smooth' });
});

closeModal.addEventListener('click', () => {
    queueModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === queueModal) {
        queueModal.style.display = 'none';
    }
});

// Initialize volume
audioPlayer.volume = volumeSlider.value / 100;

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft':
            if (e.ctrlKey) prevTrack();
            break;
        case 'ArrowRight':
            if (e.ctrlKey) nextTrack();
            break;
        case 'l':
            if (e.ctrlKey) toggleLike();
            break;
    }
});
