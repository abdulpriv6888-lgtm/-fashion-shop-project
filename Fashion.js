const mongoose = require('mongoose');

const FashionSchema = new mongoose.Schema({
  "Product Category": { 
    type: String, 
    required: [true, "Product category is required"] 
  },
  "Product Name": { 
    type: String, 
    required: [true, "Product name is required"],
    unique: true  
  },
  "Units Sold": { 
    type: Number,  
    required: [true, "Units sold is required"],
    min: [0, "Units sold cannot be negative"]
  },
  "Returns": { 
    type: Number,  
    required: [true, "Returns is required"],
    min: [0, "Returns cannot be negative"]
  },
  "Revenue": { 
    type: Number,  
    required: [true, "Revenue is required"]
  },
  "Customer Rating": { 
    type: Number,
    required: [true, "Customer rating is required"],
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"]
  },
  "Stock Level": { 
    type: Number,  
    required: [true, "Stock level is required"],
    min: [0, "Stock level cannot be negative"]
  },
  "Season": { 
    type: String, 
    required: [true, "Season is required"],
    enum: {
      values: ["Summer", "Winter", "Spring", "Autumn"],
      message: "Season must be Summer, Winter, Spring, or Autumn"
    }
  },
  "Trend Score": { 
    type: Number,  
    required: [true, "Trend score is required"],
    min: [0, "Trend score cannot be negative"],
    max: [100, "Trend score cannot exceed 100"]
  }
}, {
  timestamps: true  
});

module.exports = mongoose.model("FashionShopData", FashionSchema, "FashionShopData");