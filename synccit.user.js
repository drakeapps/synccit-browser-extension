// 
// ==UserScript==
// @name          synccit 
// @namespace     http://synccit.com
// @description   syncs your vistied pages with synccit.com
// @copyright     2012, Drake Apps, LLC (http://drakeapps.com/)
// @license       GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html/
// @author		  James Wilson
// @version		  1.0
// @include       http://*.reddit.com/*
// @include		  http://reddit.com/*
// @require       http://code.jquery.com/jquery-latest.js
// @download	  http://synccit.com/latest/synccit.user.js
// ==/UserScript==
// 

// these will be set by a configuration page
var username = "james";
var auth = "6bqv16";

var api = "http://localhost/rsync/api/api.php";


var devname = "synccit.user.js,v1.0";

var array = new Array();


// add read link color
// we don't actually add any visited links to your history
// just change the color of the link
// .synccit-comment is the same as .newComments from RES
GM_addStyle(".synccit-read { color: #551a8b !important;  } .synccit-comment { display: inline; color: orangered;} .synccit-nonew { display: inline; }");


// get array of all links
$('.thing').each(
	function(i, obj) {
		// really just need to pull in data-fullname, but can't seem to get that to work
		// tried .attr('data-fullname') with no luck, even though RES seems to do that
		// can split and search the class
		var string = $(obj).attr('class');
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
					array[i] = simple[1];
				}
			}
		}
		//array[i] = id;
		//console.log(array[i]);
});

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



function parseLinks(links) {
	if(links == "error: no links found" || links == "") {
		console.log("no links found");
		return false;
	}

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
		if(newcomments == 0) {
			element.innerHTML = element.innerHTML + '&nbsp;<span class="synccit-nonew">(' + newcomments + ' new)</span>';
		} else {
			element.innerHTML = element.innerHTML + '&nbsp;<span class="synccit-comment">(' + newcomments + ' new)</span>';
		}
		
	}
	

}


function updateOnClicks() {
	// this is familiar. maybe add the onclicks at the beginning to prevent looping through twice
	$('.thing').each(
		function(i, obj) {
			// really just need to pull in data-fullname, but can't seem to get that to work
			// tried .attr('data-fullname') with no luck, even though RES seems to do that
			// can split and search the class
			var string = $(obj).attr('class');
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
						var classID = "id-t3_" + id;
						//console.log(classID);
						var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/p[1]/a';
						//console.log(xpath);
						var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
						var element = l.snapshotItem(0);
						if(element == null) {
							return;
						}
						var href = element.href;
						// I believe this is picking up the sidebar links?
						if(element != null) {
							//console.log(element);
							element.onclick = function () {
								clickedLink(id);
							};
						
						} else {
							//console.log("element null");
						}

						//  //*[@id="siteTable"]/div[23]/div[2]/a

						var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/a';
						var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
						var expando = l.snapshotItem(0);
						if(expando != null) {
							expando.onclick = function() {
								//console.log('found expando');
								clickedLink(id);
							}
						}
						
						var xpath = '//*[@id="siteTable"]/div[contains(concat(" ",normalize-space(@class)," ")," '+classID+' ")]/div[2]/ul/li[1]/a';
						var l = document.evaluate(xpath, document.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
						var comm = l.snapshotItem(0);
						if(comm != null) {
							var commentcount = comm.innerHTML.split(' ')[0];
							// self post
							console.log()
							if(href == comm.href) {
								//console.log("found self post");
								comm.onclick = function () {
									//clickedLink(id);
									clickedSelf(id,commentcount);
								}
								element.onclick = function() {
									clickedSelf(id,commentcount);
								}
							} else {
								comm.onclick = function () {
									clickedComment(id,commentcount);
								}
							}
							
						}
						


					}
				}
			}
			//array[i] = id;
			//console.log(array[i]);
	});

}

function clickedLink(link) {
	
	var datastring = "username=" + username + "&auth=" + auth + "&dev=" + devname + "&mode=update" + "&links=" + link;

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
		return true;
		//parseLinks(response.responseText);

	  }
	});
}


