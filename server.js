const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import DB connection (Task 1.3)
const connectDB = require('./db');

// Import Mongoose model (Task 1.2)
const Fashion = require('./models/Fashion');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB Atlas
connectDB();

// Root route for testing
app.get('/', (req, res) => {
    res.json({ 
        message: "Fashion Shop API is running!",
        endpoints: {
            addProduct: "POST /add-product",
            updateProduct: "POST /update-product", 
            deleteProduct: "POST /delete-product",
            seasonTotals: "GET /season-totals",
            topProducts: "GET /top-products", 
            ratingFilter: "GET /rating-filter"
        }
    });
});

// Task 1.5 — POST API: Add Product

app.post('/add-product', async (req, res) => {
    try {
        // Convert string numbers to actual numbers
        const productData = {
            "Product Category": req.body["Product Category"]?.trim(),
            "Product Name": req.body["Product Name"]?.trim(),
            "Units Sold": parseInt(req.body["Units Sold"]) || 0,
            "Returns": parseInt(req.body["Returns"]) || 0,
            "Revenue": parseInt(req.body["Revenue"]) || 0,
            "Customer Rating": parseFloat(req.body["Customer Rating"]) || 0,
            "Stock Level": parseInt(req.body["Stock Level"]) || 0,
            "Season": req.body["Season"]?.trim(),
            "Trend Score": parseFloat(req.body["Trend Score"]) || 0
        };

        const requiredFields = [
            "Product Category", "Product Name", "Season"
        ];
        
        const missingFields = requiredFields.filter(field => !productData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: "Missing required fields",
                missingFields: missingFields
            });
        }

        const numericFields = ["Units Sold", "Returns", "Revenue", "Stock Level"];
        const invalidNumbers = numericFields.filter(field => productData[field] < 0);
        
        if (invalidNumbers.length > 0) {
            return res.status(400).json({
                message: "Negative values not allowed",
                invalidFields: invalidNumbers
            });
        }

        if (productData["Customer Rating"] < 1 || productData["Customer Rating"] > 5) {
            return res.status(400).json({
                message: "Customer Rating must be between 1 and 5"
            });
        }

        if (productData["Trend Score"] < 0 || productData["Trend Score"] > 100) {
            return res.status(400).json({
                message: "Trend Score must be between 0 and 100"
            });
        }

        const validSeasons = ["Summer", "Winter", "Spring", "Autumn"];
        if (!validSeasons.includes(productData["Season"])) {
            return res.status(400).json({
                message: "Season must be one of: Summer, Winter, Spring, Autumn"
            });
        }

        const newProduct = new Fashion(productData);
        await newProduct.save();

        return res.status(201).json({
            message: "Product added successfully!",
            data: newProduct
        });

    } catch (error) {
        console.error("Error adding product:", error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Product with this name already exists",
                error: "Duplicate product name"
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: "Validation failed",
                errors: errors
            });
        }
        
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// Task 1.6 — POST API: Update Product by ProductName

app.post('/update-product', async (req, res) => {
    try {
        const productName = req.body["Product Name"];

        if (!productName) {
            return res.status(400).json({
                message: "Product Name is required"
            });
        }

        const updated = await Fashion.findOneAndUpdate(
            { "Product Name": productName },
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                message: "Product not found!" 
            });
        }

        return res.status(200).json({
            message: "Product updated successfully!",
            data: updated
        });

    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});


// Task 1.7 — Delete Product by Product Name

app.post('/delete-product', async (req, res) => {
    try {
        const productName = req.body["Product Name"];

        if (!productName) {
            return res.status(400).json({
                message: "Product Name is required"
            });
        }

        const deleted = await Fashion.findOneAndDelete({
            "Product Name": productName
        });

        if (!deleted) {
            return res.status(404).json({
                message: "Product not found!"
            });
        }

        return res.status(200).json({
            message: "Product deleted successfully!",
            deleted
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// Task 1.8 — GET Season-wise Totals (Aggregation)

app.get('/season-totals', async (req, res) => {
    try {
        const results = await Fashion.aggregate([

            {
                $match: {
                    "Units Sold": { $ne: "" },
                    "Returns": { $ne: "" },
                    "Revenue": { $ne: "" }
                }
            },

            // STEP 2 — safe conversion with onError + onNull
            {
                $addFields: {
                    unitsNum: {
                        $convert: {
                            input: "$Units Sold",
                            to: "double",
                            onError: 0,
                            onNull: 0
                        }
                    },
                    returnsNum: {
                        $convert: {
                            input: "$Returns",
                            to: "double",
                            onError: 0,
                            onNull: 0
                        }
                    },
                    revenueNum: {
                        $convert: {
                            input: "$Revenue",
                            to: "double",
                            onError: 0,
                            onNull: 0
                        }
                    }
                }
            },

            {
                $group: {
                    _id: "$Season",
                    totalUnitsSold: { $sum: "$unitsNum" },
                    totalReturns: { $sum: "$returnsNum" },
                    totalRevenue: { $sum: "$revenueNum" }
                }
            },

            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json({
            message: "Season totals calculated successfully",
            results
        });

    } catch (error) {
        console.error("Aggregation error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// Task 1.9 — GET Top 10 by Units Sold > X for a Season

app.get('/top-products', async (req, res) => {
    try {
        const season = req.query.season;
        const minUnits = parseFloat(req.query.minUnits);

        if (!season || isNaN(minUnits)) {
            return res.status(400).json({
                message: "season and minUnits query parameters are required"
            });
        }

        const results = await Fashion.aggregate([
            {
                $match: { Season: season }
            },
            {
                $addFields: {
                    unitsNum: { $toDouble: "$Units Sold" }
                }
            },
            {
                $match: {
                    unitsNum: { $gt: minUnits }
                }
            },
            { $limit: 10 },
            {
                $project: {
                    unitsNum: 0
                }
            }
        ]);

        return res.status(200).json({
            message: "Top 10 products fetched successfully",
            results
        });

    } catch (error) {
        console.error("Error fetching top products:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// Task 1.10 — GET Products by Average Rating Condition (Season-wise)

app.get('/rating-filter', async (req, res) => {
    try {
        const { season, operator, value } = req.query;

        if (!season || !operator || !value) {
            return res.status(400).json({
                message: "season, operator, and value query parameters are required",
                example: "/rating-filter?season=Summer&operator=gt&value=4"
            });
        }

        const condition = {};
        condition[`$${operator}`] = parseFloat(value);

        const results = await Fashion.aggregate([
            // remove empty ratings
            {
                $match: {
                    "Season": season,
                    "Customer Rating": { $ne: "", $exists: true }
                }
            },
            {
                $addFields: {
                    ratingNum: {
                        $convert: {
                            input: "$Customer Rating",
                            to: "double",
                            onError: null,   
                            onNull: null
                        }
                    }
                }
            },
            {
                $match: {
                    ratingNum: condition
                }
            },
            {
                $project: {
                    ratingNum: 0
                }
            }
        ]);

        return res.status(200).json({
            message: "Filtered products fetched successfully",
            results
        });

    } catch (error) {
        console.error("Rating filter error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint not found",
        message: `Route ${req.originalUrl} does not exist`
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Available: http://localhost:${PORT}`);
});