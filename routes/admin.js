var express = require('express');
const fileUpload = require('express-fileupload');
const { Db } = require('mongodb');
const { render, response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
/*Admin login */
const verifyingLogin=(req,res,next)=>{
  if(req.session.admin){
    next()
  }
  else{
    res.redirect('/admin/logedin')
  }
}

router.get('/signedup',(req,res)=>{
  res.render('admin/signup',{admin:true})
  })

  router.post('/signedup',(req,res)=>{
    /*console.log(req.body)*/
    adminHelpers.doSignup(req.body).then((response)=>{
      console.log(response);
      req.session.admin=response
      req.session.admin.loggedIn=true
      res.redirect('/admin/logedin')
    })
  })

router.get('/logedin',(req,res)=>{
  if(req.session.admin){
    res.redirect('/admin')
  }else{
    res.render('admin/login',{"loginErr":req.session.adminLoginErr,admin:true})
    req.session.adminLoginErr=false
  }
    
})

router.post('/logedin',(req,res)=>{
  console.log("12325457")
  console.log(req.body)
  adminHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.admin=response.admin
      req.session.admin.loggedIn=true
      res.redirect('/admin')
    }else{
      req.session.userLoginErr="Invalid username or password"
      res.redirect('/admin/logedin')
    }
  })
})

/* GET users listing. */
router.get('/',verifyingLogin, function(req, res,next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products});
  })
});

router.get('/add-products',verifyingLogin,function(req,res){
  res.render('admin/add-products',{admin:true});
})

router.post('/add-products',function(req,res){
  
   productHelpers.addProduct(req.body,(id)=>{
    let image = req.files.Image
    console.log(id)
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.render('admin/add-products',{admin:true})
      }
      else{
        console.log(err);
      }
    })
 
  })
})

router.get('/delete-product/:id',verifyingLogin,(req,res)=>{
  let proId=req.params.id
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
})

router.get('/edit-product/:id',verifyingLogin,async(req,res)=>{
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-product',{admin:true,product})

})

router.post('/edit-product/:id',(req,res)=>{
  let id = req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image = req.files.Image
      image.mv('./public/product-images/'+id+'.jpg')
    }
  })
})

router.get('/all-orders',verifyingLogin,async(req,res)=>{
  adminHelpers.getAllOrders().then((orders)=>{
    res.render('admin/orders',{admin:true,orders});
  })

})

router.get('/edit-orders/:id',(req,res)=>{
  adminHelpers.changeStatus(req.params.id).then(()=>{
    res.redirect('/admin/all-orders')
  })
})

router.get('/edit-order/:id',(req,res)=>{
  adminHelpers.changeStatusTo(req.params.id).then(()=>{
    res.redirect('/admin/all-orders')
  })
})


router.get('/view-products-ordered/:id',verifyingLogin,async(req,res)=>{
  let products=await adminHelpers.getOrderedProducts(req.params.id)
  res.render("user/ordered-products",{admin:true,products})
})

router.get('/all-users',verifyingLogin,(req,res)=>{
  adminHelpers.getAllUsers().then((users)=>{
    res.render('admin/all-users',{admin:true,users})
  })

})

module.exports = router;
