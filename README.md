SETUP:

1. On reddit.com, first page load will show settings page
2. Fille in username and auth. username is username of synccit account. auth is device auth code from devices page on synccit.com
3. (optional) Change api server if not using synccit.com (default is api.synccit.com/api.php)
4. Save changes. This will reload the page
5. To edit these settings later, click synccit link at bottom of a reddit page



synccit.user.js

Greasemonkey userscript for use with Chrome, Firefox, etc.

* It doesn't actually modify your browser history, just changes the color of the links.
* The number of comments that are counted as read are based what it says on the page when you click the link.
* If you're using RES, turning off new comment count is probably a good idea, otherwise you'll end up with 2 unread counts.

## Chrome Extension

Switch to branch `chrome-extension` for Chrome extension specific code

## Firefox Extension

Switch to branch `firefox-extension` for Firefox extension specific code


To use/make Chrome extension:

>- synccit.user.js
>- manifest.json

To use:

1. From chrome://extensions, turn on developer mode
2. Load unpacked extension, choosing this folder

To create .crx:

1. From chrome://extensions, turn on developer mode
2. Pack extension, choosing this folder



To make Firefox extension:

1. Just used this:
	https://arantius.com/misc/greasemonkey/script-compiler.php


LICENSE:



    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

