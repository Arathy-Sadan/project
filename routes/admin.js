var express = require('express');
const fileUpload = require('express-fileupload');
const { render } = require('../app');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    console.log(products)
    res.render('admin/view-products',{user:false,products});
  })

  
});

router.get('/add-products',function(req,res){
  res.render('admin/add-products');
})
router.post('/add-products',function(req,res){
  console.log(req.body);
  console.log(req.files.Image);
 
  productHelpers.addProduct(req.body,(id)=>{
    let image = req.files.Image
    console.log(id)
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.render('admin/add-products')
      }
      else{
        console.log(err);
      }
    })
 
  })
})

module.exports = router;
