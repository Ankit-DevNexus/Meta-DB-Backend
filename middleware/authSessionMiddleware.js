const authSessionMiddleware = (req, res, next) => {
    if (!req.session.user) {
        return res.status(404).render('404');  // Render a 404 page
    }
    next();
};

export default authSessionMiddleware;