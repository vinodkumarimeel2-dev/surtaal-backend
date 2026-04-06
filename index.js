const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const response = await axios.get(
      `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&query=${encodeURIComponent(query)}&n=30&p=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    );

    const data = response.data;
    const results = data.results || data.songs?.results || [];

    const songs = results.map(song => ({
      id: song.id,
      title: (song.title || song.song || 'Unknown')
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/<[^>]*>/g, ''),
      artistName: (song.primary_artists || song.singers || 'Unknown')
        .replace(/&amp;/g, '&'),
      albumArt: (song.image || '')
        .replace('150x150', '500x500'),
      duration: parseInt(song.duration) || 0,
      preview: song.media_preview_url || ''
    })).filter(s => s.id);

    res.json({ songs });
  } catch (error) {
    res.status(500).json({ error: error.message, songs: [] });
  }
});

app.get('/song/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const response = await axios.get(
      `https://www.jiosaavn.com/api.php?__call=media.getMediaURL&_format=json&ctx=web6dot0&bitrate=320&pids=${id}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    const url = response.data?.auth_url || 
                response.data?.media_url || 
                response.data?.url || '';

    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message, url: '' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'SurTaal Backend Running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
