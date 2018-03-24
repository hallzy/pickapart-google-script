// For a sheet with
// URL = https://docs.google.com/spreadsheets/d/1RSklW9SKI535TG0LnH9cjU2c3spLtnbPBAKWahUWO7I/edit#gid=0
// Change these variables variable
var spreadsheet_id = "FILL THIS!"
var debug = false
var auto_update_check = false;
var branch_to_check_for_updates = "master";
var api_token = ""
var extra_recipients = []




var email_cars_body = "";

// Email class.
function Email(subject, body) {
  this.body = body;
  this.subject = subject;
  this.recipient = Session.getActiveUser().getEmail();
  this.Send = function() {
    MailApp.sendEmail(this.recipient, this.subject, this.body);
  };
  this.SendToOthers = function() {
    for (var i = 0; i < extra_recipients.length; i++) {
      Logger.log("Sending \"" + this.subject + "\" email to \"" + extra_recipients[i] + "\"");
      MailApp.sendEmail(extra_recipients[i], this.subject, this.body);
    }
  };
}

function email_log() {
  var e = new Email();
  e.body = Logger.getLog();
  e.subject = "Pickapart Script: Execution Log"
  e.Send();
}

function email_error(err) {
  var e = new Email();
  e.body = "Error at: " + err.lineNumber + ": " + err.message;
  e.subject = "Pickapart Script: Error"
  e.Send();
}

function email_cars() {
  var e = new Email();
  e.body = email_cars_body
  e.subject = "Pickapart Script: Lot Update"
  e.Send();
  e.SendToOthers();
}


function getCarURL(model) {
  var url ="http://stmhall.ca/pickapart_json.php?query=select * from lot where model = '" + model + "'"

  Logger.log("URL: " + url);
  return url;
}

function getCarURL_no_json(model) {
  var url ="http://stmhall.ca/pickapart.php?query=select * from lot where model = '" + model + "'"

  Logger.log("URL: " + url);
  return url;
}

function email_alert_for_script_update(newhash, oldhash) {
  var body = "An update has been made to the script.";
  body = body + "\n\n";
  body = body + "Check \"https://github.com/hallzy/pickapart-google-script\"";
  body = body + "\n\n";
  body = body + "The last time an update check was made the current commit ";
  body = body + "hash was \"" + oldhash + "\"";
  body = body + "\n\n";
  body = body + "Now the current hash is \"" + newhash + "\"";
  var subject = "Automated Message: Pickapart Script Ready for Update"
  var e = new Email(subject, body);
  e.Send();
}

function stringifyElement(car) {
  var string = "  - Added on " + car['date_added'] + " - "
  string += car['year'] + " " + car['make'] + " " + car['model'] + " - "
  string += car['body_style'] + " "
  string += car['engine'] + " "
  string += car['transmission'] + " Transmission - "
  string += car['description'] + " - "
  string += car['stock']

  return string;
}

function getResponse(model) {
  var url = getCarURL(model);

  // If we fail to get a response, send off some logs and exit
  var exit_now = false;
  try {
    var response = UrlFetchApp.fetch(url);
  }
  catch(e) {
    exit_now = true;
    var err = e;
  }

  if (exit_now == true) {
   email_cars();
    if (debug == true) {
      email_log();
    }

    email_error(err);
    throw err;
  }
  return response;
}

function check_for_updates(sheet) {
  // Get the URL to check. This will be the Github page with the list of commits
  // for the specified branch
  var url = "https://api.github.com/repos/hallzy/pickapart-google-script/commits/"
  url = url + branch_to_check_for_updates;

  // If an API token has been specified then use it, otherwise, don't.
  if (api_token !== "") {
    url = url + "?access_token="
    url = url + api_token
  }
  Logger.log("API URL = " + url)

  // Get the page as a string
  try {
    var newhash = UrlFetchApp.fetch(url).getContentText()
  }
  catch(e) {
    Logger.log("Github API Error. No commit found.")
    email_error(e)
    throw e
  }

  try {
    newhash = JSON.parse(newhash)
  }
  catch(e) {
    Logger.log("Failed to Parse \"newhash\"")
    email_error(e)
    throw e
  }

  try {
    newhash = newhash["sha"]
  }
  catch(e) {
    Logger.log("No hash in JSON")
    email_error(e)
    throw e
  }
  Logger.log(newhash)

  var oldhash;
  // Get the previously saved hash from the sheet
  if (sheet.isVersionHashBlank()) {
    Logger.log("hash is initialized to: " + newhash);
    sheet.setVersionHash(newhash)
  }
  else {
    oldhash = sheet.getVersionHash()
    if (newhash != oldhash) {
      Logger.log("hash is now: " + newhash);
      email_alert_for_script_update(newhash, oldhash);
      sheet.setVersionHash(newhash)
    }
  }
  Logger.log("Old hash is: " + oldhash);
}


// Google Sheet Class//{{{
function GoogleSheet() {
  this.base       = SpreadsheetApp.openById(spreadsheet_id).getSheets()[0];
  this.getData    = this.base.getDataRange().getValues();
  this.getLastRow = this.base.getDataRange().getLastRow();

  this.getModel = function(index) {
    return this.getData[index][0];
  };

  this.getCurrentJson = function(index) {
    return this.getData[index][1];
  };

  this.isJsonColumnBlank = function(model) {
    return this.base.getRange(model+1, 2).isBlank();
  };

  this.setCurrentJson = function(model, string) {
    this.base.getRange(model+1, 2).setValue(string);
  };

  this.getVersionHash = function() {
    return this.getData[0][3]
  };

  this.isVersionHashBlank = function() {
    return this.base.getRange(1, 4).isBlank();
  };

  this.setVersionHash = function(hash) {
    this.base.getRange(1, 4).setValue(hash);
  };

  this.Update = function() {
    this.base       = SpreadsheetApp.openById(spreadsheet_id).getSheets()[0];
    this.getData    = this.base.getDataRange().getValues();
    this.getLastRow = this.base.getDataRange().getLastRow();
  };
}
//}}}

function run() {
  // Get the google sheet with pickapart data
  var sheet = new GoogleSheet();

  if (auto_update_check == true) {
    check_for_updates(sheet);
  }

  var send_car_email=false;

  var k;
  // Iterate through every model
  for (k = 0; k < sheet.getLastRow; k++) {
    var currentmodel_index = k;

    sheet.Update();

    var model = sheet.getModel(currentmodel_index).toString();
    Logger.log("==============================");
    Logger.log("Model Name: " + model);
    Logger.log("Model Index: " + k);
    var sheet_num_cars = undefined;


    if (sheet.isJsonColumnBlank(currentmodel_index)) {
      var sheet_json = {};
      sheet_num_cars = 0
    }
    else {
      var sheet_json = JSON.parse(sheet.getCurrentJson(currentmodel_index));
      sheet_num_cars = sheet_json.length
    }

    var response = getResponse(model);


    var json_string = response.getContentText();
    var api_json = JSON.parse(json_string);
    var api_num_cars = api_json.length;

    var array_of_new_cars = new Array();
    var array_of_old_cars = new Array();
    if (sheet_num_cars != 0) {
      var found = 0
      for (var new_index = 0; new_index < api_num_cars; new_index++) {
        for (var old_index = 0; old_index < sheet_num_cars; old_index++) {
          if (api_json[new_index]['stock'] == sheet_json[old_index]['stock']) {
            found = 1;
            break;
          }
        }
        if (found == 0) {
          Logger.log("Found New Car");
          array_of_new_cars.push(api_json[new_index]);
        }
        found = 0
      }

      found = 0
      for (var old_index = 0; old_index < sheet_num_cars; old_index++) {
        for (var new_index = 0; new_index < api_num_cars; new_index++) {
          if (api_json[new_index]['stock'] == sheet_json[old_index]['stock']) {
            found = 1;
            break;
          }
        }
        if (found == 0) {
          Logger.log("Found Old Car");
          array_of_old_cars.push(sheet_json[old_index]);
        }
        found = 0
      }
    }
    else {
      array_of_new_cars = api_json
    }
    var num_new_cars = array_of_new_cars.length
    var num_old_cars = array_of_old_cars.length


    Logger.log(model + " (" + api_num_cars + " On the Lot)");
    var car_url = getCarURL_no_json(model);
    car_url = car_url.replace(/ /g, "%20");
    car_url = car_url.replace(/'/g, "%27");
    email_cars_body += model + " (" + api_num_cars + " On the Lot)\n"
    email_cars_body += car_url + ";\n"

    if (num_new_cars > 0) {
      send_car_email=true
      Logger.log("New " + model + "s :");
      email_cars_body += "New " + model + "s :\n"
      for (var i = 0; i < num_new_cars; i++) {
        var string = stringifyElement(array_of_new_cars[i]);
        email_cars_body += string + "\n"
        Logger.log(string);
      }
    }

    if (num_old_cars > 0) {
      send_car_email=true
      Logger.log("Removed " + model + "s :");
      email_cars_body += "Removed " + model + "s :\n"
      for (var i = 0; i < num_old_cars; i++) {
        var string = stringifyElement(array_of_old_cars[i]);
        email_cars_body += string + "\n"
        Logger.log(string);
      }
    }

    email_cars_body += "\n\n"


    var myJsonString = JSON.stringify(api_json);
    sheet.setCurrentJson(currentmodel_index, myJsonString);
  }

  if (send_car_email) {
    email_cars();
  }

  if (debug == true) {
    email_log();
  }

}
