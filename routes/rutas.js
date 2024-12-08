const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

require('dotenv').config(); // Para variables de entorno

const fs = require('fs'); //Files
const path = require('path'); 

router.use(bodyParser.urlencoded({extended:false}));
router.use(bodyParser.json());

router.get('/', (req, res) => {
    res.send('¡Hola mundo!');
  });


//Obtener información del NFS
const loadJSON = (fileName) => {
    const filePath = path.join("../ApiProyectoRedesII/LocalNFS", fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

//Obtener noticias subidas por los usuarios
router.get('/myNews', (req, res) => {
    try {
        const noticias = loadJSON('Noticia.json').Noticias;
        const periodicos = loadJSON('Periodico.json').Periodicos;
        const paises = loadJSON('Pais.json').Paises;
        const autores = loadJSON('Autor.json').Autores;
        const categorias = loadJSON('Categoria.json').Categorias;
        const idiomas = loadJSON('Idioma.json').Idiomas;

        // Mapear las referencias
        const noticiasCompletas = noticias.map((noticia) => {
            return {
                ...noticia,
                Periodico: periodicos.find(p => p.IdPeriodico === noticia.IdPeriodico)?.Nombre || "Desconocido",
                Pais: paises.find(p => p.IdPais === noticia.IdPais)?.Nombre || "Desconocido",
                Autor: autores.find(a => a.IdAutor === noticia.IdAutor)?.Nombre || "Desconocido",
                Categoria: categorias.find(c => c.IdCategoria === noticia.IdCategoria)?.Nombre || "Desconocido",
                Idioma: idiomas.find(i => i.IdIdioma === noticia.IdIdioma)?.Nombre || "Desconocido"
            };
        });

        res.json(noticiasCompletas);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ error: 'Failed to load data' });
    }
});


//Subir información al NFS


//Nube

module.exports = router;