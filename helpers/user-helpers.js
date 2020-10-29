var db = require('../config/connection')
var collection = require('../config/collections')
const collections = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectID

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
            let user= await db.get().collection(collection.USER_COLLECTION).findOne({Username:userData.Username})
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
                        products:{$arrayElemAt:['$products',0]}
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
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).
                    updateOne({_id:objectId(details.cart),'product.item':objectId(details.product)},{
                        $inc:{'product.$.quantity':details.count}
                    }).then((response)=>{
                        console.log("hi")
                       console.log(response)
                        resolve()
                    })
        })
    },
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
    }
}