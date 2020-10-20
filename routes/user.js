var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const { response } = require('express');
const verifyingLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }
  else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',(req,res)=>{
  let user=req.session.user
  res.render('user/home',{user})
})

router.get('/about',(req,res)=>{
  let user=req.session.user
  res.render('user/about',{user})
})

router.get('/products', function(req, res) {
  let user=req.session.user
  productHelpers.getAllProducts().then((products)=>{
    res.render('user/view-products',{products,user});
  })

});
/*create account page*/
router.get('/signup',(req,res)=>{
res.render('user/signup')
})

/*get login page*/
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/products')
    res.redirect('/products')
  }else{
    res.render('user/login',{"loginErr":req.session.loginErr})
    req.session.loginErr=false
  }
    
})

router.post('/signup',(req,res)=>{
  /*console.log(req.body)*/
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response);
    res.redirect('/login')
  })
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/products')
    }else{
      req.session.loginErr="Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyingLogin,async(req,res)=>{
  let user=req.session.user
  let products=await userHelpers.getCartProducts(req.session.user._id)
  console.log(products)
  res.render('user/cart',{products,user})
})

router.get('/add-to-cart/:id',verifyingLogin,(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/products')
  })
})

module.exports = router;
