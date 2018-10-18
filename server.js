require('dotenv').config();
const express = require("express");
const path = require("path");
const port = process.env.PORT || 8080;
const app = express();

// the __dirname is the current directory from where the script is running
const dist = path.resolve(__dirname, "dist");

app.use(express.static(dist));

// send the user to index html page inspite of the url

app.get("*", function(req, res) {
    res.sendFile(dist + "/index.html", null, function(err){
        if (err) console.log(err);
    });
});

console.log(process.env.MAP_API);

app.listen(port);
