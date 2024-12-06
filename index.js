const express = require('express');
const app = express();
const axios = require('axios');
require('dotenv').config(); // Para variables de entorno

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//Api TNYT
app.get('/nyt', async (req, res) => {
    const section = req.query.section || 'home'; // Permite filtrar por sección
    const apiUrl = `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${process.env.NYT_API_KEY}`;

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching NYT API:', error);
        res.status(500).json({ error: 'Failed to fetch data from NYT API' });
    }
});

//Api el país
app.get('/elpais', async (req, res) => {
    const apiUrl = 'https://api.elpais.com/...'; 

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching El País API:', error);
        res.status(500).json({ error: 'Failed to fetch data from El País API' });
    }
});