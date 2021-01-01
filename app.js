console.log(timestamp()+"app PIM1 started..");
const HOST = process.env.HOST || "127.0.0.1"
const PORT = process.env.PORT || 80

// ===== mongodb user infomation fields
const dbName = "nodejsdb"
const dbCollection = "pim"
const dbUser = "user1"
const dbPassword ="user1password"
// const dbURI = "mongodb+srv://"+ dbUser +":"+ dbPassword
//              +"@cluster0.l5cox.mongodb.net/"+dbName+"?retryWrites=true&w=majority";
const dbURI = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.l5cox.mongodb.net/${dbName}?retryWrites=true&w=majority`;

// ====== express ===== 
const express = require("express");
const app = express();
app.use(express.json());    // for parsing application/json
app.use(express.urlencoded({extended:true})); // for parsing application/x-www-form-urlencoded
app.use(express.static("public"));

// ===== mongodb contructor =====
const { MongoClient } = require("mongodb");
const dbClient = new MongoClient(dbURI, {useNewUrlParser:true, useUnifiedTopology:true});
dbClient.connect(()=>{
    console.log(timestamp()+"MongoDB Atlas connected!!");
    app.listen(PORT);        //指定 HOST時，遠端機器無法 access?
    console.log(timestamp()+"app Running on http://%s:%s",HOST,PORT);
});

// ===== express route handling =====
app.get("/", (req, res)=>{
    console.log(timestamp()+"home page request received..");
    res.status(200).sendFile("index.html");
});

app.get("/findAll", function(req, res){
    console.log(timestamp()+"list all request received...");
    db_findAll(res);
});

app.put("/insert", function(req, res){
    console.log(timestamp()+"insert request received...");
    db_insertOne(req.body, res);
});

app.put("/update", function(req, res){
    console.log(timestamp()+"update request received...");
    db_updateOne(req.body, res);
});

app.put("/delete", function(req, res){
    console.log(timestamp()+"delete request received...");
    db_deleteOne(req.body._id, res);
});

//===== 404 handling =================================================
app.use((req, res) => {
    res.status(404).sendFile(__dirname+"/public/404.html");
});
//===== mongodb operation ============================================
async function db_findAll(res) {	
    try {
        const collection = dbClient.db(dbName).collection(dbCollection);
        collection.find({}).toArray(function (err, docs) {
            res.status(200).send(JSON.stringify(docs)); //return JSON Object 
        });  
    } catch (err) {
        console.error(err);
    }
};

async function db_insertOne(docs, res) {	
    try {
        const collection = dbClient.db(dbName).collection(dbCollection);
        await collection.insertOne(docs);
        res.status(200).send('insert done....');				//讓Browser停止等待
    } catch (err) {
        if (err.name === 'MongoError' && err.code === 11000) {
            console.log(timestamp()+"duplicated id!!");
            res.status(409).send('duplicated id!!')
        } 
    }
};

async function db_updateOne(doc, res) {	
    try {
        const collection = dbClient.db(dbName).collection(dbCollection);
        await collection.updateOne(
                {"_id": doc._id.toString()},
                {$set: { name : doc.name, email : doc.email }});
        res.status(200).send('update done....');				//讓Browser停止等待
    } catch (err) {
        console.error(err);
    } 
};

async function db_deleteOne(id, res) {	
    try {
        const collection = dbClient.db(dbName).collection(dbCollection);
        await collection.deleteOne({"_id": id.toString()});
        res.status(200).send('delete done...');				//讓Browser停止等待
    } catch (err) {
        console.error(err);
    } 
};

// ===== common function definition =====
function timestamp() {
	var nowDate = new Date();
	var result = nowDate.toLocaleDateString() + " "+ nowDate.toLocaleTimeString();
    return result+" => ";
};
