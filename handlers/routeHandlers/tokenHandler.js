// dependencies
const data = require("../../lib/data");
const { hash, parseJSON, randomStringGenerator } = require("../../helpers/utilities");


// module scaffolding
const handler = {};
handler._token = {};

handler.tokenHandler = (requestProperties, callback) => {
    const acceptedMethods = ["get", "post", "put", "delete"];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._token[requestProperties.method](requestProperties, callback);
    }
    else {
        callback(405);
    }
};


handler._token.post = (requestProperties, callback) => {
    const phone = typeof (requestProperties.body.phone) === 'string'
        && requestProperties.body.phone.trim().length === 11 ?
        requestProperties.body.phone : false;
    const password = typeof (requestProperties.body.password) === 'string'
        && requestProperties.body.password.trim().length > 0 ?
        requestProperties.body.password : false;
    if (phone && password) {
        data.read('users', phone, (err, dataString) => {
            if (!err) {
                if (hash(password) === parseJSON(dataString).password) {
                    const tokenID = randomStringGenerator(20);
                    const expireTime = Date.now() + (60 * 60 * 1000);
                    const tokenObject = {
                        phone,
                        tokenID,
                        expireTime,
                    };
                    data.create('tokens', tokenID, tokenObject, (err2) => {
                        if (!err2) {
                            callback(200, tokenObject);

                        }
                        else {
                            callback(500, {
                                error: 'There was a problem in the server side!',
                            });
                        }

                    });

                } else {
                    callback(400, {
                        error: 'Invalid Password!',
                    });
                }

            } else {
                callback(400, {
                    error: 'You have a problem in your request',
                });
            }

        });

    } else {
        callback(400, {
            error: 'You have a problem in your request',
        });
    }

};

handler._token.get = (requestProperties, callback) => {
    const tokenID = typeof (requestProperties.queryStringObject.tokenID) === 'string'
        && requestProperties.queryStringObject.tokenID.trim().length === 20 ?
        requestProperties.queryStringObject.tokenID : false;
    if (tokenID) {
        data.read('tokens', tokenID, (err, u) => {
            const token = { ...parseJSON(u) };
            if (!err && token) {
                callback(200, token);
            } else {
                callback(404, {
                    error: 'Requested token was not found!',
                });
            }
        });
    } else {
        callback(404, {
            error: 'Requested token was not found!',
        });
    }
};

handler._token.put = (requestProperties, callback) => {

};

handler._token.delete = (requestProperties, callback) => {
};

module.exports = handler;
