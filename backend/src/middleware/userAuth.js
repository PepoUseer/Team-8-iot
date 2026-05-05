const verifyAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        next({
            message: "Authentication required",
            status: 401,
        });
    }
};

export default verifyAuth;