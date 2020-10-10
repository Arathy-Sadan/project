var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');

/* GET home page. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    console.log(products)
    res.render('user/view-products',{user:true,products});
  })

});
/*create account page*/
router.get('/signup',(req,res)=>{
res.render('user/signup',{user:true})
})

/*get login page*/
router.get('/login',(req,res)=>{
res.render('user/login',{user:true});
})

router.post('/signup',(req,res)=>{
  /*console.log(req.body)*/
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response);
  })
})

module.exports = router;
