const express = require('express');
const bodyParser = require('body-parser')
const { CloudantV1 } = require('@ibm-cloud/cloudant');
const client = CloudantV1.newInstance();
const DBNAME = process.env.DBNAME

//create the index on fruit (design document)


// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.use(express.static('public'))
app.use(bodyParser.json())

const createDesignDoc =  async function () {
  // for more information on Cloudant design documents see https://cloud.ibm.com/docs/Cloudant?topic=Cloudant-views-mapreduce
  //first see if the ddoc already exists
  
  try {
    await client.getDesignDocument({
      db: DBNAME,
      ddoc: 'fruitCounter'
    })
    console.log("design document exists")


  } catch (e) {
    //does not exist, so create it
    console.log("Creating design document")
    const designDoc = {
      "views": {
        "test": {
          "reduce": "_count",
          "map": "function (doc) {\n  emit(doc.fruit, null);\n}"
        }
      },
    }
    
    await client.putDesignDocument({
      db: DBNAME,
      designDocument: designDoc,
      ddoc: 'fruitCounter'
    })
      
  }
  
}

createDesignDoc()

app.post('/fruit', async (req, res) => {
  console.log(req.body);
  const fruit = req.body.fruit
  const fruitDocument = { 
    fruit: fruit,
    timestamp: new Date().toISOString()
  };

  // Save the document in the database
  const response = await client.postDocument({
    db: DBNAME,
    document: fruitDocument,
  });
  console.log(response)
  // now retrieve totals
  const totals = await client.postView({
    db: DBNAME,
    ddoc: 'fruitCounter',
    view: 'test',
    group: true
  })
  console.log(JSON.stringify(totals.result.rows))
  res.send({"totals":totals.result.rows})
});


app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);