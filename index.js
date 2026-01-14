const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

// إعدادات استقبال البيانات الكبيرة
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/** * هام جداً لـ Vercel: 
 * في بيئة Vercel، المجلد public يتم التعامل معه تلقائياً كـ Static
 * لكن لضمان عمل الصفحة الرئيسية من السيرفر:
 */
app.use(express.static(path.join(__dirname, "public")));

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwjOXtctSrWZqTPPvfIaGITcFoDTbYeACka_B0AycE32HtYWIJfmilwAwVaRsrgtj-I/exec";

// API Proxy Endpoint
app.post("/api", async (req, res) => {
    const action = req.body ? req.body.action : "No Action";
    
    try {
        if (!req.body || !action || action === "No Action") {
            throw new Error("Request body or action is missing.");
        }

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
            redirect: "follow",
        });

        const responseText = await response.text();
        
        if (!response.ok) {
            return res.status(response.status || 500).json({
                status: "error",
                message: `GS Error: ${response.statusText}`,
                details: responseText,
            });
        }

        const data = JSON.parse(responseText);
        res.json(data);

    } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).json({
            status: "error",
            message: `Proxy error: ${error.message}`,
        });
    }
});

// التعامل مع الصفحة الرئيسية
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/**
 * التعديل الجوهري لـ Vercel:
 * لا تستخدم app.listen في الإنتاج (Production)
 */
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running locally on port ${PORT}`);
    });
}

// تصدير التطبيق ليعمل كـ Serverless Function
module.exports = app;
