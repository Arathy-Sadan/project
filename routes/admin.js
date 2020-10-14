var express = require('express');
const fileUpload = require('express-fileupload');
const { Db } = require('mongodb');
const { render } = require('../app');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');

/* GET users listing. */
router.get('/', function(req, res,next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products});
  })
});

router.get('/add-products',function(req,res){
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

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
})

module.exports = router;
