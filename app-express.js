const http = require('http');
const opn = require('opn');
const DiffMatchPatch = require('diff-match-patch');
const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const hostname = '127.0.0.1';
const port = 3000;
const app = express();
const urlencodedParser = bodyParser.urlencoded({
    extended: false
});

const dbName = "MGRM";
const collectionName = "Data";
const mongourl = "mongodb://localhost:27017";

var oldText, newText, username;

//create a mongo database and a collection while the server starts up
MongoClient.connect(mongourl, function (err, db) {
    if (err) {
        console.log(err.message);
    } else {
        var localDB = db.db(dbName);
        localDB.createCollection(collectionName, function (err, result) {
            if (err) {
                console.log(err.message);
            } else {
                console.log("Mongo DB connection established");
            }
            db.close();
        });
    }
});


//Enable CORS for express
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});


//Start the local express server
var server = app.listen(port, function () {
    console.log(`Server running at http://${hostname}:${port}/`);
})


//Opening a local file in default browser, we can change it to URL later
opn('client/client-express.html');


// This responds to the request for getting the text
app.post('/getData', urlencodedParser, function (req, res) {
    username = req.body.username;

    //Try to find the data in database at launch
    MongoClient.connect(mongourl, function (err, db) {
        if (err) {
            console.log(err.message);
            res.end("{\"Result\": \"Error\"}");
        } else {
            var localDB = db.db(dbName);
            var searchQuery = {
                username: username
            };
            localDB.collection(collectionName).findOne(searchQuery, function (err, result) {
                db.close();
                if (err) {
                    console.log(err.message);
                    res.end("{\"Result\": \"Error\"}");
                } else {
                    console.log(result);
                    if (result) {
                        oldText = result.text;
                    } else {
                        oldText = '';
                    }
                    res.end("{\"Result\": \"" + oldText + "\"}");
                }
            });
        }
    });
})


// This responds to the request for saving the text
app.post('/saveData', urlencodedParser, function (req, res) {
    var changeslist = req.body.changeslist;
    var username = req.body.username;

    //calculate new text after merging the differences
    var dmp = new DiffMatchPatch();
    var patches = dmp.patch_fromText(changeslist);
    var results = dmp.patch_apply(patches, oldText);

    //Inserting or Updating data in the database
    MongoClient.connect(mongourl, function (err, db) {
        if (err) {
            console.log(err.message);
            res.end("{\"Result\": \"Error\"}");
        } else {
            var localDB = db.db(dbName);
            var searchQuery = {
                username: username
            };
            var updateQuery = {
                $set: {
                    text: results[0]
                }
            };
            localDB.collection(collectionName).updateOne(searchQuery, updateQuery, {
                upsert: true
            }, function (err, result) {
                db.close();
                if (err) {
                    console.log(err.message);
                    res.end("{\"Result\": \"Error\"}");
                } else {
                    oldText = results[0];
                    console.log("1 document updated");
                    res.end("{\"Result\": \"OK\"}");
                }
            });
        }
    });
})