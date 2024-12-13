const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const misRutas = require('./routes/rutas');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors())
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// Servir archivos estáticos desde la carpeta img en el directorio LocalNFS
app.use('/img', express.static(path.join(__dirname, 'LocalNFS/img')));

app.use('/',misRutas);
app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

