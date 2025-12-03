const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'https://your-app.onrender.com'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Base URL
const EXTERNAL_API = 'https://musicapi.x007.workers.dev';

// Rate limiting
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

function rateLimitMiddleware(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    
    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, { count: 1, startTime: now });
        return next();
    }
    
    const userData = rateLimit.get(ip);
    
    if (now - userData.startTime > RATE_LIMIT_WINDOW) {
        rateLimit.set(ip, { count: 1, startTime: now });
        return next();
    }
    
    if (userData.count >= RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({ 
            error: 'Too many requests, please try again later' 
        });
    }
    
    userData.count++;
    next();
}

// API Routes
app.use('/api', rateLimitMiddleware);

// Search endpoint
app.get('/api/search', async (req, res) => {
    try {
        const { q, searchEngine = 'gaama' } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'Search query is required' 
            });
        }
        
        const response = await axios.get(`${EXTERNAL_API}/search`, {
            params: { 
                q: q.trim(), 
                searchEngine 
            },
            timeout: 10000 // 10 second timeout
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Search API Error:', error.message);
        
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ 
                success: false, 
                error: 'Request timeout. Please try again.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Failed to search songs. Please try again.' 
        });
    }
});

// Lyrics endpoint
app.get('/api/lyrics', async (req, res) => {
    try {
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Song ID is required' 
            });
        }
        
        const response = await axios.get(`${EXTERNAL_API}/lyrics`, {
            params: { id },
            timeout: 10000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Lyrics API Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch lyrics' 
        });
    }
});

// Fetch song endpoint
app.get('/api/fetch', async (req, res) => {
    try {
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Song ID is required' 
            });
        }
        
        const response = await axios.get(`${EXTERNAL_API}/fetch`, {
            params: { id },
            timeout: 15000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Fetch API Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch song' 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Music Stream API',
        version: '1.0.0'
    });
});

// API documentation
app.get('/api', (req, res) => {
    res.json({
        message: 'Music Stream API',
        endpoints: {
            search: 'GET /api/search?q={query}&searchEngine={engine}',
            lyrics: 'GET /api/lyrics?id={songId}',
            fetch: 'GET /api/fetch?id={songId}'
        },
        searchEngines: ['gaama', 'wynk', 'jiosaavn']
    });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend')));
    
    // Handle SPA routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found' 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});