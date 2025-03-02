const fs = require('fs');
const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const app = express();
const port = 3000;
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// In-memory storage for demonstration purposes
const users = [{ id: 1, username: 'test', password: 'password' }];
const ads = [
    {        
        id: 1,
        title: 'Test Ad',
        description: 'This is a test ad',
        price: 100,
        contactPhone: '123456789',
        contactEmail: 'test@email.com',
        photos: ['/files/exampleProduct.png']        
    },
    {        
        id: 2,
        title: 'Test Ad2',
        description: 'This is a test ad',
        price: 100,
        contactPhone: '123456789',
        contactEmail: 'test@email.com',
        photos: ['/files/exampleProduct.png']        
    },
    {        
        id: 3,
        title: 'Test Ad3',
        description: 'This is a test ad',
        price: 100,
        contactPhone: '123456789',
        contactEmail: 'test@email.com',
        photos: ['/files/exampleProduct.png']        
    },
    {        
        id: 4,
        title: 'Test Ad4',
        description: 'This is a test ad',
        price: 100,
        contactPhone: '123456789',
        contactEmail: 'test@email.com',
        photos: ['/files/exampleProduct.png']        
    },
    {        
        id: 5,
        title: 'Test Ad5',
        description: 'This is a test ad',
        price: 100,
        contactPhone: '123456789',
        contactEmail: 'test@email.com',
        photos: ['/files/exampleProduct.png']        
    },
    {        
        id: 6,
        title: 'Test Ad6',
        description: 'This is a test ad',
        price: 100,
        contactPhone: '123456789',
        contactEmail: 'test@email.com',
        photos: ['/files/exampleProduct.png']        
    }
];

// Serve images from uploads folder
app.use('/files', express.static('uploads'));

// Passport Basic Strategy for login
passport.use(new BasicStrategy((username, password, done) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return done(null, false);
    return done(null, user);
}));

// Passport JWT Strategy
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'secretkey'
};
passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    // find the user who is matchin the userId from the token payload
    const user = users.find(user => user.id == jwt_payload.userId);
    if(user == undefined) 
    {
        console.log('User not found from JWT User Id');
        return done(null, null);
    }    
    return done(null, user);
}));

app.use(passport.initialize());

// Register new user
app.post('/users', (req, res) => {
    const { name, username, email, phone, password } = req.body;
    if (!name || !username || !email || !phone) {
        return res.status(400).send({ error: 'Missing required fields' });
    }
    const userId = users.length + 1;

    // Notice that no password hashing is done here for simplicity
    users.push({ userId, name, username, email, phone, password });

    res.status(201).json({ userId: userId.toString() });
});

// Login endpoint (Basic auth with Passport)
app.get('/login', passport.authenticate('basic', { session: false }), (req, res) => {
    const token = jwt.sign({ userId: req.user.id }, 'secretkey', { expiresIn: '1h' });
    res.json({ jwt: token });
});

// Get all ads
app.get('/adverts', (req, res) => {
    res.json({ ads });
});

// Post new ad (JWT protected)
app.post('/adverts', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { ad } = req.body;
    const user = req.user;
    if (!ad || !ad.title || !ad.description || !ad.price) {
        return res.status(400).send({ error: 'Missing required fields' });
    }
    const createdAdId = ads.length + 1;
    ads.push({ id: createdAdId, ...ad, contactEmail: user.email, contactPhone: user.phone});
    res.status(201).json({ createdAdId: createdAdId.toString() });
});

// Get a single advert
app.get('/adverts/:id', (req, res) => {
    const ad = ads.find(a => a.id === parseInt(req.params.id));
    if (!ad) return res.sendStatus(404);
    res.json({ ad });
});

// Add photos to advert (JWT protected)
app.put('/adverts/:id/photos', passport.authenticate('jwt', { session: false }), upload.array('files', 4), (req, res) => {
    const ad = ads.find(a => a.id === parseInt(req.params.id));
    if (!ad) return res.sendStatus(404);
    // rename the files with random names, but with .jpg extension
    req.files.forEach(file => {
        const ext = file.originalname.split('.').pop();
        const newFilename = `${Math.random().toString(36).substring(7)}.${ext}`;
        fs.renameSync(file.path, `uploads/${newFilename}`);
        file.path = `/files/${newFilename}`;
    });

    ad.photos = req.files.map(file => file.path);
    res.sendStatus(201);
});

// Delete all advert photos
app.delete('/adverts/:id/photos', (req, res) => {
    const ad = ads.find(a => a.id === parseInt(req.params.id));
    if (!ad) return res.sendStatus(404);
    ad.photos = [];
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
