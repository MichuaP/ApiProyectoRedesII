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

//Obtener información del NFS

//Subir información del NFS

//Nube