var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { ORDER_COLLECTION } = require('../config/collections')
const { ObjectID } = require('mongodb')
const { resource } = require('../app')
const { response } = require('express')

module.exports={
    doSignup:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            adminData.Password=await bcrypt.hash(adminData.Password,10)
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((data)=>{
                resolve(data.ops[0])
            })
            
        })
        
    },
    doLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let Loginstatus=true;
            let response={}
            let admin= await db.get().collection(collection.ADMIN_COLLECTION).findOne({Username:adminData.Username})
            if(admin){
                bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
                    if(status){
                        console.log("login success");
                        response.admin=admin
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
    getAllOrders:(data)=>{
            return new Promise(async(resolve,reject)=>{
                let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find().toArray()
                console.log(orders)
                resolve(orders)
            })   
    },
    changeStatus:(id)=>{
        console.log(id)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne(
                {_id:ObjectID(id)},
                {$set:{"status":"shipping"}}
            
            ).then((response)=>{
                resolve(response)
        })
        })

    },
    getOrderedProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderedProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectID(orderId)}
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
    }
}