const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const misRutas = require('./routes/rutas');

const app = express();
const port = process.env.PORT || 3000;
app.use(cors())
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use('/',misRutas);
app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

