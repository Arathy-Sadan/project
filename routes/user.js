var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const { response } = require('express');
const { log } = require('handlebars');
const { Db } = require('mongodb');
const forgotHelpers = require('../helpers/forgot-helpers');
const crypto = require('crypto-js')
var otpGenerator = require('otp-generator')
var nodemailer = require('nodemailer');
 
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'eshopproject2020@gmail.com',
    pass: 'Eshop@789'
  }
});
 

const verifyingLogin=(req,res,next)=>{
  if(req.session.user){
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
  if(req.session.user){
    res.redirect('/products')
    res.redirect('/products')
  }else{
    res.render('user/login',{"loginErr":req.session.userLoginErr})
    req.session.userLoginErr=false
  }
    
})

router.post('/signup',(req,res)=>{
  /*console.log(req.body)*/
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.user=response
    req.session.user.loggedIn=true
    res.redirect('/products')
  })
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user=response.user
      req.session.user.loggedIn=true
      res.redirect('/products')
    }else{
      req.session.userLoginErr="Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.user=null
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
  res.render('user/place-order',{total,user:req.session.user,userId:req.session.user._id})
})

router.post('/place-order',verifyingLogin,async(req,res)=>{
  console.log(req.body)
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId) 
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']==='cod'){
    res.json({codSuccess:true})
    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        console.log(response)
        res.json(response)
      })
    }

  })
})

router.get('/order-success',(req,res)=>{
  res.render('user/order-successfull',{user:req.session.user})
})

router.get('/order',async(req,res)=>{
  console.log(req.session.user._id)
  let orders = await userHelpers.getOrdersList(req.session.user._id)
  res.render('user/order',{user:req.session.user,orders})
})

router.get('/view-ordered-product/:id',verifyingLogin,async(req,res)=>{
  let products=await userHelpers.getOrderedProducts(req.params.id)
  res.render("user/ordered-products",{user:req.session.user,products})
})

router.post('/verify-payment',(req,res)=>{
  console.log("payment details are shown below")
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("Payment Succesfull")
      res.json({status:true})
    })

  }).catch((err)=>{
    console.log(err)
    res.json({status:false,errMsg:''})
  })
})


router.get('/forgotPassword',function(req,res){
res.render('user/forgotPassword')
})

router.post('/reset-password',async function (req, res) {
  const email = req.body.email
  console.log(email)
  let userdetails =await forgotHelpers.checkEmail(email) //check user details
  console.log(userdetails)
  if(userdetails != null){
    let token = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    console.log(token)
    
    var mailOptions = {
      from: 'eshopproject2020@gmail.com',
      to: email,
      subject: 'Reset Password',
      text: 'Otp - '+token
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    res.render('user/token',{tokenNumber:token})    
  }
  else{
    res.render('user/Nouser')
    console.log('no user  found')
  }
     
})

router.post('/checkOtp',(req,res)=>{
  console.log(req.body)
  if(req.body.token===req.body.otp){
    console.log("valid")
    res.render('user/Userfound')
  }
})
router.post('/updatePassword',(req,res)=>{
  forgotHelpers.changePassword(req.body).then(()=>{
  })
  res.redirect('/login')
})

module.exports = router;
