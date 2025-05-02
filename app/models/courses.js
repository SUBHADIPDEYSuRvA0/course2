const mongoose = require("mongoose");


const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    features: [{
        type: String,
      
    }],
    image: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
   cgst: {
       type: Number,
     
   },
   sgst: {
       type: Number,
   
   }
   ,igst: {
       type: Number,
 
   },
    validated: {
       type:String,
       required: true,
    },
    },{
    timestamps: true,
});

module.exports = mongoose.model("Course", courseSchema);
    
