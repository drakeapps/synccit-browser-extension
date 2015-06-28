// 
// ==UserScript==
// @name          synccit 
// @namespace     https://synccit.com
// @description   syncs your visited pages and read comments with synccit.com
// @copyright     2015, Drake Apps, LLC (http://drakeapps.com/)
// @license       GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html/
// @author		  James Wilson
// @version		  1.8
// @include       http://*.reddit.com/*
// @include		  http://reddit.com/*
// @include       https://*.reddit.com/*
// @include       https://reddit.com/*
// @downloadURL	  https://github.com/drakeapps/synccit-browser-extension/raw/master/synccit.user.js
// @updateURL	  https://github.com/drakeapps/synccit-browser-extension/raw/master/synccit.user.js
// ==/UserScript==
// 


var username;// = localStorage['username'];
var auth;// = localStorage['auth'];
var api;// = localStorage['api'];
var referral;// = localStorage['referral'];

// So I'm slight confused on storage.sync
// I'm wondering if this is connecting to google servers each request
// If that's the case, there's a lag depending on how long it takes for this to call
// So could use storage.local and just use storage.sync when storage.local isn't set
// Or after a set amount time too incase something changes
chrome.storage.sync.get(["username", "auth", "api", "referral"], function(items) {
    console.log(items);
    username = items["username"];
    auth = items["auth"];
    api = items["api"];
    referral = items["referral"];


//var username = localStorage['username'];
//var auth = localStorage['auth'];
//var api = localStorage['api'];
//var referral = localStorage['referral'];




console.log(username + ' '+ auth + ' ' + api);

var devname = "synccit.user.js,v1.6";

// add addStyle if doesn't exist
// if doesn't have xmlHttpRequest, that's a whole other issue
//if(navigator.userAgent.indexOf('Opera') != -1) {
//if(!(typeof(GM_addStyle) == 'function')) {
//	GM_addStyle=function(css){ document.documentElement.appendChild(document.createElement('style')).appendChild(document.createTextNode(css)); }; 
//}



if(localStorage['synccit-link'] == "undefined" || localStorage['synccit-link'] == undefined ) {
	localStorage['synccit-link'] = "";
}
if(localStorage['synccit-comment'] == "undefined" || localStorage['synccit-comment'] == undefined ) {
	localStorage['synccit-comment'] = "";
}
if(localStorage['synccit-self'] == "undefined" || localStorage['synccit-self'] == undefined ) {
	localStorage['synccit-self'] = "";
}//

if(api == "http://api.synccit.com/api.php") {
    api = "https://api.synccit.com/api.php";
}

if(username == undefined || username == "undefined") {
	if(localStorage["username"] == undefined || localStorage["username"] == "undefined") {

    }
    else {
        username = localStorage["username"];
        auth = localStorage["auth"];
        api = localStorage["api"];
        referral = localStorage["referral"];
    }
}
    
    
if(username == undefined || username == "undefined") {
	if(localStorage["username"] == undefined || localStorage["username"] == "undefined") {
        if(api == undefined) {
		console.log('api undefined');
		api = "https://api.synccit.com/api.php";
	   }
        
        showPage();
    }
}
    
else {

    chrome.storage.sync.set({"username":username, "auth":auth, "api":api, "referral":referral});
    chrome.storage.local.set({"username":username, "auth":auth, "api":api, "referral":referral});


    
	var array = new Array();

	addShowPage();

	


	// add read link color
	// we don't actually add any visited links to your history
	// just change the color of the link
	// .synccit-comment is the same as .newComments from RES
	// changed to remove GM_addStyle to make opera compatible but it doesn't support cross site xmlhttprequest so it doesn't matter
	//GM_addStyle(".synccit-read { color: #551a8b !important;  } .synccit-comment { display: inline; color: orangered;} .synccit-nonew { display: inline; }");
	document.documentElement.appendChild(document.createElement('style')).appendChild(document.createTextNode(".synccit-read { color: #551a8b !important;  } .synccit-comment { display: inline; color: orangered;} .synccit-nonew { display: inline; }"));

	//clickedLink("15x1jp");

	// seems as if server response is slower, so can't get the request done in time
	// this will now just store the link until next time you go to reddit
	// so times might be slow, or really slow
	// there probably is a better way, but I don't know it off the top of my head
	if(!(localStorage['synccit-link'] == undefined || localStorage['synccit-link'] == "")) {
		console.log(localStorage['synccit-link']);
		var array = localStorage['synccit-link'].split(',');
		for(var i=0; i<array.length; i++) {
			if(array[i] != "") {
				clickedLink(array[i]);
			}
		}
		//clickedLink(localStorage['synccit-link']);
		//localStorage['synccit-link'] = undefined;
	}

	if(!(localStorage['synccit-comment'] == undefined || localStorage['synccit-comment'] == "")) {
		console.log(localStorage['synccit-comment']);
		var array = localStorage['synccit-comment'].split(',');
		for(var i=0; i<array.length; i++) {
			if(array[i] != "") {
				var sp = array[i].split(':');
				clickedComment(sp[0], sp[1]);
			}
		}
		//var sp = localStorage['synccit-comment'].split(':');
		//clickedComment(sp[0], sp[1]);
		//localStorage['synccit-comment'] = undefined;
	}

	if(!(localStorage['synccit-self'] == undefined || localStorage['synccit-self'] == "")) {
		console.log(localStorage['synccit-self']);
		var array = localStorage['synccit-self'].split(',');
		for(var i=0; i<array.length; i++) {
			if(array[i] != "") {
				var sp = array[i].split(':');
				clickedSelf(sp[0], sp[1]);
			}
		}
		//var sp = localStorage['synccit-self'].split(':');
		//clickedSelf(sp[0], sp[1]);
		//localStorage['synccit-self'] = undefined;
	}

	// get array of all links
	// xpath for div
	// //*[@id="siteTable"]/div[1]
	var xpath = '//*[@id="siteTable"]/div';
	var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

	var k = 0;

	for(var i=0; i<l.snapshotLength; i++) {

		var elm = l.snapshotItem(i);
		var string = elm.className;

		//var string = $(obj).attr('class');
		var sp = string.split(' ');
		var id = '';
		for(var j=0; j<sp.length; j++) {
			if(sp[j].substr(0,3) == "id-") {
				var simple = sp[j].split('_');
				// length 6 to prevent trying to check all the comments
				// need to do better searching
				if(simple.length > 1 && simple[1].length == 6) {
					array[k++] = simple[1];
				}
			}
		}
	}


	var datastring = "username=" + username + "&auth=" + auth + "&dev=" + devname + "&mode=read" + "&links=" + array.toString();


	// download visited links
	// this is using the regular mode, not json
	// didn't have json implemented yet server side
	GM_xmlhttpRequest({
	  method: "POST",
	  url: api,
	  data: datastring,
	  headers: {
	    "Content-Type": "application/x-www-form-urlencoded"
	  },
	  onload: function(response) {
		parseLinks(response.responseText);

	  }
	});


	addReferrals();

}


function parseLinks(links) {
	if(links == "error: no links found" || links == "") {
		console.log("no links found");
		//return false;
		// this killed updating the onclick. not sure what my plan was
	} else {
		links = links.replace(/\n/g, "");
	//links = links.split("\n").join("");

		var array = links.split(',');

		for(var i=0; i<array.length - 1; i++) {

			var firstsplit = array[i].split(':');
			var linkid = firstsplit[0];
			var commenttime = firstsplit[2];

			var secondsplit = firstsplit[1].split(';');
			var linktime = secondsplit[0];
			var commentcount = secondsplit[1];

			if(linktime > 1) {
				console.log("found read link " + linkid + "");
				markLink(linkid);
			}

			if(commentcount > 0) {
				console.log("found read comments for link " + linkid + " with " + commentcount + " read comments");
				markComments(linkid, commentcount);
			}
			

		}
	}

	

	updateOnClicks();

}

function markLink(link) {

	var classID = "id-t3_" + link; 
	//var datafullname = "t3_" + link;

	// jquery is being a pain. going with xpath
	// xpath for the <a> with id
	//$x('//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," id-t3_15u3d9 ")]/div[2]/p[1]/a');
    ////*[@id="siteTable"]/div[1]/div[2]/p[1]/a
	var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/p[1]/a';

	////*[@id="siteTable"]/div[1]/div[2]/p[1]/a

	var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

	var element = l.snapshotItem(0);
	//element.className += '.synccit-read'; // adding the class doesn't seem to let it overwrite style even with !important
										  // d'oh needed dot at front. replacing classname breaks RES 
	if(element != null) { // seems on self post this will end up null or something. not sure why
		element.style.color = "#551a8b";	  // nevermind still didn't work. just changing the style does though	
	}
    
    console.log("marked link");
						

}

function markComments(link, count) {
	var classID = "id-t3_" + link; 
	var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/ul/li[1]/a';
	var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var element = l.snapshotItem(0);
	if(element != null) {
		var commentcount = element.innerHTML.split(' ')[0];

		var newcomments = commentcount - count;
		if(newcomments < 1) { // was just == 0, but occasionally will have less than 0 links. don't need an alert for -2 new comments
			// createElement and createTextNode to not manipulate innerHTML
			var span = document.createElement("span");
			span.className = "synccit-nonew";
			span.appendChild(document.createTextNode(' (' + newcomments + ' new)'));
			element.appendChild(span);
		} else {
			var span = document.createElement("span");
			span.className = "synccit-comment";
			span.appendChild(document.createTextNode(' (' + newcomments + ' new)'));
			element.appendChild(span);
		}
		
	}
	

}


function updateOnClicks() {
	// this is familiar. maybe add the onclicks at the beginning to prevent looping through twice
	
	var xpath = '//*[@id="siteTable"]/div';
	var m = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

	var k = 0;


	// getting rid of $(.thing).each is causing problems
	// seems like marking nearly random links as read
	// actually it seems to be the last link everytime
	// probably with the value id/commentcount not being only part of function
	// and that's it. updateOnClicks now calls updateFunction a lot
	// guess could've done '%s' % string for each call

	for(var i=0; i<m.snapshotLength; i++) {
		updateFunction(m.snapshotItem(i));
	}

}

function updateFunction(elm) {

	var string = elm.className;

	var sp = string.split(' ');

	for(var j=0; j<sp.length; j++) {
		//console.log(sp[i]);
		if(sp[j].substr(0,3) == "id-") {

			var simple = sp[j].split('_');
			// length 6 to prevent trying to check all the comments
			// need to do better searching
			if(simple.length > 1 && simple[1].length == 6) {

				var id = simple[1];

				var classID = "id-t3_" + id;

				var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/p[1]/a';

				var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				var element = l.snapshotItem(0);
				if(element != null) {

					var href = element.href;

					element.onclick = function () {
						clickedLink(id);
					};
					

					var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/a';
					var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
					var expando = l.snapshotItem(0);
					if(expando != null) {
						expando.onclick = function() {
							addLink(id);
						}
					}
					
					var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/ul/li[1]/a';
					var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
					var comm = l.snapshotItem(0);
					if(comm != null) {
						var commentcount = comm.innerHTML.split(' ')[0];
						if(href == comm.href) {
							comm.onclick = function () {
								addSelf(id,commentcount);
							}
							element.onclick = function() {
								addSelf(id,commentcount);
							}
						} else {
							comm.onclick = function () {
								addComment(id,commentcount);
							}
						}
						
					}
				}
				


			}
		}
	}
}

function addLink(link) {
	if(localStorage['synccit-link'] == "") {
		localStorage['synccit-link'] = link;
	} else {
		var array = localStorage['synccit-link'].split(',');
		array[array.length] = link;
		localStorage['synccit-link'] = array.toString();
		clickedLink(link); // probably won't load since page is unloading. might work though
	}
	
}

function addComment(link, count) {
	if(localStorage['synccit-comment'] == "") {
		localStorage['synccit-comment'] = link + ":" + count;
	} else {
		var array = localStorage['synccit-comment'].split(',');
		array[array.length] = link+":"+count;
		localStorage['synccit-comment'] = array.toString();
		clickedComment(link, count);
	}
	
}

function addSelf(link, count) {
	if(localStorage['synccit-self'] == "") {
		localStorage['synccit-self'] = link + ":" + count;
	} else {
		var array = localStorage['synccit-link'].split(',');
		array[array.length] = link+":"+count;
		localStorage['synccit-self'] = array.toString();
		clickedSelf(link, count);
	}
	
}

function clickedLink(link) {
	var datastring = "username=" + username + "&auth=" + auth + "&dev=" + devname + "&mode=update" + "&links=" + link;
	//console.log(datastring);
	GM_xmlhttpRequest({
	  method: "POST",
	  url: api,
	  data: datastring,
	  headers: {
	    "Content-Type": "application/x-www-form-urlencoded"
	  },
	  onload: function(response) {
		
		console.log(response.responseText);
		var array = localStorage['synccit-link'].split(',');
		if(array.length < 2) {
			localStorage['synccit-link'] = "";
		} else {
			for(var i=0; i<array.length; i++) {
				if(array[i] == link) {
					array = array.splice(i, 1);
				}
			}
			localStorage['synccit-link'] = array.toString();
		}
		return true;

	  }
	});

	

}

function clickedComment(link, count) {
	var datastring = "username=" + username + "&auth=" + auth + "&dev=" + devname + "&mode=update" + "&comments=" + link + ":" + count;

	GM_xmlhttpRequest({
	  method: "POST",
	  url: api,
	  data: datastring,
	  headers: {
	    "Content-Type": "application/x-www-form-urlencoded"
	  },
	  onload: function(response) {
		
		console.log(response.responseText);
		var array = localStorage['synccit-comment'].split(',');

		if(array.length < 2) {
			localStorage['synccit-comment'] = "";
		} else {
			for(var i=0; i<array.length; i++) {
				var sp = array[i].split(':');
				if(sp[0] == link) {
					array = array.splice(i, 1);
				}
			}
			localStorage['synccit-comment'] = array.toString();
		}
		return true;

	  }
	});

}

function clickedSelf(link, count) {
	var datastring = "username=" + username + "&auth=" + auth + "&dev=" + devname + "&mode=update" + "&links=" + link + "&comments=" + link + ":" + count;

	GM_xmlhttpRequest({
	  method: "POST",
	  url: api,
	  data: datastring,
	  headers: {
	    "Content-Type": "application/x-www-form-urlencoded"
	  },
	  onload: function(response) {
		
		console.log(response.responseText);
		var array = localStorage['synccit-self'].split(',');
		if(array.length < 2) {
			localStorage['synccit-self'] = "";
		} else {
			for(var i=0; i<array.length; i++) {
				var sp = array[i].split(':');
				if(sp[0] == link) {
					array = array.splice(i, 1);
				}
			}
			localStorage['synccit-self'] = array.toString();
		}
		return true;

	  }
	});
}

function addShowPage() {
	// /html/body/div[4]/div/div[1]/ul/li[6]/a
	// this will replace the advertise link with synccit 
	//var xpath = "/html/body/div[4]/div/div[1]/ul/li[6]/a";


	// link next to logout breaks RES
	var xpath = "//*[@id=\"header-bottom-left\"]/ul";

	// changed to add a link next to logout
	// var xpath = "//*[@id=\"header-bottom-right\"]";
	var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var adlink = l.snapshotItem(0);
	if(adlink != null) {
		// fixes RES view images
		var li = document.createElement('li');
		var settingsLink = document.createElement('a');
		settingsLink.id = "synccit-prefs";
		settingsLink.href = "#";
		settingsLink.appendChild(document.createTextNode("synccit"));
		li.appendChild(settingsLink);
		adlink.appendChild(li);

		// add the javascript/greasemonkey call to our new synccit link
		var synccitLink = document.getElementById('synccit-prefs').onclick = function() {
			showPage();
		}
	}
	
}

function addReferrals() {

	// this loops through all links and adds/changes referral code to a synccit related one
	// this should be completely transparent and not affect your browsing
	if(!(referral == false || referral == "false")) {
		var links = document.getElementsByTagName('a');
		for(var i=0; i < links.length; i++) {

			if(links[i].href != null && links[i].href != undefined) {
				
				var href = links[i].href;

				var domain = href.split('/')[2];

				if(domain != null && domain != undefined) {

					//right now only amazon
					if(domain.indexOf("amazon") != -1) {
						href = href.split('?')[0] + "?tag=synccit0e-20";
						links[i].href = href;

						//tag=synccit0e-20
					}

				}

			}

		}
	}

}

function showPage() {
	if(username == undefined)
		username = '';
	if(auth == undefined)
		auth = '';
	if(api == undefined)
		api = 'https://api.synccit.com/api.php';
	if(referral == undefined)
		referral = true;
	var checkbox = "checked =\"checked\"";
	if(referral == false || referral == "false") {
		checkbox = "";
	}

	// register.php > create.php. thanks @edzuslv

	// I'm sure there's a better way to do this

	var synccitSettings = document.createElement('div');
	synccitSettings.id = "synccit-form";
	//synccitSettings.appendChild();


	var usernameInput = document.createElement('input');
	usernameInput.id = "username";
	usernameInput.type = "text";
	usernameInput.value = username;

	var authInput = document.createElement('input');
	authInput.id = "auth";
	authInput.type = "text";
	authInput.value = auth;

	var refInput = document.createElement('input');
	refInput.id = "referral";
	refInput.type = "checkbox";
	if(referral == false || referral == "false") {
		refInput.checked = "";
	} else {
		refInput.checked = "checked";
	}

	var apiInput = document.createElement('input');
	apiInput.id = "api";
	apiInput.type = "text";
	apiInput.value = api;


	var saveLink = document.createElement('a');
	saveLink.href = "#";
	saveLink.id = "synccit-save";
	saveLink.appendChild(document.createElement("h2").appendChild(document.createTextNode("save")));

	var closeLink = document.createElement('a');
	closeLink.href = "#";
	closeLink.id = "synccit-close";
	closeLink.appendChild(document.createElement("h2").appendChild(document.createTextNode("close")));

	var signupLink = document.createElement('a');
	signupLink.href = "https://synccit.com/create.php";
	signupLink.target = "_blank";
	signupLink.appendChild(document.createElement("h2").appendChild(document.createTextNode("signup")));

	var refLink = document.createElement('a');
	refLink.href = "https://synccit.com/faq.php";
	refLink.target = "_blank";
	refLink.appendChild(document.createElement("h2").appendChild(document.createTextNode(" support synccit with referrals?")));

	var apiLoc = document.createElement("h3").appendChild(document.createTextNode("api location (default https://api.synccit.com/api.php)"));

	var usernameTitle = document.createElement("h3").appendChild(document.createTextNode("username: "));
	var authTitle = document.createElement("h3").appendChild(document.createTextNode("auth: "));



	synccitSettings.appendChild(usernameTitle);
	synccitSettings.appendChild(usernameInput);
	synccitSettings.appendChild(document.createElement("br"));
	synccitSettings.appendChild(authTitle);
	synccitSettings.appendChild(authInput);
	synccitSettings.appendChild(document.createElement("br"));
	synccitSettings.appendChild(refInput);
	synccitSettings.appendChild(refLink);
	synccitSettings.appendChild(document.createElement("br"));
	synccitSettings.appendChild(saveLink);
	synccitSettings.appendChild(document.createElement("br"));
	synccitSettings.appendChild(document.createElement("br"));
	synccitSettings.appendChild(apiLoc);
	synccitSettings.appendChild(document.createElement("br"));
	synccitSettings.appendChild(apiInput);
	synccitSettings.appendChild(document.createElement("br"));
	synccitSettings.appendChild(document.createElement("br"));
	synccitSettings.appendChild(signupLink);
	synccitSettings.appendChild(document.createElement("br"));
	synccitSettings.appendChild(document.createElement("br"));
	synccitSettings.appendChild(closeLink);

	document.getElementById('siteTable').innerHTML ='';

	document.getElementById('siteTable').appendChild(synccitSettings);


	var saveLinkEvent = document.getElementById("synccit-save").onclick = function() {
		saveValues();
	}

	var saveLinkEvent = document.getElementById("synccit-close").onclick = function() {
		closePage();
	}

	return false;
	

}

function saveValues() {
	console.log("saving...");
	//localStorage['username'] = document.getElementById('username').value;
	//localStorage['auth'] = document.getElementById('auth').value;
	//localStorage['api'] = document.getElementById('api').value;
	//localStorage['referral'] = document.getElementById('referral').checked;
    chrome.storage.sync.set({
        "username":document.getElementById('username').value, 
        "auth":document.getElementById('auth').value, 
        "api":document.getElementById('api').value, 
        "referral":document.getElementById('referral').checked
    });
    chrome.storage.local.set({
        "username":document.getElementById('username').value, 
        "auth":document.getElementById('auth').value, 
        "api":document.getElementById('api').value, 
        "referral":document.getElementById('referral').checked
    });
	window.location.reload();
}

function closePage() {
	console.log("closing...");
    var username;
    var auth;
	if(document.getElementById('username').value == '') {
		username = "null";
	} else {
		username = document.getElementById('username').value;
	}
	if(document.getElementById('auth').value == '') {
		auth = "null";
	} else {
		auth = document.getElementById('auth').value;
	}
	var api = document.getElementById('api').value;
	var referral = document.getElementById('referral').checked;
    
    chrome.storage.sync.set({"username":username, "auth":auth, "api":api, "referral":referral});
    chrome.storage.local.set({"username":username, "auth":auth, "api":api, "referral":referral});
    
	window.location.reload();
}



});