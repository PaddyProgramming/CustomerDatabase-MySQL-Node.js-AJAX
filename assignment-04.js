// as per requirement (vi) I have added a check constraint to the title column in CustomerDetails to validate the Title field (using SQL script in DB)
// For testing I used Windows 10 OS, Chrome 88 browser, IDE=VSCode
//
// CODE TO SET UP REQUIRED MODULES, SERVER, AND DATABASE CONNECTION
//

// allow access to url module, provides utilities for URL resolution and parsing
var url = require("url");
// allow access to the querystring module, provide utilities for parsing and formatting URL query strings
const querystring = require("querystring");
// the server is set to listen on port 8080
const port = 8080;
// this line allows access to the HTTP module which allows server creation
const http = require("http");
// this line allows the program to read files (such as index.html) from the computer
// ref: https://www.w3schools.com/nodejs/nodejs_filesystem.asp
var fs = require("fs");
// ref: https://www.w3schools.com/nodejs/nodejs_mysql.asp
// necessary code for node.js and mysql
var mysql = require("mysql");
// creating connection to myphp mysql database using unqiue user + pw
var con = mysql.createConnection({
  host: "webcourse.cs.nuim.ie",
  user: "p210089",
  password: "eez7eepitoNgie5u",
  database: "cs230_p210089",
});

//
// CONNECTING TO THE DB
// ref: https://www.w3schools.com/nodejs/nodejs_mysql.asp

con.connect(function (err) {
  if (err) {
    console.log("Error connecting to the database, error: " + err.stack);
    return;
  }
  return console.log("Connection to database successful!");
});

//
// CREATING SERVER
//

var server = http.createServer();

//
// SET UP THE HTTP SERVER TO LISTEN ON PORT 8000
// ref: JK code

server.listen(port, function () {
  console.log("\nAJAX - API - Database Demo");
  console.log("CS230 Demo Program - Patrick Murphy\n(c) 2021\n");
  console.log("AJAX (HTTP) API server running on port: " + port + "\n");
});

//
// PROCESS.ON LISTENS FOR SIGINT (SIGNAL INTERRUPT - CTRL+C) WHICH WILL CAUSE CON.END TO BE ACTIONED WHICH KILLS THE CONNECTION TO THE DB
// ef: JK code

process.on("SIGINT", function () {
  con.end(function (err) {
    if (err) {
      return console.log("error:" + err.message);
    }
    console.log("\nDatabase (cs230_p210089): Disconnected!");
    process.exit();
  });
});

//
// SERVER PROCESSES REQUEST SENT FROM BROWSER (CLIENT)
// ef: JK code

server.on("request", function (request, response) {
  // get the route of the request from the url (/ or /api/user, /api/update, /api/user/delete, /api/user/matchCustomer)
  var currentRoute = url.format(request.url);
  // get the HTTP request type (POST - Create, Update, Delete; GET - Retrieve)
  var currentMethod = request.method;
  // will contain the extracted POST data later
  var requestBody = "";
  // determine the route (/ or /api/user)
  switch (currentRoute) {
    //
    // If no API call made then the default route is / so
    // just return the default index.html file to the user.
    // This contains the forms, etc. for making the CRUD
    // requests (only Create and Retrieve implemented)
    //

    case "/":
      // readFile accesses the index.html file from the computer
      fs.readFile(__dirname + "/assignment-04.html", function (err, data) {
        var headers = {
          // set the appropriate headers
          "Content-Type": "text/html",
        };
        response.writeHead(200, headers);
        // return the data (index.html) to the browser
        response.end(data);
      });
      break;

    //
    // Handle the requests from client made using the route /api/user
    // These come via AJAX embedded in the earlier served index.html
    // There will be a single route (/api/user) but two HTTP request methods
    // POST (for Create) and GET (for Retrieve)
    // CREATE AND RETRIEVE FUNCTIONALITY FOR CUSTOMER DETAILS
    //

    case "/api/user":
      //
      // Handle a POST request;  the user is sending user data via AJAX!
      // This is the CRUD (C)reate request. These data need to be
      // extracted from the POST request and saved to the database!
      // (C)RUD***CREATE FUNCTIONALITY
      //

      if (currentMethod === "POST") {
        // read the body of the POST request
        request.on("data", function (chunk) {
          requestBody += chunk.toString();
        });
        // determine the POST request Content-type (and log to console)
        // Either: (i)  application/x-www-form-urlencoded or (ii) application/json
        const { headers } = request;
        let ctype = headers["content-type"];
        console.log("RECEIVED Content-Type: " + ctype + "\n");
        // finished reading the body of the request
        request.on("end", function () {
          var userData = "";
          // saving the user from the body to the database
          if (ctype.match(new RegExp("^application/x-www-form-urlencoded"))) {
            userData = querystring.parse(requestBody);
          } else {
            userData = JSON.parse(requestBody);
          }
          // log the user data sent from the browser in the console
          console.log(
            "USER DATA RECEIVED: \n\n" +
              JSON.stringify(userData, null, 2) +
              "\n"
          );

          //
          // START OF TRANSACTION BLOCK NEEDED TO CARRY OUT MULTIPLE QUERIES - ADDED USER DATA TO CUSTOMER DETAILS TABLE, CUSTOMER HOME ADDRESS TABLE, AND CUSTOMER SHIPPING ADDRESS TABLE - ALL TOGETHER
          // ref: https://stackoverflow.com/questions/49529231/transaction-management-in-nodejs-with-mysql

          con.beginTransaction(function (err) {
            if (err) {
              throw err;
            }
            // First sql query - adding inputted data to customer details table
            var sql1 = `INSERT INTO CustomerDetailsv1 (Title, FirstName, Surname, Mobile, EmailAddress) VALUES ('${userData.Title}','${userData.FirstName}','${userData.Surname}','${userData.Mobile}','${userData.EmailAddress}')`;
            con.query(sql1, function (err, result) {
              if (err) {
                // if error, do not proceed with running query, roll back to start of transaction
                return con.rollback(function () {
                  throw err;
                });
              }
              // Second query - adding inputted data to customer home address table
              var sql2 = `INSERT INTO CustomerHomeAddressv1 (AddressLine1, AddressLine2, Town, County, Eircode) VALUES ('${userData.AddressLine1}','${userData.AddressLine2}','${userData.Town}','${userData.County}','${userData.Eircode}')`;
              con.query(sql2, function (err, result) {
                if (err) {
                  // if error, do not proceed with running query, roll back to start of transaction
                  return con.rollback(function () {
                    throw err;
                  });
                }
              });
              // Third query - adding inputted data to customer shipping address table
              var sql3 = `INSERT INTO CustomerShippingAddressv1 (AddressLine1, AddressLine2, Town, County, Eircode) VALUES ('${userData.AddressLine1}','${userData.AddressLine2}','${userData.Town}','${userData.County}','${userData.Eircode}')`;
              con.query(sql3, function (err, result) {
                if (err) {
                  // if error, do not proceed with running query, roll back to start of transaction
                  return con.rollback(function () {
                    throw err;
                  });
                }
                // this block of code commits the changes from the previous queries to the database
                con.commit(function (err) {
                  if (err) {
                    // if error, do not proceed with running query, roll back to start of transaction
                    return con.rollback(function () {
                      throw err;
                    });
                  }
                  console.log(
                    "Customer Created Succesfully - Customer Details, Customer Home Address, Customer Shipping Address: Updated"
                  );
                });
              });
              //  respond to the user with confirmation message
              var headers = {
                "Content-Type": "text/plain",
              };
              // handle the responses here after the database query completes!
              response.writeHead(200, headers);
              response.end(
                "User (" +
                  userData.FirstName +
                  " " +
                  userData.Surname +
                  ") data added to the Database!"
              );
            });
          });
        });
      }

      //
      // Handle a GET request;  the user is requesting user data via AJAX!
      // This is the CRUD (R)etrieve request. These data need to be
      // extracted from the database and returned to the user as JSON!
      // C(R)UD***RETRIEVE FUNCTIONALITY FOR ENTIRE CUSTOMER DATABASE
      //
      else if (currentMethod === "GET") {
        var headers = {
          "Content-Type": "application/json",
        };
        // return all rows of data from customer details table
        con.query(
          "SELECT * FROM CustomerDetailsv1",
          function (err, result, fields) {
            if (err) throw err;
            // print to terminal the found data
            console.log(result);
            console.log(
              "USER DATABASE REQUESTED: \n\n" +
                JSON.stringify(result, null, 2) +
                "\n"
            );
            response.writeHead(200, headers);
            response.end(JSON.stringify(result));
          }
        );
      }
      break;

    //
    // C(R)UD***RETRIEVE FUNCTIONALITY FOR MATCHING CUSTOMER NAME
    //

    case "/api/user/matchCustomer":
      if (currentMethod === "POST") {
        // read the body of the POST request
        request.on("data", function (chunk) {
          requestBody += chunk.toString();
        });
        // determine the POST request Content-type (and log to console)
        // Either: (i)  application/x-www-form-urlencoded or (ii) application/json
        const { headers } = request;
        let ctype = headers["content-type"];
        console.log("RECEIVED Content-Type: " + ctype + "\n");
        // finished reading the body of the request
        request.on("end", function () {
          var userData = "";
          // saving the user from the body to the database
          if (ctype.match(new RegExp("^application/x-www-form-urlencoded"))) {
            userData = querystring.parse(requestBody);
          } else {
            userData = JSON.parse(requestBody);
          }
          // log the user data sent from the browser in the console
          console.log(
            "USER DATA RECEIVED: \n\n" +
              JSON.stringify(userData, null, 2) +
              "\n"
          );
          var headers = {
            "Content-Type": "application/json",
          };
          var sql = `SELECT * FROM CustomerDetailsv1 WHERE FirstName='${userData.FirstName}'`;
          con.query(sql, function (err, result, fields) {
            if (err) throw err;
            // print to terminal the found data
            console.log(result);
            console.log(
              "USER DATABASE REQUESTED: \n\n" +
                JSON.stringify(result, null, 2) +
                "\n"
            );
            response.writeHead(200, headers);
            response.end(JSON.stringify(result));
          });
        });
      }
      break;

    //
    // CR(U)D***UPDATE FUNCTIONALITY
    //

    case "/api/user/update":
      if (currentMethod === "POST") {
        // read the body of the POST request
        request.on("data", function (chunk) {
          requestBody += chunk.toString();
        });
        // determine the POST request Content-type (and log to console)
        // Either: (i)  application/x-www-form-urlencoded or (ii) application/json
        const { headers } = request;
        let ctype = headers["content-type"];
        console.log("RECEIVED Content-Type: " + ctype + "\n");
        // finished reading the body of the request
        request.on("end", function () {
          var userData = "";
          // saving the user from the body to the database
          if (ctype.match(new RegExp("^application/x-www-form-urlencoded"))) {
            userData = querystring.parse(requestBody);
          } else {
            userData = JSON.parse(requestBody);
          }
          // log the user data to console
          console.log(
            "USER DATA RECEIVED: \n\n" +
              JSON.stringify(userData, null, 2) +
              "\n"
          );

          //
          // START OF TRANSACTION BLOCK NEEDED TO CARRY OUT MULTIPLE QUERIES, E.G UPDATE USER DATA IN CUSTOMER DETAILS, CUSTOMER HOME AND SHIPPIGNA DDRESS TABLES - BASED ON INPUTTED CUSTOMER ID
          //

          con.beginTransaction(function (err) {
            if (err) {
              throw err;
            }
            // First query - find customer with inputted data
            var sql1 = `SELECT * FROM CustomerDetailsv1 WHERE CustomerID=${userData.CustomerID}`;
            con.query(sql1, function (err, result) {
              if (result < 1) {
                // if customer not found, do not proceed with running query, roll back to start of transaction
                return con.rollback(function () {
                  response.writeHead(200, headers);
                  response.end(
                    "Customer (Customer ID " +
                      userData.CustomerID +
                      ") not found!"
                  );
                });
              }
              // Second sql query - updating customer details table with inputted data
              var sql2 = `UPDATE CustomerDetailsv1 SET Title='${userData.Title}', Mobile='${userData.Mobile}', EmailAddress='${userData.EmailAddress}' WHERE CustomerID=${userData.CustomerID}`;
              con.query(sql2, function (err, result) {
                if (err) {
                  // if error, do not proceed with running query, roll back to start of transaction
                  return con.rollback(function () {
                    throw err;
                  });
                }

                // Third query - updating customer home address with inputted data
                var sql3 = `UPDATE CustomerHomeAddressv1 SET AddressLine1='${userData.AddressLine1}', Town='${userData.Town}', County='${userData.County}' WHERE CustomerHomeAddressID=${userData.CustomerID}`;
                con.query(sql3, function (err, result) {
                  if (err) {
                    // if error, do not proceed with running query, roll back to start of transaction
                    con.rollback(function () {
                      throw err;
                    });
                  }

                  // Fourth query - adding inputted data to customer shipping address table
                  var sql4 = `UPDATE CustomerShippingAddressv1 SET AddressLine1='${userData.AddressLine1}', Town='${userData.Town}', County='${userData.County}' WHERE CustomerShippingAddressID=${userData.CustomerID}`;
                  con.query(sql4, function (err, result) {
                    if (err) {
                      // if error, do not proceed with running query, roll back to start of transaction
                      con.rollback(function () {
                        throw err;
                      });
                    }
                    // this block of code commits the changes from the previous queries to the database
                    con.commit(function (err) {
                      if (err) {
                        // if error, do not proceed with running query, roll back to start of transaction
                        con.rollback(function () {
                          throw err;
                        });
                      }
                      console.log(
                        "Customer Created Succesfully - Customer Details, Customer Home Address, Customer Shipping Address: Updated"
                      );
                    });
                  });
                });
              });
              //  respond to the user with confirmation message
              var headers = {
                "Content-Type": "text/plain",
              };
              // handle the responses here after the database query completes!
              response.writeHead(200, headers);
              response.end(
                "Customer ID (" + userData.CustomerID + ") has been updated!"
              );
            });
          });
        });
      }
      break;

    //
    // CRU(D)***DELETE FUNCTIONALITY
    //

    case "/api/user/delete":
      if (currentMethod === "POST") {
        // read the body of the POST request
        request.on("data", function (chunk) {
          requestBody += chunk.toString();
        });
        // determine the POST request Content-type (and log to console)
        // Either: (i)  application/x-www-form-urlencoded or (ii) application/json
        const { headers } = request;
        let ctype = headers["content-type"];
        console.log("RECEIVED Content-Type: " + ctype + "\n");
        // finished reading the body of the request
        request.on("end", function () {
          var userData = "";
          // saving the user from the body to the database
          if (ctype.match(new RegExp("^application/x-www-form-urlencoded"))) {
            userData = querystring.parse(requestBody);
          } else {
            userData = JSON.parse(requestBody);
          }
          // log the user data to console
          console.log(
            "USER DATA RECEIVED: \n\n" +
              JSON.stringify(userData, null, 2) +
              "\n"
          );

          //
          // START OF TRANSACTION BLOCK NEEDED TO CARRY OUT MULTIPLE QUERIES, E.G FIND USER DATA IN CUSTOMER DETAILS - THEN DELETE USER IF FOUND
          //

          con.beginTransaction(function (err) {
            if (err) {
              throw err;
            }
            // First query - find customer with inputted data
            var sql1 = `SELECT * FROM CustomerDetailsv1 WHERE EmailAddress='${userData.EmailAddress}' AND Mobile='${userData.Mobile}' AND FirstName='${userData.FirstName}'`;
            con.query(sql1, function (err, result) {
              if (result < 1) {
                // if customer not found, do not proceed with running query, roll back to start of transaction
                return con.rollback(function () {
                  response.writeHead(200, headers);
                  response.end(
                    "Customer (" +
                      userData.FirstName +
                      " Email Address: " +
                      userData.EmailAddress +
                      " Mobile:  " +
                      userData.Mobile +
                      ") not found!"
                  );
                });
              }

              // sql script deleting the customer data that matches the inputted email address, mobile and firstname
              var sql2 = `DELETE FROM CustomerDetailsv1 WHERE EmailAddress='${userData.EmailAddress}' AND Mobile='${userData.Mobile}' AND FirstName='${userData.FirstName}'`;
              con.query(sql2, function (err, result) {
                if (err) {
                  return con.rollback(function () {
                    throw err;
                  });
                }

                // this block of code commits the changes from the previous queries to the database
                con.commit(function (err) {
                  if (err) {
                    // if error, do not proceed with running query, roll back to start of transaction
                    return con.rollback(function () {
                      throw err;
                    });
                  }
                  console.log(
                    `USER RECORD DELETED: ['${userData.EmailAddress}','${userData.Mobile}','${userData.FirstName}']\n`
                  );
                });
              });
              // respond to the user with confirmation message
              var headers = {
                "Content-Type": "text/plain",
              };
              // handle the responses here after the database query completes!
              response.writeHead(200, headers);
              response.end(
                "User (" +
                  userData.FirstName +
                  " Email Address: " +
                  userData.EmailAddress +
                  " Mobile:  " +
                  userData.Mobile +
                  ") has been deleted from the Database!"
              );
            });
          });
        });
      }
      break;
  }
});

// Below is the back-end only CRUD functionality
// (*** you must comment out lines 33-39, the first con.connect call, in order for this code to work when uncommented)

// CREATE
// con.connect(function (err) {
// con.beginTransaction(function (err) {
//   if (err) {
//     throw err;
//   }
//   // First sql query - adding inputted data to customer details table
//   var sql1 = `INSERT INTO CustomerDetailsv1 (Title, FirstName, Surname, Mobile, EmailAddress) VALUES ('Mr','John','Doe','12345','johndoe@mail.com')`;
//   con.query(sql1, function (err, result) {
//     if (err) {
//       // if error, do not proceed with running query, roll back to start of transaction
//       return con.rollback(function () {
//         throw err;
//       });
//     }
//     // Second query - adding inputted data to customer home address table
//     var sql2 = `INSERT INTO CustomerHomeAddressv1 (AddressLine1, AddressLine2, Town, County, Eircode) VALUES ('The Road','Ave','Dublin','Dublin','F123456')`;
//     con.query(sql2, function (err, result) {
//       if (err) {
//         // if error, do not proceed with running query, roll back to start of transaction
//        return con.rollback(function () {
//           throw err;
//         });
//       }
//     });
//     // Third query - adding inputted data to customer shipping address table
//     var sql3 = `INSERT INTO CustomerShippingAddressv1 (AddressLine1, AddressLine2, Town, County, Eircode) VALUES ('The Road','Ave','Dublin','Dublin','F123456')`;
//     con.query(sql3, function (err, result) {
//       if (err) {
//         // if error, do not proceed with running query, roll back to start of transaction
//         return con.rollback(function () {
//           throw err;
//         });
//       }
//       // this block of code commits the changes from the previous queries to the database
//       con.commit(function (err) {
//         if (err) {
//           // if error, do not proceed with running query, roll back to start of transaction
//           return con.rollback(function () {
//             throw err;
//           });
//         }
//         console.log(
//           "Customer Created Succesfully - Customer Details, Customer Home Address, Customer Shipping Address: Updated"
//         );
//       });
//     });
//   });
// });
// });

// RETRIEVE FUNCTIONALITY
// WHERE name = Jack
// con.connect(function (err) {
//   if (err) throw err;
//   console.log("Database: Connected!");
//   // this query retrieves all data from table WHERE FirstName = Jack
// con.query("SELECT * FROM CustomerDetailsv1 WHERE FirstName = 'Jack'", function (err, result, fields) {
//   if (err) throw err;
//   // print to terminal the found data
//   console.log(result);
// });
// });

// UPDATE FUNCTIONALITY
// con.connect(function (err) {
// con.beginTransaction(function (err) {
//   if (err) {
//     throw err;
//   }
//   // First sql query - updating customer details table with inputted data
//   var sql1 = `UPDATE CustomerDetailsv1 SET Title='Mx', Mobile='5555555', EmailAddress='updatedEmailAddress@mail.com' WHERE CustomerID=1`;
//   con.query(sql1, function (err, result) {
//     if (err) {
//       // if error, do not proceed with running query, roll back to start of transaction
//       return con.rollback(function () {
//         throw err;
//       });
//     }
//     // Second query - updating customer home address with inputted data
//     var sql2 = `UPDATE CustomerHomeAddressv1 SET AddressLine1='New Street', Town='New Town', County='New County' WHERE CustomerHomeAddressID=1`;
//     con.query(sql2, function (err, result) {
//       if (err) {
//         // if error, do not proceed with running query, roll back to start of transaction
//         return con.rollback(function () {
//           throw err;
//         });
//       }
//     });
//     // Third query - adding inputted data to customer shipping address table
//     var sql3 = `UPDATE CustomerShippingAddressv1 SET AddressLine1='New Street', Town='New Town', County='New County' WHERE CustomerShippingAddressID=1`;
//     con.query(sql3, function (err, result) {
//       if (err) {
//         // if error, do not proceed with running query, roll back to start of transaction
//         return con.rollback(function () {
//           throw err;
//         });
//       }
//       // this block of code commits the changes from the previous queries to the database
//       con.commit(function (err) {
//         if (err) {
//           // if error, do not proceed with running query, roll back to start of transaction
//           return con.rollback(function () {
//             throw err;
//           });
//         }
//         console.log(
//           "Customer Created Succesfully - Customer Details, Customer Home Address, Customer Shipping Address: Updated"
//         );
//       });
//     });
//   });
// });
// });

//  DELETE FUNCTIONALITY
// delete data based on combined email, mobile and firstname values
// con.connect(function(err) {
//   if (err) throw err;
// // sql script deleting the customer data that matches the inputted email address, mobile and firstname
// var sql = `DELETE FROM CustomerDetailsv1 WHERE EmailAddress='updatedEmailAddress@mail.com' AND Mobile='5555555' AND FirstName='John'`;
// con.query(sql, function (err, result) {
//   if (err) throw err;
//   console.log(
//     `USER RECORD DELETED: [EmailAddress=updatedEmailAddress@mail.com AND Mobile=5555555 AND FirstName=John]`
//   );
// });
// });
