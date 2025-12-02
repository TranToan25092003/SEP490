const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const restore = async () => {
    try {
        if (!process.env.URL_DATABASE) {
            throw new Error("URL_DATABASE is not defined in .env. Please ensure Backend/.env exists and contains the connection string.");
        }
        
        await mongoose.connect(process.env.URL_DATABASE);
        console.log("Connected to database.");

        const db = mongoose.connection.db;

        // IDs
        const soId = new mongoose.Types.ObjectId("692d9fac4d889243c26bef59");
        const bookingId = new mongoose.Types.ObjectId("692d9fbb4d889243c26bef5a");
        const quoteId = new mongoose.Types.ObjectId("692d9fc14d889243c26bef5b");
        const complaintId = new mongoose.Types.ObjectId("692d9fcb4d889243c26bef5c");
        
        // 1. Service Order
        await db.collection('serviceorders').deleteOne({ _id: soId });
        await db.collection('serviceorders').insertOne({
            _id: soId,
            status: "inspection_completed",
            walk_in_customer: { name: "Test User Setup", phone: "0000000000" },
            staff_clerk_id: "user_341RTRYa0G3wNoq7MUBJblumd6V",
            createdAt: new Date("2025-12-01T00:00:00Z"),
            is_walk_in: true,
            items: [],
            orderNumber: "TEST_SO_SETUP_001"
        });
        console.log("Restored Service Order");

        // 2. Booking
        await db.collection('bookings').deleteOne({ _id: bookingId });
        await db.collection('bookings').insertOne({
            _id: bookingId,
            status: "confirmed",
            service_order_id: soId,
            customer_clerk_id: "user_341RTRYa0G3wNoq7MUBJblumd6V",
            slot_end_time: new Date("2025-12-02T10:30:00Z"),
            slot_start_time: new Date("2025-12-02T10:00:00Z"),
            vehicle_id: new mongoose.Types.ObjectId("68fc156584d51b4f013c43dc")
        });
        console.log("Restored Booking");

        // 3. Quote
        await db.collection('quotes').deleteOne({ _id: quoteId });
        await db.collection('quotes').insertOne({
            _id: quoteId,
            tax: 10,
            subtotal: 100,
            items: [{ quantity: 1, price: 100, name: "Service 1" }],
            status: "pending",
            so_id: soId
        });
        console.log("Restored Quote");

        // 4. Complaint
        await db.collection('complaints').deleteOne({ _id: complaintId });
        await db.collection('complaints').insertOne({
            _id: complaintId,
            rating: 5,
            title: "Test Complaint",
            status: "pending",
            content: "Test Content",
            category_id: new mongoose.Types.ObjectId("691ff879b8c23872b9a9fd48"),
            user_id: "user_341RTRYa0G3wNoq7MUBJblumd6V",
            service_order_id: soId
        });
        console.log("Restored Complaint");

        console.log("Database state successfully restored.");

    } catch (err) {
        console.error("Error restoring database:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
        process.exit(0);
    }
};

restore();
