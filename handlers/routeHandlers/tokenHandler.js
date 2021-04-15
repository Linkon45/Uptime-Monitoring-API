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
    const tokenID = typeof (requestProperties.body.tokenID) === 'string'
        && requestProperties.body.tokenID.trim().length === 20 ?
        requestProperties.body.tokenID : false;
    const extend = typeof (requestProperties.body.extend) === 'boolean' && requestProperties.body.extend === true ? true : false;

    if (tokenID && extend) {
        data.read('tokens', tokenID, (err, tokenData) => {
            if (!err) {
                const tokenObject = parseJSON(tokenData);
                if (tokenObject.expireTime > Date.now()) {
                    tokenObject.expireTime = Date.now() + (60 * 60 * 1000);
                    data.update('tokens', tokenID, tokenObject, (err1) => {
                        if (!err1) {
                            callback(200);
                        } else {
                            callback(500, {
                                error: 'There was a server side error!',
                            });
                        }
                    });

                }
                else {
                    callback(400, {
                        error: 'Token already expired!',
                    });

                }

            }
            else {
                callback(400, {
                    error: 'There was a problem in your request',
                });
            }
        })

    }
    else {
        callback(400, {
            error: 'There was a problem in your request',
        });

    }


};

handler._token.delete = (requestProperties, callback) => {
    const tokenID =
        typeof requestProperties.queryStringObject.tokenID === 'string' &&
            requestProperties.queryStringObject.tokenID.trim().length === 20
            ? requestProperties.queryStringObject.tokenID
            : false;
    if (tokenID) {
        data.read('tokens', tokenID, (err1, tokenData) => {
            if (!err1 && tokenData) {
                data.delete('tokens', tokenID, (err2) => {
                    if (!err2) {
                        callback(200, {
                            message: 'Token was successfully deleted!',
                        });
                    } else {
                        callback(500, {
                            error: 'There was a server side error!',
                        });
                    }
                });
            } else {
                callback(500, {
                    error: 'There was a server side error!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'There was a problem in your request!',
        });
    }
};

handler._token.verify = (tokenID, phone, callback) => {
    data.read('tokens', tokenID, (err, tokenData) => {
        if (!err && tokenData) {
            if (parseJSON(tokenData).phone === phone && parseJSON(tokenData).expireTime > Date.now()) {
                callback(true);
            }
            else {
                callback(false);
            }

        } else {
            callback(false);
        }
    });
};

module.exports = handler;
