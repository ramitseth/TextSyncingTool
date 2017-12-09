const http = require('http');
const opn = require('opn');
const DiffMatchPatch = require('diff-match-patch');
const hostname = '127.0.0.1';
const port = 3000;

const MongoClient = require('mongodb').MongoClient;
const dbName = "MGRM";
const collectionName = "Data";
const mongourl = "mongodb://localhost:27017";

var oldText, newText, username;

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

  newText = "";
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
          oldText = result;
          res.end("{\"Result\": \"" + result + "\"}");
          db.close();
        });
      });
    });

  } else if (req.url == '/saveData') {

    req.on('data', function (chunk) {
      newText += chunk;
    }).on('end', function () {
      saveData();
      res.end("{\"Result\": \"OK\"}");
    });

  } else {
    res.end("{\"Result\": \"Not a valid request\"}");
  }

});


saveData = function () {

  //Replacing \n (Escape Character) with a "\n" so we can parse it
  newText = newText.replace(/\n/g, "\\n");

  //calculate new text after merging the differences
  newText = JSON.parse(newText);
  var dmp = new DiffMatchPatch();
  var patches = dmp.patch_fromText(newText.changeslist);
  var results = dmp.patch_apply(patches, oldText);
  console.log(results[0]);

  //Inserting or Updating data in the database
  MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    var localDB = db.db(dbName);

    var searchQuery = {
      username: newText.username
    };
    var updateQuery = {
      $set: {
        text: results[0]
      }
    };
    localDB.collection(collectionName).updateOne(searchQuery, updateQuery, {
      upsert: true
    }, function (err, res) {
      if (err) throw err;
      oldText = results[0];
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