const validateApiKey = (req, res, next) => {
    const clientApiKey = req.header("device-api-key");
    if (!clientApiKey || clientApiKey !== process.env.DEVICE_API_KEY) {
        return res.status(401).json({ 
            error: "Unauthorized: Invalid or missing API key."
        });
    }
    next();
};

export default validateApiKey;