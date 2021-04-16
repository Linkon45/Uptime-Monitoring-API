// dependencies
const data = require("../../lib/data");
const { hash, parseJSON, randomStringGenerator } = require("../../helpers/utilities");
const tokenHandler = require("./tokenHandler");
const { maxChecks } = require("../../helpers/envirnoments");

// module scaffolding
const handler = {};
handler._check = {};

handler.checkHandler = (requestProperties, callback) => {
    const acceptedMethods = ["get", "post", "put", "delete"];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._check[requestProperties.method](requestProperties, callback);
    }
    else {
        callback(405);
    }
};


handler._check.post = (requestProperties, callback) => {
    const protocol = typeof (requestProperties.body.protocol) === 'string' && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 ? requestProperties.body.protocol : false;
    const url = typeof (requestProperties.body.url) === 'string' && requestProperties.body.url.trim().length > 0 ? requestProperties.body.url : false;
    const method = typeof (requestProperties.body.method) === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1 ? requestProperties.body.method : false;
    const statusCode = typeof (requestProperties.body.statusCode) === 'object' && requestProperties.body.statusCode instanceof Array ? requestProperties.body.statusCode : false;
    const timeOutSeconds = typeof (requestProperties.body.timeOutSeconds) === 'number' && requestProperties.body.timeOutSeconds % 1 === 0 && requestProperties.body.timeOutSeconds >= 1 && requestProperties.body.timeOutSeconds <= 5 ? requestProperties.body.timeOutSeconds : false;

    console.log("Hello");
    console.log(protocol, url, method, statusCode, timeOutSeconds);
    if (protocol && url && method && statusCode && timeOutSeconds) {
        const token =
            typeof requestProperties.headersObject.token === 'string'
                ? requestProperties.headersObject.token
                : false;

        data.read('tokens', token, (err1, tokenData) => {
            if (!err1 && tokenData) {
                const userPhone = parseJSON(tokenData).phone;

                data.read('users', userPhone, (err2, userData) => {
                    if (!err2 && userData) {
                        tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {

                            if (tokenIsValid) {
                                const userObject = parseJSON(userData);
                                const userChecks =
                                    typeof userObject.checks === 'object' &&
                                        userObject.checks instanceof Array
                                        ? userObject.checks
                                        : [];
                                if (userChecks.length <= maxChecks) {
                                    const checkId = randomStringGenerator(20);
                                    const checkObject = {
                                        checkId,
                                        userPhone,
                                        protocol,
                                        url,
                                        method,
                                        statusCode,
                                        timeOutSeconds,
                                    };

                                    data.create('checks', checkId, checkObject, (err3) => {
                                        if (!err3) {

                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId);


                                            data.update('users', userPhone, userObject, (err4) => {
                                                if (!err4) {
                                                    callback(200, checkObject);
                                                } else {
                                                    callback(500, {
                                                        error:
                                                            'There was a problem in the server side!',
                                                    });
                                                }
                                            });
                                        } else {
                                            callback(500, {
                                                error: 'There was a problem in the server side!',
                                            });
                                        }
                                    });
                                }
                                else {
                                    callback(401, {
                                        error: 'Userhas already reached max check limit!',
                                    });
                                }

                            }
                            else {
                                callback(403, {
                                    error: 'Authentication Problem',
                                });
                            }
                        });
                    } else {
                        callback(403, {
                            error: 'User not found!',
                        });

                    }
                });

            }
            else {
                callback(403, {
                    error: 'Authentication problem!',
                });
            }

        });

    }
    else {
        callback(400, {
            error: 'You have a problem in your request',
        });

    }

};

handler._check.get = (requestProperties, callback) => {
    const checkID = typeof (requestProperties.queryStringObject.checkID) === 'string'
        && requestProperties.queryStringObject.checkID.trim().length === 20 ?
        requestProperties.queryStringObject.checkID : false;
    if (checkID) {
        console.log(checkID);

        data.read('checks', checkID, (err, checkData) => {
            if (!err && checkData) {
                const token =
                    typeof requestProperties.headersObject.token === 'string'
                        ? requestProperties.headersObject.token
                        : false;
                tokenHandler._token.verify(token, parseJSON(checkData).userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        callback(200, parseJSON(checkData));
                    }
                    else {
                        callback(403, {
                            error: "Authentication Failure"
                        });
                    }
                });

            }
            else {
                callback(500, {
                    error: "You have a problem in your request",
                });
            }

        });

    } else {
        callback(403, {
            error: "You have a problem in your request",
        });

    }

};

handler._check.put = (requestProperties, callback) => {
    const checkID =
        typeof requestProperties.body.checkID === 'string' &&
            requestProperties.body.checkID.trim().length === 20
            ? requestProperties.body.checkID
            : false;

    const protocol =
        typeof requestProperties.body.protocol === 'string' &&
            ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
            ? requestProperties.body.protocol
            : false;

    const url =
        typeof requestProperties.body.url === 'string' &&
            requestProperties.body.url.trim().length > 0
            ? requestProperties.body.url
            : false;

    const method =
        typeof requestProperties.body.method === 'string' &&
            ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1
            ? requestProperties.body.method
            : false;

    const statusCode =
        typeof requestProperties.body.statusCode === 'object' &&
            requestProperties.body.statusCode instanceof Array
            ? requestProperties.body.statusCode
            : false;

    const timeOutSeconds =
        typeof requestProperties.body.timeOutSeconds === 'number' &&
            requestProperties.body.timeOutSeconds % 1 === 0 &&
            requestProperties.body.timeOutSeconds >= 1 &&
            requestProperties.body.timeOutSeconds <= 5
            ? requestProperties.body.timeOutSeconds
            : false;

    if (checkID) {
        if (protocol || url || method || statusCode || timeOutSeconds) {
            data.read('checks', checkID, (err1, checkData) => {
                if (!err1 && checkData) {
                    const checkObject = parseJSON(checkData);
                    const token =
                        typeof requestProperties.headersObject.token === 'string'
                            ? requestProperties.headersObject.token
                            : false;

                    tokenHandler._token.verify(token, checkObject.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            if (protocol) {
                                checkObject.protocol = protocol;
                            }
                            if (url) {
                                checkObject.url = url;
                            }
                            if (method) {
                                checkObject.method = method;
                            }
                            if (statusCode) {
                                checkObject.statusCode = statusCode;
                            }
                            if (timeOutSeconds) {
                                checkObject.timeOutSeconds = timeOutSeconds;
                            }

                            data.update('checks', checkID, checkObject, (err2) => {
                                if (!err2) {
                                    callback(200);
                                } else {
                                    callback(500, {
                                        error: 'There was a server side error!',
                                    });
                                }
                            });
                        } else {
                            callback(403, {
                                error: 'Authentication error!',
                            });
                        }
                    });
                } else {
                    callback(500, {
                        error: 'There was a problem in the server side!',
                    });
                }
            });
        } else {
            callback(400, {
                error: 'You must provide at least one field to update!',
            });
        }
    } else {
        callback(400, {
            error: 'You have a problem in your request',
        });
    }
};

handler._check.delete = (requestProperties, callback) => {
    const checkID =
        typeof requestProperties.queryStringObject.checkID === 'string' &&
            requestProperties.queryStringObject.checkID.trim().length === 20
            ? requestProperties.queryStringObject.checkID
            : false;

    console.log(checkID);
    if (checkID) {
        data.read('checks', checkID, (err1, checkData) => {
            if (!err1 && checkData) {
                const token =
                    typeof requestProperties.headersObject.token === 'string'
                        ? requestProperties.headersObject.token
                        : false;

                tokenHandler._token.verify(
                    token,
                    parseJSON(checkData).userPhone,
                    (tokenIsValid) => {
                        if (tokenIsValid) {
                            data.delete('checks', checkID, (err2) => {
                                if (!err2) {
                                    data.read(
                                        'users',
                                        parseJSON(checkData).userPhone,
                                        (err3, userData) => {
                                            const userObject = parseJSON(userData);
                                            if (!err3 && userData) {
                                                const userChecks =
                                                    typeof userObject.checks === 'object' &&
                                                        userObject.checks instanceof Array
                                                        ? userObject.checks
                                                        : [];

                                                const checkPosition = userChecks.indexOf(checkID);
                                                if (checkPosition > -1) {
                                                    userChecks.splice(checkPosition, 1);
                                                    userObject.checks = userChecks;
                                                    data.update(
                                                        'users',
                                                        userObject.phone,
                                                        userObject,
                                                        (err4) => {
                                                            if (!err4) {
                                                                callback(200);
                                                            } else {
                                                                callback(500, {
                                                                    error:
                                                                        'There was a server side problem!',
                                                                });
                                                            }
                                                        }
                                                    );
                                                } else {
                                                    callback(500, {
                                                        error:
                                                            'The check id that you are trying to remove is not found in user!',
                                                    });
                                                }
                                            } else {
                                                callback(500, {
                                                    error: 'There was a server side problem!',
                                                });
                                            }
                                        }
                                    );
                                } else {
                                    callback(500, {
                                        error: 'There was a server side problem!',
                                    });
                                }
                            });
                        } else {
                            callback(403, {
                                error: 'Authentication failure!',
                            });
                        }
                    }
                );
            } else {
                callback(500, {
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

module.exports = handler;
