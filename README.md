# Pickapart Notification

This is a google script that fetches data from pickapart about the vehicles that
are on the lot, and will send you an email when a new car comes into the lot, or
a car leaves the lot if it matches a type of car that you want to track.

## Initial Setup

This will be a step by step guide to start using the script:

Open you Google Drive, and create a new Google Script file by clicking `New ->
more -> Google Apps Script`. Call it whatever you want, and just copy the
contents of `pickapart-alert.gs` to this new file. You can bury it in any
folder you want, it doesn't care where it goes.

In your Google Drive, create a new spreadsheet and call it whatever you want.
We will use this spreadsheet to start adding cars to track. As a start, put the
name of a car model into cell A1. Note that the "A" column is where all the
car model names will be. Column "B" will be used by the script to save the cars
that match that model that are still currently on the lot.

### Overview of the Columns

#### Column A

Column `A` is used to hold the car model name that you want to look for
(example: "civic").

#### Column B

This Column Holds a json string of all the car data from pickapart that matches
your model search. You will never have to change this column. It is used by the
script only to figure out what cars are new or have been removed since the last
execution of the script.

#### Column D

This column is currently only used for cell `D1` to hold the current commit hash
of the program. This is used by the script to figure out if an update has been
made to the script since the last time it was executed.

### Continuing with Instructions

Now open the script from the first step. There is a line at the top of the file
like this:

```javascript
var spreadsheet_id = "FILL THIS!"
```

Change the `FILL THIS!` to the id of the spreadsheet you made in the previous
step. The id is found in the URL of the spreadsheet. If the spreadsheet has this
URL:

``` docs.google.com/spreadsheets/d/1RSklW9SKI535TG0LnH9cjU2c3spLtnbPBAKWahUWO7I/edit#gid=0 ```

Then `1RSklW9SKI535TG0LnH9cjU2c3spLtnbPBAKWahUWO7I` is your id, so the
`spreadsheet_id` variable changes to this:

```javascript
var spreadsheet_id = "1RSklW9SKI535TG0LnH9cjU2c3spLtnbPBAKWahUWO7I"
```

Now make sure that the script is saved. And run the script by pressing `Run ->
run`. Google will ask you about some permissions such as asking if it is okay
for the script to use spreadsheets and stuff like that. You have to say yes or
the script won't run. If you added something to your sheet earlier, we should
now see that column `B` has updated in some way.

Finally, while still inside the script, at the top of the screen click:
`Resources -> Current Project's Triggers`. Now click the blue text that says `No
triggers set up. Click here to add one now`.

For the drop down menu under "Run" make sure you select "run". This runs the
"run" function inside the script. For events, you can select any type of trigger
you want. This will determine how often the script is run automatically. Please
note that the database this script parses only updates every hour so any
granularity smaller than 1 hour won't have any effect.

From this there is also a `notifications` button. If you set this up, the script
will email you if it fails for some reason.

Now we are done. You will never need to go back to the script. If you want to
ever add or delete a show from being searched for, just edit the spreadsheet
file.

## Updating Your Script

If you want to get a newer version of this script remove all the code from the
current script you have, while saving the variables at the top of the code such
as your spreadsheet id.

Copy all of the new code into your current script (which is now empty) and
replace the variables at the top with your settings.

Check to see if the new code has a new variable at the top of the code. If you
are unsure of what a variable is for or the possible options you can give, then
see below in the section "Configuration Variables".

Once you have filled in the variables, save the file and do a manual run. This
will check to see if the script now requires new permissions for newly added
features. In order to continue accept the new requirements.



## Configuration Variables

All variables must contain a value of some kind.



### var spreadsheet_id

This is a string that comes from the URL of the spreadsheet you will use to
store your tv shows. For example, if your spreadsheet has the URL
`https://docs.google.com/spreadsheets/d/1RSklW9SKI535TG0LnH9cjU2c3spLtnbPBAKWahUWO7I/edit#gid=0`,
then your `spreadsheet_id` is `"1RSklW9SKI535TG0LnH9cjU2c3spLtnbPBAKWahUWO7I"`,
with the quotes included.

This is essential in order to get the script to work.



### var debug

This variable tells the script if you want to get emailed log reports.

#### Default

The default setting is `false`.

#### Possible Values:

`var debug = true` means that you want to get emails with the logs for
every execution of the script.

`var debug = false` means that you do NOT want to get emails with the logs
at all.


### var auto_update_check

This variable tells the script if you want the update function to run
automatically when you run your script. When the update script is run you will
get a email if an update has happened since the last time the script ran. You
will not receive an email at any other time.

Note that this will **NOT** update the script. It will just warn you of updates
that have occurred.

#### Default

The default setting is `true`.

#### Possible Values:

`var auto_update_check = true` Means to check for updates automatically before
looking for TV Shows.

`var auto_update_check = false` Means that the script will never automatically
check for updates for you. So you will need to manually run the
`check_for_updates` function in order to get updates.


### var branch_to_check_for_updates

NOTE: This variable has NO effect if `auto_update_check` is set to `false`

This variable tells the script what branch to check for updates. It will use
this to see if any new commits have come in since the last time the update
function was run.

#### Default

The default setting is `"master"`.

#### Possible Values:

`var branch_to_check_for_updates = "master"`

`var branch_to_check_for_updates = "testing"`

`var branch_to_check_for_updates = "dev"`


### var api_token

NOTE: This variable has NO effect if `auto_update_check` is set to `false`

This variable holds the value of your Github API Token which will ONLY be used
for the purpose of checking for updates. The Github API does not require a
token, but you will be subject to rate limiting if you don't. As a result, if
you do not provide a token to this script, you may find that you get errors in
your script because the API didn't return anything. That being said, it is up to
you whether or not you want to provide a token. The script will work whether you
provide a token or leave the string empty.

#### How to Get a Token?

First, you need a Github Account. If you do not have one, then register for one.
Once you have an account:

1. Login
2. Click your profile picture in the top right corner of the page
3. Select `Settings` from the drop down
4. In the left pane select `Developer Settings`
5. In the left pane select `Personal Access Tokens`
6. Click `Generate new token`
7. Give a description for the token.
8. Below that are scopes. We do NOT need any of them, so leave them all
   unchecked and click `Generate Token`

The next page shows the token. Use this as your token. Note that you will never
be able to see that token again, so copy it there and put it into the script
right away. If you lose the token somehow that is not big deal. Just generate a
new one with the above steps and delete your old token.

#### Default

The default setting is `""` which means that NO token will be used

#### Possible Values:

`var branch_to_check_for_updates = ""`

If `123456` is your token:

`var branch_to_check_for_updates = "123456"`


### var extra_recipients

This variable tells the script that you want to send email notifications to
other people. This variable will hold a list of all the emails you want to email
your car list to (Note that settings this will not send the extra recipients any
error or log messages, just car updates).

#### Default

The default setting is `[]`, which is an empty list.

#### Possible Values:

The values can be any number of comma separated emails.

Examples:

`var extra_recipients = ["test@email.com"]`

`var extra_recipients = ["test@email.com", "test2@email.com", "test3@email.com"]`

Note: Remember the quotation marks around the email address.

## Questions

### What if I Accidentally mess with the data in the sheet?

Changing the "A" column is perfectly okay, since this is the column you will use
to tell the script what car models to look for. You can freely add and delete
car models from this column as you choose (Deleting a car model consists of just
deleting that whole row).

If you change data in any of the other columns and if it isn't too late to undo
what you just did, then do that.

Otherwise you can just make the changed cells blank. A blank cell is interpreted
as an undefined value and the script will create a starting value, as if it was
the first time it was populating that cell.

## Thanks To

* `pickapart.ca` for their website that gives a listing of all the cars on their
  lot
* myself (`http://stmhall.ca/pickapart_json.php`) for automatically populating a
  database with all of this information and serving it as json for easy
  manipulations
