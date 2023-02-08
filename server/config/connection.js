const mongoose = require('mongoose')
const uri = process.env.URI

const connectDb = async()=>{
    try {
      await mongoose.connect(uri,{
        useNewUrlParser: true,
        useUnifiedTopology: true

      },()=>console.log("Mongo db connected"))  
    } catch (error) {
        console.log(error.message)
    }
}

module.exports={connectDb}