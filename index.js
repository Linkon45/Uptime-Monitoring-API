// dependencies
const http = require("http");
const { handleReqRes } = require("./helpers/handleReqRes");
const envirnoment = require('./helpers/envirnoments');
const data = require('./lib/data');


// module scaffolding
const app = {};


data.delete('test', 'newFile1', (err) => {
    console.log(err);
});

// create server
app.createServer = () => {
    const server = http.createServer(app.handleReqRes);
    server.listen(envirnoment.port, () => {
        console.log(`Listening to the port ${envirnoment.port}`);
    })
}


// handle req-res
app.handleReqRes = handleReqRes;

// start the server
app.createServer();