# Garage Door Opener

NodeJS app which uses Google authentication to allow some users to open a garage door.

The app listens on two ports, one for the app and one that a sensor can use to let the app know the garage has opened/closed.

The config file contains the following required items:

* web_port
  * specifies what port the web page should be accessible on.  Consider letting this port through the firewall so you can open the garage remotely.
* sensor_port
  * specifies what port the sensor will connect on to report if the door is open or not
* google_auth
  * clientID, clientSecret you get from Google's [Developer Console](https://console.developers.google.com/), and the callbackURL at which your app is available (ex.       http://hostname/auth/google/callback)
* allowed_user_ids
  * an array of Google user_ids that restricts login.  You can get the ID by going to your google plus page, clicking profile, and taking the number string from the end of the url.  You can get your friends IDs as well and give them access.

To run the app:

    npm install
    node index.js

To test sensor functionality:

    curl "http://hostname:<sensor_port>/doorstatus?open=true"
