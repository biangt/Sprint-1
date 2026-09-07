const express = require('express');
const pageController = require('../controllers/pageController');

const router = express.Router();

router.get('/cart', pageController.showCart);
router.get('/checkout', pageController.showCheckout);
router.get('/register', pageController.showRegister);
router.post('/register', pageController.register);
router.get('/login', pageController.showLogin);
router.post('/login', pageController.login);

router.get('/carro', (req, res) => res.redirect('/cart'));
router.get('/verificar', (req, res) => res.redirect('/checkout'));
router.get('/registro', (req, res) => res.redirect('/register'));
router.post('/registro', (req, res) => res.redirect('/login'));
router.get('/acceso', (req, res) => res.redirect('/login'));

module.exports = router;