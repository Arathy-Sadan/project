var db = require('../config/connection')
var collection = require('../config/collections')
const collections = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectID
const Razorpay=require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_laiiciQIJZtAMl',
    key_secret: 'wE1LvIatY3FiILemcGb2l8xF',
  });

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
            
        })
        
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let Loginstatus=true;
            let response={}
            let user= await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("login success");
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{ 
                        console.log("login failed");
                        resolve({status:false})
                    }
                    
                 })

            }else{
                console.log("login failed")
                resolve({status:false})
            }
        })
    },
    
    addToCart:(proId,userId)=>{
        let prObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).
            findOne({user:objectId(userId)})
            if(userCart){
                let proExist = userCart.product.findIndex(pro=> pro.item==proId)
                console.log(proExist)
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).
                    updateOne({user:objectId(userId),'product.item':objectId(proId)},{
                        $inc:{'product.$.quantity':1}
                    }).then(()=>{
                        resolve()
                    })
                }
                else{
                db.get().collection(collection.CART_COLLECTION).
                updateOne({user:objectId(userId)},
                {
                    $push:{product:prObj} 
                }).then((response)=>{
                    resolve()
                })}

            }else{
                let cartobj={
                    user:objectId(userId),
                    product:[prObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },{
                $project:{
                    item:'$product.item',
                    quantity:'$product.quantity'
                }
                },
                { $lookup:
                    {
                        from: "product",
                        localField: "item",
                        foreignField: "_id",
                        as: "products"
                     }
                },{
                    $project:{
                        item:1,
                        quantity:1,
                        products:{$arrayElemAt:['$products',0]},
                    }
                }
            
            ]).toArray()
                console.log(cartItems)
                resolve(cartItems)
            
            
        }).catch()
        
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).
            findOne({user:objectId(userId)})
            if(cart){
                count = cart.product.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise(async(resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION).
                updateOne({_id:objectId(details.cart)},
                { $pull:{product:{item:objectId(details.product)}} 
                }).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART_COLLECTION).
                updateOne({_id:objectId(details.cart),'product.item':objectId(details.product)},{
                    $inc:{'product.$.quantity':details.count}
                }).then((response)=>{
                    resolve({status:true})
                })
            }
        })
    },
  /*  changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        return new Promise((resolve,reject)=>{
            if((parseInt(details.count)==-1 && parseInt(details.quantity)<=1)||parseInt(details.quantity<1)){
                db.get().collection(collection.CART_COLLECTION).
                findAndModify({_id:objectId(details.cart),'product.item':objectId(details.product)},{
                    $set:{"product.quantity":1}
                })
      
            }else{
            db.get().collection(collection.CART_COLLECTION).
                    updateOne({_id:objectId(details.cart),'product.item':objectId(details.product)},{
                        $inc:{'product.$.quantity':details.count}
                    }).then((response)=>{
                        resolve()
                    })
            }
        })
    },*/
    deleteCartProduct:(proId,userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
            .updateMany(
                { "user": objectId(userId)},
                { $pull: { "product": { "item": objectId(proId)} } }
             )
             .then((response)=>
            resolve(response))
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },{
                $project:{
                    item:'$product.item',
                    quantity:'$product.quantity',
                    
                }
                },
                { $lookup:
                    {
                        from: "product",
                        localField: "item",
                        foreignField: "_id",
                        as: "products"
                     }
                },{
                    $project:{
                        item:1,
                        quantity:1,
                        products:{$arrayElemAt:['$products',0]}
                    }
                },
                
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$products.Price']}}
                    }
                }
            
            ]).toArray(response)
                console.log(total[0].total)
                resolve(total[0].total)
            
            
        }).catch()
    },
    getEachTotal:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let price=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },{
                $project:{
                    item:'$product.item',
                    quantity:'$product.quantity',
                    
                }
                },
                { $lookup:
                    {
                        from: "product",
                        localField: "item",
                        foreignField: "_id",
                        as: "proTotal"
                     }
                },{
                    $project:{
                        item:1,
                        quantity:1,
                        proTotal:{$arrayElemAt:['$proTotal',0]}
                    }
                },
                
                {
                    $project:{
                        price:{$sum:{$multiply:['$quantity','$proTotal.Price']}}
                    }
                }
            
            ]).toArray()
                console.log(price)
                resolve(price)
            
            
        }).catch()
    },
    placeOrder:(order,products,total)=>{

        return new Promise((resolve,reject)=>{
            console.log(order,products,total)
            let status = order['payment-method']==='cod'?'placed':'pending'
            let emailid =order.email
            console.log(emailid)
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:objectId(order.userId),
                email:order.email,
                paymentMethod:order['payment-method'],
                products:products,
                getTotalAmount:total,
                status:status,
                date:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)})
                console.log("orderId:"+response.ops[0]._id)
                resolve(response.ops[0]._id)
            })
            if(status==='placed'){
                var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'eshopproject2020@gmail.com',
    pass: 'Eshop@789'
  }
});

var mailOptions = {
  from: 'eshopproject2020@gmail.com',
  to: emailid,
  subject: 'orders',
  text: 'Orders placed successfully!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
            }
        })

    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.product)
        })
    },
    getOrdersList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(userId)
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray();
            console.log(orders)
            resolve(orders)
        })
    },
    getOrderedProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderedProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },{
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
                },
                { $lookup:
                    {
                        from: "product",
                        localField: "item",
                        foreignField: "_id",
                        as: "products"
                     }
                },{
                    $project:{
                        item:1,
                        quantity:1,
                        products:{$arrayElemAt:['$products',0]},
                    }
                }
            ]).toArray()
            console.log(orderedProducts)
            resolve(orderedProducts)          
        })
    },
    generateRazorpay:(orderId,Price)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: Price*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                console.log(order);
                resolve(order)
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'wE1LvIatY3FiILemcGb2l8xF')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},{
                $set:{
                    status:'placed'
                }
                
            }).then(()=>{
                resolve()
            })
            let order= await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
            console.log('To get email id')
            console.log(order)
            let emailid = order.email
            var nodemailer = require('nodemailer');

            var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'eshopproject2020@gmail.com',
                pass: 'Eshop@789'
              }
            });
            
            var mailOptions = {
              from: 'eshopproject2020@gmail.com',
              to: emailid,
              subject: 'orders',
              text: 'Orders placed successfully!'
            };
            
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
            });
        })
        

        
    }

}