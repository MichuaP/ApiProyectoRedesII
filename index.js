const express = require('express');
const bodyParser = require('body-parser');
const misRutas = require('./routes/rutas');

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use('/',misRutas);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

