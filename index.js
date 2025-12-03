<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MusicStream - Spotify-like Music Player</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="logo">
                <i class="fas fa-music"></i>
                <h1>MusicStream</h1>
            </div>
            <nav class="nav-menu">
                <ul>
                    <li class="active"><i class="fas fa-home"></i> Home</li>
                    <li><i class="fas fa-search"></i> Search</li>
                    <li><i class="fas fa-layer-group"></i> Your Library</li>
                    <li><i class="fas fa-plus-square"></i> Create Playlist</li>
                    <li><i class="fas fa-heart"></i> Liked Songs</li>
                </ul>
            </nav>
            <div class="playlists">
                <h3>YOUR PLAYLISTS</h3>
                <ul id="playlist-list">
                    <li>Favorites</li>
                    <li>Workout Mix</li>
                    <li>Chill Vibes</li>
                </ul>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Top Bar -->
            <header class="top-bar">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" id="search-input" placeholder="Search for songs, artists...">
                    <select id="search-engine">
                        <option value="gaama">Gaama</option>
                        <option value="wynk">Wynk</option>
                        <option value="jiosaavn">JioSaavn</option>
                    </select>
                    <button id="search-btn">Search</button>
                </div>
                <div class="user-profile">
                    <span>User</span>
                    <i class="fas fa-user-circle"></i>
                </div>
            </header>

            <!-- Now Playing -->
            <section class="now-playing">
                <h2>Now Playing</h2>
                <div class="current-track">
                    <div class="track-info">
                        <img id="current-track-img" src="https://via.placeholder.com/80" alt="Album Art">
                        <div>
                            <h3 id="current-track-title">No track selected</h3>
                            <p id="current-track-artist">Search and play a song</p>
                        </div>
                    </div>
                    <div class="track-actions">
                        <button id="like-btn"><i class="far fa-heart"></i></button>
                        <button id="queue-btn"><i class="fas fa-list"></i></button>
                    </div>
                </div>
            </section>

            <!-- Search Results -->
            <section class="search-results">
                <h2>Search Results</h2>
                <div id="results-container" class="results-grid">
                    <p class="placeholder-text">Search for music to see results here...</p>
                </div>
            </section>

            <!-- Lyrics Section -->
            <section class="lyrics-section">
                <h2>Lyrics</h2>
                <div id="lyrics-container">
                    <p class="placeholder-text">Select a song to view lyrics</p>
                </div>
            </section>
        </main>

        <!-- Player Bar -->
        <footer class="player-bar">
            <div class="player-left">
                <img id="player-track-img" src="https://via.placeholder.com/50" alt="Album Art">
                <div class="player-track-info">
                    <h4 id="player-track-title">No track playing</h4>
                    <p id="player-track-artist">Select a song to play</p>
                </div>
                <button id="player-like-btn"><i class="far fa-heart"></i></button>
            </div>
            
            <div class="player-center">
                <div class="player-controls">
                    <button id="shuffle-btn"><i class="fas fa-random"></i></button>
                    <button id="prev-btn"><i class="fas fa-step-backward"></i></button>
                    <button id="play-pause-btn"><i class="fas fa-play"></i></button>
                    <button id="next-btn"><i class="fas fa-step-forward"></i></button>
                    <button id="repeat-btn"><i class="fas fa-redo"></i></button>
                </div>
                <div class="progress-bar">
                    <span id="current-time">0:00</span>
                    <input type="range" id="progress-slider" min="0" max="100" value="0">
                    <span id="duration">0:00</span>
                </div>
            </div>
            
            <div class="player-right">
                <button id="lyrics-toggle"><i class="fas fa-microphone"></i></button>
                <button id="queue-toggle"><i class="fas fa-list-ol"></i></button>
                <div class="volume-control">
                    <i class="fas fa-volume-up"></i>
                    <input type="range" id="volume-slider" min="0" max="100" value="70">
                </div>
            </div>

            <!-- Audio Element -->
            <audio id="audio-player" preload="metadata"></audio>
        </footer>

        <!-- Queue Modal -->
        <div id="queue-modal" class="modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Queue</h2>
                <ul id="queue-list"></ul>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
