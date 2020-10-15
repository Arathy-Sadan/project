var db = require('../config/connection')
var collection = require('../config/collections');
const { PRODUCT_COLLECTION } = require('../config/collections');
const collections = require('../config/collections');
const { response } = require('../app');
var objectId = require('mongodb').ObjectID
module.exports = {

    addProduct:(product,callback)=>{
       
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product)
        .then((data)=>{
          
            callback(data.ops[0]._id);
        })
    },
    
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION)
            .find().toArray()
            resolve(products)
        })
    },

    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .removeOne({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })

    },
    
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION)
            .findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Category:proDetails.Category,
                    Price:proDetails.Price,
                    Description:proDetails.Description
                }
            }).then((response)=>{
                resolve()
            })


        })
    }

    
}