const express = require("express");
const app = express();
const handle = require("express-handlebars");
const cookieSession = require("cookie-session");
const { compareSync } = require("bcryptjs");
const { hash, compare } = require("./bc.js");
const db = require("./db.js");
const COOKIE_SECRET =
    process.env.COOKIE_SECRET || require("./secrets.json").COOKIE_SECRET;
const { notLoggedIn, loggedIn } = require("./middleware/auth.js");

if (process.env.NODE_ENV == "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"].startsWith("https")) {
            return next();
        }
        res.redirect(`https://${req.hostname}${req.url}`);
    });
}

app.engine("handlebars", handle());
app.set("view engine", "handlebars");
app.use(express.static("./public"));

app.use(
    cookieSession({
        secret: COOKIE_SECRET,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
    })
);

app.use((req, res, next) => {
    console.log(`${req.method} | ${req.url}`);
    console.log(req.session);
    next();
});

app.use((req, res, next) => {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.get("/", notLoggedIn, (req, res) => {
    res.render("home")
});

app.get("/petition", loggedIn, (req, res) => {
    user_id = req.session.userId;
    db.getSignatureByUsersId(user_id)
        .then((data) => {
            if (data.rows.length > 0) {
                res.redirect("/thanks");
            } else {
                return res.render("petition", {
                    layout: "main",
                });
            }
        })
        .catch((err) => {
            console.log("ERROR in getSignatureByUsersId: ", err);
            return res.render("petition", {
                layout: "main",
                errorMessage: "Oh Oh something went wrong😳",
            });
        });
});
app.post("/petition", loggedIn, (req, res) => {
    let { signature } = req.body;
    db.getSignatureByUsersId(req.session.userId)
        .then((data) => {
            console.log(data.rows)

            if (data.rows.length > 0) {
                
                res.redirect("/thanks");
            }
        })
        .catch((err) => {
            console.log("ERRROR in get signatureByUserId", err);
        });
    db.addSignatureAndUserId(signature, user_id)
        .then(() => {
            req.session.userSigned = true;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("ERROR in addSignatureAndUserId: ", err);
            res.render("petition", {
                layout: "main",
                errorMessage: "Oh Oh something went wrong😳",
            });
        });
});
app.get("/thanks", (req, res) => {
    Promise.all([db.getSigners(), db.getSignatureByUsersId(req.session.userId)])
        .then((data) => {
            if (data[1].rows.length == 0) {
                res.redirect("/petition");
            } else {
                res.render("thanks", {
                    layout: "main",
                    rowCount: data[0].rowCount, // rows.length
                    signatureUrl: data[1].rows[0].signature,
                });
            }
        })
        .catch((err) => {
            console.log("err in getSignatureId:", err);
        });
});
app.get("/signers", (req, res) => {
    db.getSigners()
        .then(({ rows }) => {
            if (req.session.userId) {
                res.render("signers", {
                    layout: "main",
                    rows,
                });
            } else {
                res.redirect("/petition");
            }
        })
        .catch((err) => console.log("err in getSignerNames:", err));
});

app.get(`/signers/:cityName`, (req, res) => {
    const cityName = req.params.cityName;

    db.getSignersByCity(cityName).then(({ rows }) => {
        res.render("signers-by-city", {
            layout: "main",
            rows,
            cityName,
            errorMessage: "Oh Oh something went wrong😳",
        });
    });
});

app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
    });
});
app.post("/register",  (req, res) => {
    const { firstname, lastname, password, email } = req.body;
    hash(password)
        .then((hashedPassword) => {
            return db.addUserData(firstname, lastname, hashedPassword, email);
        })
        .then((data) => {
            console.log("user registered");
            req.session.userId = data.rows[0].id;
            res.redirect("/profile");
        })
        .catch((err) => {
            s;
            console.log("an ERROR in addUserData: ", err),
                res.render("register", {
                    layout: "main",
                    errorMessage: "Oh Oh something went wrong😳",
                });
        });
});
app.get("/login",notLoggedIn, (req, res) => {
    res.render("login", {
        layout: "main",
    });
});
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.getHashedPassword(email)
        .then((hashedPassword) => {
            return compare(password, hashedPassword.rows[0].password);
        })
        .then((match) => {
            if (match) {
                db.getUserId(email)
                    .then((data) => {
                        console.log(data.rows);
                        req.session.userId = data.rows[0].id;
                        if (db.getSignatureByUsersId(req.session.userId)) {
                            ("there is a signature Id");
                            res.redirect("/thanks");
                        } else {
                            ("there is NO signature Id");
                            res.redirect("/petition");
                        }
                    })
                    .catch((err) => console.log("error in getUserId: ", err));
            } else {
                res.render("login", {
                    layout: "main",
                    errorMessage: "Oh Oh something went wrong😳",
                });
            }
        })
        .catch((err) => {
            console.log("err in POST Login", err);
        });
});
app.get("/profile", notLoggedIn, (req, res) => {
    return res.render("profile");
});

app.post("/profile", (req, res) => {
    let { age, city, link } = req.body;
    const user_id = req.session.userId;
    city = city.toLowerCase();
    if (Number.parseInt(age) < 18) {
        res.render("profile", {
            layout: "main",
            errorMessage: "sorry you are under 18",
        });
    } else if (!age) {
        age = null;
    } else if (!link) {
        link = null;
    } else if (!city) {
        city = null;
    } else if (!link.startsWith("http")) {
        link = "http://" + link;
        return res.render("profile", {
            errorMessage: "Please provide an HTTP url",
        });
    }
    db.addProfile({ user_id, age, city, link })
        .then(() => {
            console.log("add Profile went in then");
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("ERROR in addProfile: ", err);
            res.render("profile", {
                layout: "main",
                errorMessage: "Oh Oh something went wrong😳",
            });
        });
});


app.get(`/profile/edit`, (req, res) => {
    const user_id = req.session.userId;
    console.log(user_id);
    db.getUserDataByUserId(user_id)
        .then(({ rows }) => {
            const userData = rows[0];
            console.log(userData);
            res.render("profile-edit", {
                layout: "main",
                userData,
            });
        })
        .catch((err) => console.log("Error in getUserInfoByUserId: ", err));
});
app.post(`/profile/edit`, (req, res) => {
    const user_id = req.session.userId;
    const { first, last, email, password, age, city, link } = req.body;
    let userUpdatePromise;
    if (password) {
        hash(password).then((hashedPassword) => {
            userUpdatePromise = db.updateUserWithPassword({
                user_id,
                first,
                last,
                email,
                hashedPassword,
            });
        });
    } else {
        userUpdatePromise = db.updateUser({ user_id, first, last, email });
    }
   
    Promise.all([     
        userUpdatePromise,
        db.upsertProfile({ user_id, age, city, link }),
    ])
        .then(() => {
            res.redirect("/thanks");
        })

        .catch(() => {
            console.log("it goes into the catch")
            console.log(first, last, email, password, age, city, link);
            res.render("profile-edit", {
                layout: "main",
                errorMessage: "Oh Oh something went wrong😳",
            });
        });
});
app.post("/signature/update", (req, res) => {
    db.deleteSignature(req.session.userId)
    res.redirect("/petition");
});

app.get("/logout", (req, res) => {
    req.session = null;
    return res.redirect("/login");
});

app.listen(process.env.PORT || 8080, () =>
    console.log("Petition server, listening 🦻")
);
