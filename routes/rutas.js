const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { encrypt, decrypt } = require('../cryptoUtils');
const CryptoJS = require('crypto-js');

// CLave ContraFront
const ENCRYPTION_KEYC = '35224252703265875843711068151088';

require('dotenv').config(); // Para variables de entorno

router.use(bodyParser.urlencoded({extended:false}));
router.use(bodyParser.json());

//Cifrar datos de un JSON
const encryptAllDataInJSON = () => {
    const filePath = path.join('../ApiProyectoRedesII/LocalNFS', 'User.json');
    // Verificar si el archivo existe
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        // Intentar parsear el archivo como JSON
        let jsonData;
        try {
            jsonData = JSON.parse(fileData);
        } catch (error) {
            console.error('Error al parsear el JSON existente:', error);
            return;
        }
        // Cifrar los datos del JSON
        const encryptedData = encrypt(jsonData);
        // Guardar los datos cifrados de vuelta en el archivo
        fs.writeFileSync(filePath, encryptedData, 'utf8');
        console.log('Datos cifrados y guardados correctamente.');
    } else {
        console.log('El archivo no existe.');
    }
};
// Llamar a la función para cifrar los datos actuales
//encryptAllDataInJSON();

//Mostrar info de un JSON
const loadData = (fileName) => {
    const filePath = path.join("../ApiProyectoRedesII/LocalNFS", fileName);
    // Leer los datos cifrados del archivo
    const encryptedData = fs.readFileSync(filePath, 'utf8');
    // Desencriptar los datos
    try {
        const decryptedData = decrypt(encryptedData);
        return decryptedData;
    } catch (error) {
        console.error('Error al desencriptar los datos:', error);
        return {};
    }
};
//const users = loadData('User_Categoria.JSON'); //Nombre del json a mostrar
//console.log(users);

// Configuración del multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../LocalNFS/img/'); // Carpeta de destino
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log("no existe carpeta");
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// Endpoint para subir una imagen
router.post('/upload-image', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }
    const filePath = `/img/${req.file.filename}`;
    res.status(200).json({ message: 'Imagen subida con éxito.', filePath });
});

router.get('/', (req, res) => {
    res.send('¡Hola mundo!');
});

//Obtener información del NFS y desencriptar
const loadJSON = (fileName) => {
    const filePath = path.join("../ApiProyectoRedesII/LocalNFS", fileName);
    const encryptedData = fs.readFileSync(filePath, 'utf8');
    return decrypt(encryptedData);
};

//Guardar datos JSON en un archivo y encriptar
const saveJSON = (fileName, data) => {
    const filePath = path.join("../ApiProyectoRedesII/LocalNFS", fileName);
    // Cifrar los datos antes de guardarlos
    const encryptedData = encrypt(data);
    // Guardar los datos cifrados en el archivo
    fs.writeFileSync(filePath, encryptedData, 'utf-8');
    console.log('Datos cifrados guardados correctamente.');
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
        const paises = loadJSON('Pais.json').Paises;
        const categorias = loadJSON('Categoria.json').Categorias;
        const idiomas = loadJSON('Idioma.json').Idiomas;

        // Filtrar noticias del usuario
        const noticiasUsuario = noticias.filter(noticia => noticia.IdUsuario === idUsuario);

        // Mapear las referencias
        const noticiasCompletas = noticiasUsuario.map((noticia) => {
            return {
                ...noticia,
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

        console.log("correo:"+correo);
        console.log("Contraseña encriptada recibida:", contrasena);

        // Desencriptar la contraseña
        const bytes = CryptoJS.AES.decrypt(contrasena, ENCRYPTION_KEYC);
        const contrasenaDF = bytes.toString(CryptoJS.enc.Utf8);

        console.log("Contraseña desencriptada:", contrasenaDF);

        // Cargar usuarios desde el NFS
        const usuarios = loadJSON('User.json').Users;
        const userCategorias = loadJSON('User_Categoria.json').User_Categorias;

        // Buscar usuario por alias
        const usuario = usuarios.find(u => u.Correo === correo);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Desencriptar la contraseña
        const bytes2 = CryptoJS.AES.decrypt(usuario.Contrasena, ENCRYPTION_KEYC);
        const contrasenaDB = bytes2.toString(CryptoJS.enc.Utf8);
        console.log("Contraseña desencriptada:", contrasenaDB);

        // Verificar contraseña
        if (contrasenaDF !== contrasenaDB) {
            console.log("Contraseña incorrecta");
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

        // Obtener las categorías del usuario
        const categoriasUsuario = userCategorias.find(uc => uc.IdUser === usuarioData.IdUser)?.IdCategoria || [];

        // Imprimir las categorías del usuario en la terminal del servidor
        console.log(`Categorías del usuario ${usuarioData.Alias}:`, categoriasUsuario);

        // Enviar datos del usuario
        res.json({ success: true, usuario: usuarioData, categorias: categoriasUsuario });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

//Login para la app
router.post('/loginApp', (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        console.log("correo:"+correo);
        console.log("Contraseña recibida:", contrasena);

        // Cargar usuarios desde el NFS
        const usuarios = loadJSON('User.json').Users;
        const userCategorias = loadJSON('User_Categoria.json').User_Categorias;

        // Buscar usuario por alias
        const usuario = usuarios.find(u => u.Correo === correo);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Desencriptar la contraseña
        const bytes2 = CryptoJS.AES.decrypt(usuario.Contrasena, ENCRYPTION_KEYC);
        const contrasenaDB = bytes2.toString(CryptoJS.enc.Utf8);
        console.log("Contraseña desencriptada:", contrasenaDB);

        // Verificar contraseña
        if (contrasena !== contrasenaDB) {
            console.log("Contraseña incorrecta");
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

        // Obtener las categorías del usuario
        const categoriasUsuario = userCategorias.find(uc => uc.IdUser === usuarioData.IdUser)?.IdCategoria || [];

        // Imprimir las categorías del usuario en la terminal del servidor
        console.log(`Categorías del usuario ${usuarioData.Alias}:`, categoriasUsuario);

        // Enviar datos del usuario
        res.json({ success: true, usuario: usuarioData, categorias: categoriasUsuario });
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

//signup para la app
router.post('/signupApp', (req, res) => {
    try {
        const { correo, contrasena, apem, apep, alias, nombre } = req.body;

        console.log("Correo:", correo);
        console.log("Contraseña recibida:", contrasena);

        // Cargar usuarios y categorías desde los archivos JSON
        const dataUsuarios = loadJSON('User.json');
        const usuarios = dataUsuarios.Users;

        const dataCategorias = loadJSON('User_Categoria.json');
        const userCategorias = dataCategorias.User_Categorias; // Ahora está definida

        // Verificar si el usuario ya existe por correo
        const usuarioExistente = usuarios.find(u => u.Correo === correo);
        if (usuarioExistente) {
            return res.json({ success: false, error: 'El usuario ya existe' });
        }

        // Generar un nuevo ID para el usuario
        const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.IdUser)) + 1 : 1;

        // Cifrar la contraseña antes de guardarla
        const encryptedPassword = CryptoJS.AES.encrypt(contrasena, ENCRYPTION_KEYC).toString();

        // Crear usuario
        const newUser = {
            IdUser: nuevoId,
            Nombre: nombre,
            ApePat: apep,
            ApeMat: apem,
            Alias: alias,
            Contrasena: encryptedPassword,
            Correo: correo,
            TipoUsuario: 1
        };

        // Agregar el nuevo usuario a la lista
        usuarios.push(newUser);

        // Guardar los datos actualizados en el archivo JSON
        saveJSON('User.json', { Users: usuarios });

        // Agregar preferencias predeterminadas al nuevo usuario
        const preferenciasPredeterminadas = [1, 3, 5, 10]; // Preferencias predeterminadas para usuarios de la app
        const newUserCategoria = {
            IdUser: nuevoId,
            IdCategoria: [preferenciasPredeterminadas] // Estructura del JSON
        };

        // Agregar al JSON de categorías
        userCategorias.push(newUserCategoria);
        saveJSON('User_Categoria.json', { User_Categorias: userCategorias });

        // Enviar datos del usuario
        res.json({
            success: true,
            usuario: {
                IdUser: newUser.IdUser,
                Nombre: newUser.Nombre,
                Alias: newUser.Alias,
                Correo: newUser.Correo
            }
        });
    } catch (error) {
        console.error('Error during signupApp:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

//Estados
router.post('/estados', (req, res) => {
    try {
        const idPais = parseInt(req.body.idPais, 10);

        console.log(idPais);
        
        // Cargar usuarios desde el NFS
        const data = loadJSON('Estado.json');
        const estados = data.Estados;

        // Filtrar estados del país
        const estadosPais = estados.filter(estado => estado.IdPais === idPais);

        console.log(estadosPais);

        // Enviar estados al usuario
        res.json(estadosPais);

    } catch (error) {
        console.error('Error during getting states:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

//Subir noticia
router.post('/subirNoticia', (req, res) => {
    try {
        const { titulo, contenido, fechaPublic, idCategoria, idIdioma,idPais,idEstado,lugar, idUser,imagen} = req.body;

        if (!titulo || !contenido || !fechaPublic || !idCategoria || !idIdioma || !idPais || !idEstado || !lugar || !idUser || !imagen) {
            return res.status(400).json({ error: 'Faltan datos requeridos.' });
        }
    
        // Cargar noticias y lugares
        const dataN = loadJSON('Noticia.json');
        const dataL = loadJSON('Lugar.json');
        const noticias = dataN.Noticias;
        const lugares = dataL.Lugares;
        let lugarId = 0

        //Verificar si el lugar ya existe
        const lugarExistente = lugares.find(l => l.Nombre.toLowerCase() === lugar.toLowerCase());
        if (lugarExistente) {
            console.log("lugar encontrado" + lugarExistente.Nombre);
            lugarId = lugarExistente.IdLugar;
        }else{
            //crear un nuevo lugar
            const nuevoIdL = lugares.length > 0 ? Math.max(...lugares.map(l => l.IdLugar)) + 1 : 1;
            lugarId = nuevoIdL;
            console.log("no existe el lugar, se ha creado uno nuevo "+ nuevoIdL);
            const newLugar = {
                IdLugar: nuevoIdL,
                Nombre: lugar,
                IdEstado:idEstado,
            };
            // Agregar el nuevo lugar al json
            lugares.push(newLugar);
            saveJSON('Lugar.json', { Lugares: lugares });
        }

        // Generar un nuevo ID para la noticia y para el lugar
        const nuevoIdN = noticias.length > 0 ? Math.max(...noticias.map(u => u.IdNoticia)) + 1 : 1;

        // Crear noticia
        const newNoticia = {
            IdNoticia: nuevoIdN,
            Titulo: titulo,
            Contenido:contenido,
            FechaPublic:fechaPublic,
            Imagen: imagen,
            IdLugar: lugarId,
            IdPais:idPais,
            IdUsuario:idUser,
            IdCategoria:idCategoria,
            IdIdioma:idIdioma,
            NumLikes:0,
        };

        // Agregar la nueva noticia al json
        noticias.push(newNoticia);

        // Guardar los datos actualizados en el archivo JSON
        saveJSON('Noticia.json', { Noticias: noticias });

        // Enviar respuesta al usuario
        res.json({ success: true});
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Guardar preferencias
router.post('/guardarPreferencias', (req, res) => {
    try {
        const { idUser, idCategoria } = req.body;

        if (!idUser || !idCategoria) {
            return res.status(400).json({ error: 'Faltan datos requeridos (idUser, idCategoria)' });
        }

        // Cargar los datos existentes
        const data = loadJSON('User_Categoria.json');
        const userCategorias = data.User_Categorias;
        

        // Verificar si la combinación ya existe
        const existe = userCategorias.some(uc => uc.IdUser === idUser && uc.IdCategoria === idCategoria);
        if (existe) {
            return res.status(400).json({ error: 'La preferencia ya existe' });
        }

        // Crear nueva preferencia
        const newUserCategoria = { IdUser: idUser, IdCategoria: idCategoria };
        userCategorias.push(newUserCategoria);

        // Guardar los datos actualizados
        saveJSON('User_Categoria.json', { User_Categorias: userCategorias });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al guardar preferencias:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

//Obtener noticias subidas en una localidad
router.get('/comuNews', (req, res) => {
    try {
        // Obtener información de los parámetros de consulta
        const idPais = parseInt(req.query.idPais, 10);
        const idEstado = parseInt(req.query.idEstado, 10);

        console.log("idPais: " + idPais);
        console.log("idEstado: " + idEstado);

        //Cargar JSON
        let noticias = loadJSON('Noticia.json').Noticias;
        const paises = loadJSON('Pais.json').Paises;
        const estados = loadJSON('Estado.json').Estados;
        const lugares = loadJSON('Lugar.json').Lugares;
        const categorias = loadJSON('Categoria.json').Categorias;
        const idiomas = loadJSON('Idioma.json').Idiomas;

        // Filtrar por país y estado
        if (idPais) {
            noticias = noticias.filter(noticia => noticia.IdPais === idPais);
        }
        // Filtrar por lugar
        if (idEstado) {
            noticias = noticias.filter(noticia => {
                const lugar = lugares.find(l => l.IdLugar === noticia.IdLugar);
                return lugar && lugar.IdEstado === idEstado;
            });
        }

        // Mapear las referencias de los datos de noticias
        const noticiasCompletas = noticias.map((noticia) => {
            const lugar = lugares.find(l => l.IdLugar === noticia.IdLugar);
            return {
                ...noticia,
                Pais: paises.find(p => p.IdPais === noticia.IdPais)?.Nombre || "Desconocido",
                Estado: lugar ? estados.find(e => e.IdEstado === lugar.IdEstado)?.Nombre : "Desconocido",
                Lugar: lugar ? lugar.Nombre : "Desconocido",
                Categoria: categorias.find(c => c.IdCategoria === noticia.IdCategoria)?.Nombre || "Desconocido",
                Idioma: idiomas.find(i => i.IdIdioma === noticia.IdIdioma)?.Nombre || "Desconocido"
            };
        });

        console.log(noticiasCompletas);

        res.json(noticiasCompletas);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ error: 'Failed to load data' });
    }
});

// Agregar a favoritos
router.post('/agregarFavorito', (req, res) => {
    try {
        const { title, abstract, imageUrl, publishedDate, sectionNumber, idUser } = req.body;

        if (!title || !abstract || !publishedDate || !idUser || !imageUrl) {
            return res.status(400).json({ error: 'Faltan datos requeridos.' });
        }

        // Cargar noticias
        const dataN = loadJSON('Noticia.json');
        const noticias = dataN.Noticias;

        // Generar un nuevo ID para la noticia
        const nuevoIdN = noticias.length > 0 ? Math.max(...noticias.map(u => u.IdNoticia)) + 1 : 1;

        // Crear noticia para favoritos
        const newNoticia = {
            IdNoticia: nuevoIdN,
            Titulo: title,
            Contenido: abstract,
            FechaPublic: publishedDate,
            Imagen: imageUrl,
            IdUsuario: idUser,
            IdLugar: null,
            IdPais: null,
            IdCategoria: sectionNumber,
            IdIdioma: 2,
            NumLikes: 0
        };

        // Agregar la nueva noticia a la lista de favoritos
        noticias.push(newNoticia);
        saveJSON('Noticia.json', { Noticias: noticias });

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;