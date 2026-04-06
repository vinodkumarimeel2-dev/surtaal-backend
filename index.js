const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Search songs
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const response = await axios.get('https://www.jiosaavn.com/api.php', {
      params: {
        __call: 'search.getResults',
        _format: 'json',
        _marker: '0',
        api_version: '4',
        ctx: 'web6dot0',
        query: query,
        n: '30',
        p: '1'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const results = response.data.results || [];
    const songs = results.map(song => ({
      id: song.id,
      title: song.title?.replace(/&amp;/g, '&')
                         .replace(/&#039;/g, "'") || 'Unknown',
      artistName: song.primary_artists || 'Unknown',
      albumArt: song.image?.replace('150x150', '500x500') || '',
      duration: parseInt(song.duration) || 0,
      preview: song.media_preview_url || ''
    }));

    res.json({ songs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get full song URL
app.get('/song/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const response = await axios.get('https://www.jiosaavn.com/api.php', {
      params: {
        __call: 'song.getDetails',
        _format: 'json',
        _marker: '0',
        api_version: '4',
        ctx: 'web6dot0',
        pids: id
      },
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const songData = response.data[id];
    if (!songData) return res.status(404).json({ error: 'Song not found' });

    // Decrypt URL
    const encUrl = songData.encrypted_media_url;
    const decResponse = await axios.get('https://www.jiosaavn.com/api.php', {
      params: {
        __call: 'media.getMediaURL',
        _format: 'json',
        ctx: 'web6dot0',
        bitrate: '320',
        pids: id
      },
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const mp3Url = decResponse.data?.auth_url || 
                   decResponse.data?.media_url || '';

    res.json({ url: mp3Url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'SurTaal Backend Running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
