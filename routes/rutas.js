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

//Guardar datos JSON en un archivo
const saveJSON = (fileName, data) => {
    const filePath = path.join("../ApiProyectoRedesII/LocalNFS", fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
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
            Tipo: usuario.TipoUsuario
        };

        console.log(usuarioData.Alias+"data");

        // Enviar datos del usuario
        res.json({ success: true, usuario: usuarioData });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

//signup
router.post('/signup', (req, res) => {
    try {
        const { correo, contrasena,apem, apep, alias, nombre} = req.body;

        console.log(correo);
        console.log(contrasena);
        console.log(apem);
        console.log(apep);
        console.log(alias);
        console.log(nombre);

        // Cargar usuarios desde el NFS
        const data = loadJSON('User.json');
        const usuarios = data.Users;

        // Verificar si el usuario ya existe por correo
        const usuarioExistente = usuarios.find(u => u.Correo === correo);
        if (usuarioExistente) {
            return res.json({ success: false, error: 'El usuario ya existe' });
        }

        // Generar un nuevo ID para el usuario
        const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.IdUser)) + 1 : 1;

        // Crear usuario
        const newUser = {
            IdUser: nuevoId,
            Nombre: nombre,
            ApePat:apep,
            ApeMat:apem,
            Alias: alias,
            Contrasena: contrasena,
            Correo: correo,
            TipoUsuario:1
        };

        // Agregar el nuevo usuario a la lista
        usuarios.push(newUser);

        // Guardar los datos actualizados en el archivo JSON
        saveJSON('User.json', { Users: usuarios });

        // Enviar datos del usuario
        res.json({ success: true, usuario: { IdUser: newUser.IdUser, Nombre: newUser.Nombre, Alias: newUser.Alias, Correo: newUser.Correo } });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

//Subir información al NFS


//Nube



module.exports = router;