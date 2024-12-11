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

//Obtener noticias subidas por un usuario
router.get('/myNews', (req, res) => {
    try {
        // Obtener el IdUsuario desde los parámetros de consulta
        const idUsuario = parseInt(req.query.idUsuario, 10);

        console.log("idRecibido: "+idUsuario);

        if (!idUsuario) {
            return res.status(400).json({ error: 'Falta Id' });
        }

        const noticias = loadJSON('Noticia.json').Noticias;
        const periodicos = loadJSON('Periodico.json').Periodicos;
        const paises = loadJSON('Pais.json').Paises;
        const categorias = loadJSON('Categoria.json').Categorias;
        const idiomas = loadJSON('Idioma.json').Idiomas;

        // Filtrar noticias del usuario
        const noticiasUsuario = noticias.filter(noticia => noticia.IdUsuario === idUsuario);

        // Mapear las referencias
        const noticiasCompletas = noticiasUsuario.map((noticia) => {
            return {
                ...noticia,
                Periodico: periodicos.find(p => p.IdPeriodico === noticia.IdPeriodico)?.Nombre || "Desconocido",
                Pais: paises.find(p => p.IdPais === noticia.IdPais)?.Nombre || "Desconocido",
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

//Login
router.post('/login', (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        console.log(correo);
        console.log(contrasena);

        // Cargar usuarios desde el NFS
        const usuarios = loadJSON('User.json').Users;

        // Buscar usuario por alias
        const usuario = usuarios.find(u => u.Correo === correo);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar contraseña (por ahora, texto plano)
        if (usuario.Contrasena !== contrasena) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Crear sesión de usuario
        const usuarioData = {
            IdUser: usuario.IdUser,
            Nombre: usuario.Nombre,
            Alias: usuario.Alias,
            Correo: usuario.Correo,
            Tipo: usuario.Tipo
        };

        console.log(usuarioData.Alias+"data");

        // Enviar datos del usuario
        res.json({ success: true, usuario: usuarioData });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});



//Subir información al NFS


//Nube



module.exports = router;