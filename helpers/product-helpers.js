var db = require('../config/connection')
var collection = require('../config/collections')
module.exports = {

    addProduct:(products,callback)=>{
        console.log(products)
        db.get().collection(collection).insertOne(products).then((data)=>{
            console.log(data)
            callback(data.ops[0]._id)

        })

    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    }

}