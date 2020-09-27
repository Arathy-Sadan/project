var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const products=[
    {
      name:"Men's T-shirt",
      category:"t-shirt",
      description:"Trending product from puma",
      image:"https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTOaQFd9Hh5kcjh0MOkv7Pd-GQHNFDBFISW_aZ62g-Y67a3wLoolmXz9XUhaFOpTsFWhAkMV7CbrKM&usqp=CAc"
    },
    {
      name:"Shoes",
      category:"Shoes",
      description:"Good product from HRX",
      image:"data:image/jpeg;base64,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"
    },
    {
      name:"Men's Pant",
      category:"Pant",
      description:"Trending product from puma",
      image:"data:image/jpeg;base64,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"
    },
    {
      name:"Men's T-shirt",
      category:"t-shirt",
      description:"Trending product from puma",
      image:"https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQsqQ8UsABKUUudWlLWQmnmpeRaf-mx_XGm9VdCxSbcFKB2rMBhrVOJPnpeButjOF45-_5oNPGt_5I&usqp=CAc"
    }


  ]
  res.render('index',{products,user:true});
});

module.exports = router;