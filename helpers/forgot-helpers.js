var db = require('../config/connection')
var collection = require('../config/collections')
const collections = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectID

module.exports={
    checkEmail:(email)=>{
        return new Promise(async(resolve,reject)=>{
            let emailid =await db.get().collection(collection.USER_COLLECTION).findOne({Email:email})
            resolve(emailid)
        })
    },
    changePassword:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Newpassword=await bcrypt.hash(userData.Newpassword,10)
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({Email:userData.Email},{
                $set:{
                    Password:userData.Newpassword
                }
                
            })
            
        })
    }
}