var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const { response } = require('express');
const { log } = require('handlebars');
const verifyingLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }
  else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async(req,res)=>{
  let user = req.session.user
  let cartCount = null
  if(req.session.user){
  cartCount = await userHelpers.getCartCount(req.session.user._id) 
  }
  res.render('user/home',{user,cartCount})
})

router.get('/about',(req,res)=>{
  let user=req.session.user
  res.render('user/about',{user})
})

router.get('/products',async function(req, res) {
  let user=req.session.user
  let cartCount = null
  if(req.session.user){
  cartCount = await userHelpers.getCartCount(req.session.user._id) 
  }
  productHelpers.getAllProducts().then((products)=>{
    res.render('user/view-products',{products,user,cartCount});
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
  let userId=req.session.user._id
  let products=await userHelpers.getCartProducts(req.session.user._id)
  let proTotal=await userHelpers.getEachTotal(req.session.user._id)
  let totalvalue = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/cart',{products,user,userId,totalvalue,proTotal})
})

router.get('/add-to-cart/:id',(req,res)=>{
  console.log("api call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
  console.log("****"+req.body.user+"***")
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    let total =  await userHelpers.getTotalAmount(req.body.user)
    response.total =total
    console.log("****"+response.total+"*****")
    res.json(response)
   /* res.json({status:true})*/
  })
})

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  userHelpers.deleteCartProduct(proId,req.session.user._id).then((response)=>{
    res.redirect('/cart')
  })
})

router.get('/place-order',verifyingLogin,async(req,res)=>{
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/order',{total,user:req.session.user,userId:req.session.user._id})
})

router.post('/place-order',async(req,res)=>{
  console.log(req.body)
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId) 
  userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
    res.json({status:true})
  })
})

module.exports = router;
