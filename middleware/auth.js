function loggedIn(req, res, next) {
        if (!req.session.userId) {
            return res.redirect("/register");
        }
        next();
}
function notLoggedIn(req, res, next) {
    console.log("checking home route access")
    if (req.session.userId && req.session.userSigned) {
        console.log("user has id");
        return res.redirect("/thanks");
    }
    next();
}
module.exports = {
    loggedIn,
    notLoggedIn
};