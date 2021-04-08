// dependencies
const fs = require("fs");
const path = require("path");


// module scaffolding
const lib = {};


lib.basedir = path.join(__dirname, '/../.data/');


lib.create = (dir, file, data, callback) => {
    fs.open(`${lib.basedir + dir}/${file}.json`, 'wx', (err, fileDescriptor) => {

        console.log(fileDescriptor);
        if (!err && fileDescriptor) {
            const stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, (err2) => {
                if (!err2) {
                    fs.close(fileDescriptor, (err3) => {
                        if (!err3) {
                            callback(false);
                        }
                        else
                            callback('Error Closing the File');
                    })
                }
                else {
                    callback("Error writing to new File");
                }
            });
        }
        else {
            callback("There was an Error! File maybe already exist!");
        }
    });
};

lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.basedir + dir}/${file}.json`, 'utf8', (err, data) => {
        callback(err, data);
    });

};

lib.update = (dir, file, data, callback) => {
    fs.open(`${lib.basedir + dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            const stringData = JSON.stringify(data);
            fs.ftruncate(fileDescriptor, (err1) => {
                if (!err1) {
                    fs.writeFile(fileDescriptor, stringData, (err2) => {
                        if (!err2) {
                            fs.close(fileDescriptor, (err3) => {
                                if (!err3) {
                                    callback(false);
                                }
                                else {
                                    callback("Error closing file");
                                }
                            });
                        }
                        else {
                            callback("File update failed");
                        }
                    });
                }
                else {
                    callback("Error truncating file!")
                }
            });
        }
        else {
            callback("Error updating. File may not exist")
        }
    });

};

lib.delete = (dir, file, callback) => {
    fs.unlink(`${lib.basedir + dir}/${file}.json`, (err) => {
        if (!err) {
            callback(false);
        }
        else {
            callback(`Error deleting file`);
        }
    });

};

module.exports = lib;