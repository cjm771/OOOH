Exchange OOOH! 
==========

v. 0.25
----------
A simple tool for automating the heaping OOO calendar events for your office when its an EWS server.
Great for monday morning google slides ;p.

![preview](https://i.imgur.com/jWGfZQh.gif)

To setup
-----------------
	- npm install
	- edit config.json file to enter
		- `calendar_email` (what public email stores shared calendar)
		- `keywords` (what keywords should we look for ex. OOO, PTO, etc)
		- `exchange_url` (EWS server)
	- ssl cert and key required (one can remove in code), throw in ssl/
	- npm start (on 3000)
	- goto https://localhost:3000



Change Log
-----------

	v0.25
	------
	- main init