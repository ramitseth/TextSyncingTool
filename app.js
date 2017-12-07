const http = require('http');
const opn = require('opn');
const hostname = '127.0.0.1';
const port = 3000;

var MongoClient = require('mongodb').MongoClient;
var dbName = "MGRM", collectionName = "Data";
var mongourl = "mongodb://localhost:27017";

var text, username;

//create a mongo database and a collection while the server starts up
MongoClient.connect(mongourl, function (err, db) {
  if (err) throw err;
  var localDB = db.db(dbName);
  localDB.createCollection(collectionName, function (err, res) {
    if (err) throw err;
    db.close();
  });
});

const server = http.createServer((req, res) => {

  text = "";
  username = "";
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*' // implementation of CORS
  });

  if (req.url == '/getData') {

    req.on('data', function (chunk) {
      username += chunk;
    }).on('end', function () {
      username = JSON.parse(username);

      //Try to find the data in database at launch
      MongoClient.connect(mongourl, function (err, db) {
        if (err) throw err;
        var localDB = db.db(dbName);
        localDB.collection(collectionName).findOne(username, function (err, result) {
          if (err) throw err;
          console.log(result);
          if (result) {
            result = result.text;
          } else {
            result = "";
          }
          res.end("{\"Result\": \"" + result + "\"}");
          db.close();
        });
      });
    });

  } else if (req.url == '/saveData') {

    req.on('data', function (chunk) {
      text += chunk;
    }).on('end', function () {
      saveData();
      res.end("{\"Result\": \"OK\"}");
    });

  } else {
    res.end("{\"Result\": \"Not a valid request\"}");
  }

});


saveData = function () {
  //Replacing \n (Escape Character) with a Space
  text = text.replace(/\n/g, " ");
  text = JSON.parse(text);

  //Inserting or Updating data in the database
  MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    var localDB = db.db(dbName);

      var searchQuery = {
        username: text.username
      };
      var updateQuery = {
        $set: text
      };
      localDB.collection(collectionName).updateOne(searchQuery, updateQuery, { upsert: true }, function (err, res) {
        if (err) throw err;
        console.log("1 document updated");
        db.close();
      });    
  });
}

//start the local server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

//Opening a local file in default browser, we can change it to URL later
opn('client/client.html');