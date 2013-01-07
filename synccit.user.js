// 
// ==UserScript==
// @name          synccit 
// @namespace     http://synccit.com
// @description   syncs your vistied pages and read comments with synccit.com
// @copyright     2012, Drake Apps, LLC (http://drakeapps.com/)
// @license       GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html/
// @author		  James Wilson
// @version		  1.0
// @include       http://*.reddit.com/*
// @include		  http://reddit.com/*
// @downloadURL	  https://github.com/drakeapps/synccit-browser-extension/raw/master/synccit.user.js
// @updateURL	  https://github.com/drakeapps/synccit-browser-extension/raw/master/synccit.user.js
// ==/UserScript==
// 

// fix for firefox
// got nothing
// firefox gives error of $ not defined
// seems like there are only 2 things that really depend on jquery
// i'll just try to get rid of them
// wtf. just reddit.com is giving the error. not my script. reinstalling firefox fixed it. hcalk it up to weird firefox glitch
// whatever. getting rid of the very small part of jquery i used is probably better
//this.$ = this.jQuery = jQuery.noConflict(true);
//this.$ = window.$;
//this.$ = unsafeWindow.$;



// chrome doesn't support this anymore. HTML5 way now
//var username = GM_getValue("username");
//var auth = GM_getValue("auth");
//var api = GM_getValue("api");

var username = localStorage['username'];
var auth = localStorage['auth'];
var api = localStorage['api'];

//console.log(username + ' '+ auth + ' ' + api);

var devname = "synccit.user.js,v1.0";

// add addStyle if doesn't exist
// if doesn't have xmlHttpRequest, that's a whole other issue
//if(navigator.userAgent.indexOf('Opera') != -1) {
//if(!(typeof(GM_addStyle) == 'function')) {
//	GM_addStyle=function(css){ document.documentElement.appendChild(document.createElement('style')).appendChild(document.createTextNode(css)); }; 
//}


// this is quite possibly the most infuriating thing i've ever seen
// log username. undefined
// is username undefined? no
// also, i can't get my form to show up without fucking everything up

//console.log(username);
//console.log(auth);
//console.log(api);

if(localStorage['synccit-link'] == "undefined" || localStorage['synccit-link'] == undefined ) {
	localStorage['synccit-link'] = "";
}
if(localStorage['synccit-comment'] == "undefined" || localStorage['synccit-comment'] == undefined ) {
	localStorage['synccit-comment'] = "";
}
if(localStorage['synccit-self'] == "undefined" || localStorage['synccit-self'] == undefined ) {
	localStorage['synccit-self'] = "";
}//

if(username == undefined || username == "undefined") {
	if(localStorage['api'] == undefined) {
		console.log('api undefined');
		localStorage['api'] = "http://api.synccit.com/api.php";
	}
	showPage();
	//console.log("username undefined");
}

else {

	//console.log("username not undefined");
	//console.log('we doin this shit');

	var array = new Array();

	addShowPage();


	// add read link color
	// we don't actually add any visited links to your history
	// just change the color of the link
	// .synccit-comment is the same as .newComments from RES
	// changed to remove GM_addStyle to make opera compatible but it doesn't support cross site xmlhttprequest so it doesn't matter
	GM_addStyle(".synccit-read { color: #551a8b !important;  } .synccit-comment { display: inline; color: orangered;} .synccit-nonew { display: inline; }");
	//document.documentElement.appendChild(document.createElement('style')).appendChild(document.createTextNode(".synccit-read { color: #551a8b !important;  } .synccit-comment { display: inline; color: orangered;} .synccit-nonew { display: inline; }"));

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

	//$('.thing').each(
		//function(i, obj) {
			// really just need to pull in data-fullname, but can't seem to get that to work
			// tried .attr('data-fullname') with no luck, even though RES seems to do that
			// can split and search the class
		var elm = l.snapshotItem(i);
		var string = elm.className;
		//console.log(elm.className);

		//var string = $(obj).attr('class');
		var sp = string.split(' ');
		//console.log(string);
		var id = '';
		for(var j=0; j<sp.length; j++) {
			//console.log(sp[i]);
			if(sp[j].substr(0,3) == "id-") {
				//console.log('found ' + sp[i]);
				var simple = sp[j].split('_');
				// length 6 to prevent trying to check all the comments
				// need to do better searching
				if(simple.length > 1 && simple[1].length == 6) {
					array[k++] = simple[1];
				}
			}
		}
			//array[i] = id;
			//console.log(array[i]);
		//}   //);
	}

	//console.log(array.toString());

	var datastring = "username=" + username + "&auth=" + auth + "&dev=" + devname + "&mode=read" + "&links=" + array.toString();

	//console.log(datastring);

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
	    /*if (response.responseText.indexOf("Logged in as") > -1) {
	      location.href = "http://www.example.net/dashboard";
	    }*/
		
		//console.log(response.responseText);

		parseLinks(response.responseText);

	  }
	});

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
	var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/p[1]/a';
	//console.log(xpath);
	////*[@id="siteTable"]/div[1]/div[2]/p[1]/a

	var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	//console.log(l.snapshotItem(0).innerHTML);
	var element = l.snapshotItem(0);
	//element.className += '.synccit-read'; // adding the class doesn't seem to let it overwrite style even with !important
										  // d'oh needed dot at front. replacing classname breaks RES 
	if(element != null) { // seems on self post this will end up null or something. not sure why
		element.style.color = "#551a8b";	  // nevermind still didn't work. just changing the style does though	
	}
						

}

function markComments(link, count) {
	var classID = "id-t3_" + link; 
	var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/ul/li[1]/a';
	var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var element = l.snapshotItem(0);
	if(element != null) {
		var commentcount = element.innerHTML.split(' ')[0];
		//console.log(element.innerHTML);
		var newcomments = commentcount - count;
		if(newcomments < 1) { // was just == 0, but occasionally will have less than 0 links. don't need an alert for -2 new comments
			element.innerHTML = element.innerHTML + '&nbsp;<span class="synccit-nonew">(' + newcomments + ' new)</span>';
		} else {
			element.innerHTML = element.innerHTML + '&nbsp;<span class="synccit-comment">(' + newcomments + ' new)</span>';
		}
		
	}
	

}


function updateOnClicks() {
	// this is familiar. maybe add the onclicks at the beginning to prevent looping through twice
	

	var xpath = '//*[@id="siteTable"]/div';
	var m = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

	var k = 0;

	//console.log(m.snapshotLength);

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
	//var elm = m.snapshotItem(i);
	var string = elm.className;
	//console.log(string);
	//var string = $(obj).attr('class');
	var sp = string.split(' ');
	//console.log(string);
	//var id = '';
	for(var j=0; j<sp.length; j++) {
		//console.log(sp[i]);
		if(sp[j].substr(0,3) == "id-") {
			//console.log('found ' + sp[i]);
			var simple = sp[j].split('_');
			// length 6 to prevent trying to check all the comments
			// need to do better searching
			if(simple.length > 1 && simple[1].length == 6) {
				//array[i] = simple[1];
				var id = simple[1];
				//console.log(id);
				var classID = "id-t3_" + id;
				//console.log(classID);
				var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/p[1]/a';
				//console.log(xpath);
				var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				var element = l.snapshotItem(0);
				if(element != null) {
					//return; // was $.each, so was function. now just loop. also == null return
				//}
					var href = element.href;
					//console.log(href);
					// I believe this is picking up the sidebar links?
					//if(element != null) {
						//console.log(element);
					element.onclick = function () {
						clickedLink(id);
					};
					
					//} else {
						//console.log("element null");
					//}

					//  //*[@id="siteTable"]/div[23]/div[2]/a

					var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/a';
					var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
					var expando = l.snapshotItem(0);
					if(expando != null) {
						expando.onclick = function() {
							//console.log('found expando');
							addLink(id);
						}
					}
					
					var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/ul/li[1]/a';
					var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
					var comm = l.snapshotItem(0);
					if(comm != null) {
						var commentcount = comm.innerHTML.split(' ')[0];
						// self post
						// console.log()
						if(href == comm.href) {
							//console.log("found self post");
							comm.onclick = function () {
								//clickedLink(id);
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
		//localStorage[link] = "1,-1";
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
		//localStorage[link] = "0,"+count;
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
		//localStorage[link] = "1,"+count;
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
	    /*if (response.responseText.indexOf("Logged in as") > -1) {
	      location.href = "http://www.example.net/dashboard";
	    }*/
		
		console.log(response.responseText);
		var array = localStorage['synccit-link'].split(',');
		if(array.length < 2) {
			localStorage['synccit-link'] = "";
		} else {
			for(var i=0; i<array.length; i++) {
				//console.log(array[i]);
				if(array[i] == link) {
					//console.log('link presplice array: '+array.toString());
					//console.log('link splice '+link);
					array = array.splice(i, 1);
					//console.log('link postsplice array: '+array.toString());
					//break;
				}
			}
			localStorage['synccit-link'] = array.toString();
		}
		return true;

		//parseLinks(response.responseText);

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
	    /*if (response.responseText.indexOf("Logged in as") > -1) {
	      location.href = "http://www.example.net/dashboard";
	    }*/
		
		console.log(response.responseText);
		var array = localStorage['synccit-comment'].split(',');
		//console.log(array.toString());
		if(array.length < 2) {
			localStorage['synccit-comment'] = "";
		} else {
			for(var i=0; i<array.length; i++) {
				var sp = array[i].split(':');
				//console.log(sp[0]);
				if(sp[0] == link) {
					//console.log('comment presplice array: '+array.toString());
					//console.log('comment splice '+link);
					array = array.splice(i, 1);
					//console.log('comment postsplice array: '+array.toString());
					//break;
				}
			}
			localStorage['synccit-comment'] = array.toString();
		}
		return true;
		//parseLinks(response.responseText);

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
	    /*if (response.responseText.indexOf("Logged in as") > -1) {
	      location.href = "http://www.example.net/dashboard";
	    }*/
		
		console.log(response.responseText);
		var array = localStorage['synccit-self'].split(',');
		if(array.length < 2) {
			localStorage['synccit-self'] = "";
		} else {
			for(var i=0; i<array.length; i++) {
				var sp = array[i].split(':');
				//console.log(sp[0]);
				if(sp[0] == link) {
					//console.log('self presplice array: '+array.toString());
					//console.log('self splice '+link);
					array = array.splice(i, 1);
					//console.log('self postsplice array: '+array.toString());
					//break;
				}
			}
			localStorage['synccit-self'] = array.toString();
		}
		return true;
		//parseLinks(response.responseText);

	  }
	});
}

function addShowPage() {
	// /html/body/div[4]/div/div[1]/ul/li[6]/a
	// this will replace the advertise link with synccit 
	var xpath = "/html/body/div[4]/div/div[1]/ul/li[6]/a";
	var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var adlink = l.snapshotItem(0);
	adlink.href="#";
	adlink.onclick = function() {
		showPage();
	}
	adlink.innerHTML = "synccit";
}

function showPage() {
	if(username == undefined)
		username = '';
	if(auth == undefined)
		auth = '';
	if(api == undefined)
		api = 'http://api.synccit.com/api.php';
	// RES is not playing nice with this. it adds content to the page
	// actually not RES. javascript/html/everyhting just doesn't play nice
	document.getElementById('siteTable').innerHTML = '<div id="synccit-form"> \
	<h3>username: </h3><br> \
	<input type="text" id="username" value="'+username+'" ><br> \
	<h3>auth code: </h3><br><input type="text" id="auth" value="'+auth+'" ><br><br> \
	<a href="javascript: \
	localStorage[\'username\'] = document.getElementById(\'username\').value; \
	 localStorage[\'auth\'] = document.getElementById(\'auth\').value; \
	localStorage[\'api\'] = document.getElementById(\'api\').value; \
	window.location.reload(); \
	 " onclick="" id="save" ><h2>save</h2></a><br><br><br> \
	<h3>api location (default http://api.synccit.com/api.php)</h3><br> \
	<input type="text" id="api" value="'+api+'"><br><br> \
	<h2><a href="http://synccit.com/register.php" target="_blank">signup</a></h2><br><br> \
	<em>to get rid of this, put something in username and auth or uninstall synccit extension/script</em> \
	</div>';
	return false;
}

function saveValues() {
	console.log("saving...");
	localStorage['username'] = document.getElementById('username').text;
	localStorage['auth'] = document.getElementById('auth').text;
	localStorage['api'] = document.getElementById('api').text;
}



