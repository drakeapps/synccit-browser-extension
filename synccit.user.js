// 
// ==UserScript==
// @name          synccit 
// @namespace     https://synccit.com
// @description   syncs your visited pages and read comments with synccit.com
// @copyright     2019, Drake Apps, LLC (https://drakeapps.com/)
// @license       GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html/
// @author		  James Wilson
// @version		  1.14
// @include       http://*.reddit.com/*
// @include		  http://reddit.com/*
// @include       https://*.reddit.com/*
// @include       https://reddit.com/*
// @downloadURL	  https://github.com/drakeapps/synccit-browser-extension/raw/master/synccit.user.js
// @updateURL	  https://github.com/drakeapps/synccit-browser-extension/raw/master/synccit.user.js
// @grant         GM_xmlhttpRequest
// ==/UserScript==
// 


// new design for new reddit

var version = '14';


class NewRedditSelectors {
	
	getContainer(id) {
		return document.getElementById('t3_' + id)
	}
	getRedditLinks(elem) {
		return elem.querySelectorAll('a');
	}
	getTitle(elem) {
		if (elem.querySelector('h2')) {
			return elem.querySelector('h2');
		} else {
			return elem.querySelector('h1');
		}
	}
	getCommentsAll(elem) {
		return elem.querySelector('a[data-test-id="comments-page-link-num-comments"] > span');
	}
	getCommentsSingle(elem) {
		let commentContainer = elem.querySelector('div > i.icon-comment');
		return commentContainer.parentElement.querySelector('span')
	}
	getAllLinks(elem) {
		return this.getRedditLinks(elem);
	}
	getAllContainers() {
		return document.querySelectorAll('div.scrollerItem, div.Post');
	}
	getButtonLocation() {
		return document.getElementById('header-quicklinks-oc').parentElement;
	}
	getAddNewComment(elem) {
		return elem.querySelector('span.new-comments');
	}

	isOutboundLink(link) {
		return link.querySelector('i.icon-outboundLink');
	}
}

class OldRedditSelectors {
	
	getContainer(id) {
		return document.getElementById('thing_t3_' + id)
	}
	getRedditLinks(elem) {
		return elem.querySelectorAll('a, div.expando-button');
	}
	getTitle(elem) {
		return elem.querySelector('a.title');
	}
	getCommentsAll(elem) {
		return elem.querySelector('a.comments');
	}
	getCommentsSingle(elem) {
		return elem.querySelector('a.comments');
		// return commentContainer.parentElement.querySelector('span')
	}
	getAllLinks(elem) {
		return this.getRedditLinks(elem);
	}
	getAllContainers() {
		return document.querySelectorAll('#siteTable > .link');
	}
	getButtonLocation() {
		return document.getElementById('header-bottom-right');
	}
	getAddNewComment(elem) {
		return elem.querySelector('span.new-comments');
	}

	isOutboundLink(link) {
		return link.querySelector('i.icon-outboundLink');
	}
}



// reddit link class
class RedditLink {
	constructor (id, selectors) {
		this.id = id;
		this.selectors = selectors;

		// have we fetched the link from synccit already
		this.fetched = false;

		// synccit variables
		this.read = false;
		this.synccitComments = false;

		// synccit submission variables
		this.submitted = false;
		this.clickedLink = false;
		this.clickedComments = false;

		// event listener status
		this.listenersAdded = false;

		this.selector = null;
		this.findContainer();

		this.title = null;
		this.findTitle();

		this.linkSelectors = null;
		this.findRedditLinks();

		this.commentSpan = null;
		this.findCommentSpan();

		this.commentCount = null;
		this.findCommentCount();

		this.externalLink = null;
		this.findExternalLink();
	}

	findContainer () {
		// find the container div by the link id
		let elem = this.selectors.getContainer(this.id);

		if (elem !== null) {
			// found the container
			this.selector = elem;
		}
	}

	findRedditLinks () {
		let elem = this.selector;
		// a lot of things can link to the post, so just loop through them all, figure out which one points to the link, and add the selector
		let links = this.selectors.getRedditLinks(elem);
		let linkSelectors = new Array();
		links.forEach(link => {
			if (('href' in link && link.href.includes(this.id)) || link.classList.contains('expando-button')) {
				linkSelectors.push(link);
			}
		});
		this.linkSelectors = linkSelectors;
	}

	findTitle() {
		if (this.selector !== null) {
			// title of the post is the h2
			this.title = this.selectors.getTitle(this.selector);
		}
	}

	findCommentSpan() {
		// this is looking for an attribute called `data-test-id`. hopefully they don't remove it
		let commentContainer = this.selectors.getCommentsAll(this.selector);
		if (commentContainer === null) {
			// single page view
			commentContainer = this.selectors.getCommentsSingle(this.selector);
		}
		this.commentSpan = commentContainer;
	}

	findCommentCount() {
		// we need the content of the container
		let commentString = this.commentSpan.innerHTML;
		// pull off the string comments
		commentString = commentString.split(' ')[0];

		let commentCount = 0;
		// do some multiplication if we need to
		if (commentString.includes('k')) {
			commentString = commentString.replace('k','');
			// new reddit drops resolution of >1k comments down to 100
			commentCount = parseFloat(commentString) * 1000;
		} else {
			commentCount = parseFloat(commentString);
		}
		this.commentCount = commentCount;
	}

	findExternalLink() {
		// loop through all the links
		let links = this.selectors.getAllLinks(this.selector);
		links.forEach(link => {
			if (this.selectors.isOutboundLink(link)) {
				// found external link
				this.externalLink = link;
				return;
			}
		});
	}

	markRead() {
		this.styleTitleRead();
		if (typeof(this.synccitComments) === 'number' && typeof(this.commentCount === 'number') && this.commentCount > this.synccitComments) {
			let newComments = this.commentCount - this.synccitComments;
			this.addNewComments(newComments);
		}
	}

	styleTitleRead() {
		// dim the link
		// this is a separate proc if we're wanting to color it or something in the future
		if (this.title !== null) {
			this.title.style.opacity = .4;
		}
	}

	addNewComments (comments) {
		let newComments = this.selectors.getAddNewComment(this.commentSpan);
		// we've already marked the read comments, so just replace the amount
		if (newComments !== null) {
			newComments.innerHTML = comments + ' new';
		} else {
			this.commentSpan.innerHTML += ' <span class="new-comments" style="color: red; font-weight: bold;">' + comments + ' new</span>';
		}
	}

	addListeners (redditLinks) {
		this.linkSelectors.forEach(link => {
			link.addEventListener('click', () => {
				this.clickedComments = true;
				this.submitted = false;
				redditLinks.synccit.submitLinks(redditLinks.links);
			});
		});
		if (this.externalLink !== null) {
			this.externalLink.addEventListener('click', () => {
				this.clickedLink = true;
				this.submitted = false;
				redditLinks.synccit.submitLinks(redditLinks.links);
			});
		}
		this.listenersAdded = true;
	}
}


class RedditLinks {
	constructor () {
		this.selectors = this.getRedditSelectors();
		this.synccit = new Synccit(this.selectors);
		this.links = new Array();
		this.init = false;
		this.findAllLinks();

		this.scrollHeight = document.body.clientHeight;
		this.handleScrollFetch();

	}

	getRedditSelectors () {
		if (document.querySelector('#sr-header-area')) {
			return new OldRedditSelectors();
		} else {
			return new NewRedditSelectors();
		}
	}

	// loop through all link container and create RedditLink objects
	findAllLinks() {
		let linkSelectors = this.selectors.getAllContainers();
		linkSelectors.forEach(link => {
			if ('id' in link && link.id.includes('t3_')) {
				// id looks like `t3_{id}`
				// we actually pull off the t3_ to just put it back on in the RedditLink class
				let id = link.id.replace('t3_', '').replace('thing_','');
				// to skip promoted links and other garabge, make sure the id looks sane
				if (id.length < 10) {
					if (!this.containsLink(id)) {
						let newLink = new RedditLink(id,this.selectors);
						this.links.push(newLink);
						newLink.addListeners(this);
					}
				}
			}
		});
		// only one link, mark it as read
		if (this.links.length === 1 && this.init === false) {
			this.links[0].clickedLink = true;
			this.links[0].clickedComments = true;
			this.init = true;
			this.synccit.submitLinks(this.links);
		}
		// we might need a debounce here
		this.synccit.fetchReadLinks(this);
	}

	// check whether we've already handled this link or not
	containsLink(id) {
		let elem = this.getLinkByID(id);
		return elem !== null;
	}

	// find the link by id
	getLinkByID (id) {
		let elem = null;
		this.links.forEach(link => {
			if (link.id == id) {
				elem = link;
			}
		});
		return elem;
	}

	handleScrollFetch() {
		// this is not great. there's probably a better way
		// but this is what I could figure out with the time I alloted myself
		// so we just check the height of the page every so often
		// if it changed, fetch all the reddit links
		setTimeout(() => {
			if (this.scrollHeight !== document.body.clientHeight) {
				this.scrollHeight = document.body.clientHeight;
				this.findAllLinks();
			}
			this.handleScrollFetch();
		}, 1000);
	}

}

class Synccit {
	constructor(selectors) {
		this.selectors = selectors;
		this.username = null;
		this.auth = null;
		this.api = 'https://api.synccit.com/api.php';
		this.hideLoginForm = false;

		this.setup = false;

		this.client = 'synccit-extension v1.' + this.getManifestVersion();

		this.settings = new SynccitSettings(this);

	}

	getManifestVersion () {
		if (typeof(chrome) !== 'undefined') {
			return chrome.runtime.getManifest().version;
		} else {
			return version;
		}
	}

	setLogin (username, auth, api) {
		console.log('synccit logging in with:', {'username': username, 'auth': auth, 'api': api});
		this.username = username;
		this.auth = auth;
		if (api != undefined && api != 'undefined' && api != 'http://api.synccit.com/api.php') {
			this.api = api;
		}
		this.setup = true;
	}

	fetchReadLinks (redditLinks) {
		// synccit not setup, bail
		if (!this.setup) {
			// old reddit can be parsed before we set up synccit, so just keep retrying every second
			setTimeout(() => {
				this.fetchReadLinks(redditLinks);
			}, 1000);
			return false;
		}

		// build the json request
		let request = this.initialJSON();
		request['mode'] = 'read';
		request['links'] = [];

		redditLinks.links.forEach(link => {
			if (!link.fetched) {
				request['links'].push({'id': link.id});
				link.fetched = true;
			}
		});

		// don't make a request if we didn't find any links
		if (request['links'].length === 0) {
			return false;
		}

		let dataString = 'type=json&data=' + encodeURI(JSON.stringify(request));

		// do the actual synccit request
		let oReq = new XMLHttpRequest();
		oReq.open("POST", this.api, true);
		oReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		oReq.send(dataString);
		oReq.onload = () => {
			if(oReq.status == 200) {
				this.markReadLinks(redditLinks, oReq.response);
			}
		};

	}

	markReadLinks (redditLinks, response) {
		let resp = JSON.parse(response);
		resp.forEach(link => {
			let reddLink = redditLinks.getLinkByID(link.id);
			if (reddLink !== null) {
				reddLink.read = true;
				// lazy 0 check
				if (link.commentvisit != '0') {
					reddLink.synccitComments = parseInt(link.comments);
				}
				reddLink.markRead();
			}
		});
	}

	submitLinks (links) {
		if (!this.setup) {
			// old reddit can be parsed before we set up synccit, so just keep retrying every second
			setTimeout(() => {
				this.submitLinks(links);
			}, 1000);
			return false;
		}
		let request = this.initialJSON();
		request['mode'] = "update";
		request['links'] = [];
		links.forEach(link => {
			if (!link.submitted && (link.clickedLink || link.clickedComments)) {
				let submission = {'id': link.id};
				// check if they clicked the comments vs the link
				if (link.clickedComments) {
					submission['comments'] = link.commentCount;
					// if the comment was the link, then update both
					if (link.clickedLink) {
						submission['both'] = true;
					}
				}
				request['links'].push(submission);
			}
		});

		// TODO: make this not a copy/paste job
		let dataString = 'type=json&data=' + encodeURI(JSON.stringify(request));
		// do the actual synccit request
		let oReq = new XMLHttpRequest();
		oReq.open("POST", this.api, true);
		oReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		oReq.send(dataString);
		oReq.onload = () => {
			if(oReq.status == 200) {
				links.forEach(link => {
					link.submitted = true;
					link.clickedComments = false;
					link.clickedLink = false;
				});
			}
		};
	}

	// the generic initial json setup for every call
	initialJSON () {
		let request = {};
		request['username'] = this.username;
		request['auth'] = this.auth;
		request['dev'] = this.client;

		return request;
	}

	getCleanUsername() {
		return this.username !== null ? this.username : '';
	}
	getCleanAuth() {
		return this.auth !== null ? this.auth : '';
	}
	getCleanApi() {
		return this.api !== null ? this.api : '';
	}

}

class SynccitSettings {
	constructor (synccit) {
		this.synccit = synccit;
		this.init = true;

		this.hideSettings = false;
		this.shouldShowSettings();

		this.addSettingsLink();

		this.chromeLogin();
	}

	shouldShowSettings() {
		if (!this.isUndefined(localStorage['synccit-hideSettings']) && localStorage['synccit-hideSettings'] == true) {
			this.hideSettings = true;
		}
	}

	chromeLogin() {
		// see if we can login the fancy chrome way. fall back to localstorage if we can't
		if (typeof(chrome) !== 'undefined') {
			chrome.storage.sync.get(["username", "auth", "api"], items => {
				if (typeof items === 'object' && !this.isUndefined(items["api"]) && !this.isUndefined(items['username']) && !this.isUndefined(items['auth'])) {
					this.synccit.setLogin(items['username'], items['auth'], items['api']);
				} else {
					chrome.storage.local.get(["username", "auth", "api"], items => {
						if (!this.isUndefined(items["api"]) && !this.isUndefined(items['username']) && !this.isUndefined(items['auth'])) {
							this.synccit.setLogin(items['username'], items['auth'], items['api']);
						} else {
							this.localStorageLogin();
						}
					});
				}
			});
		} else {
			this.localStorageLogin();
		}
	}

	localStorageLogin() {
		if (!this.isUndefined(localStorage["synccit-username"]) && !this.isUndefined(localStorage["synccit-auth"]) && !this.isUndefined(localStorage["synccit-api"])) {
			this.synccit.setLogin(localStorage["synccit-username"], localStorage["synccit-auth"], localStorage["synccit-api"]);
		} else if (!this.isUndefined(localStorage["username"]) && !this.isUndefined(localStorage["auth"]) && !this.isUndefined(localStorage["api"])) {
			// migrate away from these localstorage locations
			this.synccit.setLogin(localStorage["username"], localStorage["auth"], localStorage["api"]);
			this.storeLocalStorageLogin();
			this.clearOldLocalStorage();
		} else {
			this.showLoginForm();
		}
	}

	storeLocalStorageLogin() {
		localStorage['synccit-username'] = this.synccit.username;
		localStorage['synccit-auth'] = this.synccit.auth;
		localStorage['synccit-api'] = this.synccit.api;
	}

	clearOldLocalStorage() {
		localStorage['username'] = undefined;
		localStorage['auth'] = undefined;
		localStorage['api'] = undefined;
	}

	storeChromeLogin() {
		if (typeof(chrome) !== 'undefined') {
			chrome.storage.sync.set({"username":this.synccit.username, "auth":this.synccit.auth, "api":this.synccit.api});
			chrome.storage.local.set({"username":this.synccit.username, "auth":this.synccit.auth, "api":this.synccit.api});
		}
	}

	saveSynccitSettings() {
		this.synccit.setLogin(
			document.getElementById('synccitUsername').value,
			document.getElementById('synccitAuth').value,
			document.getElementById('synccitApi').value
		);
		this.storeChromeLogin();
		this.storeLocalStorageLogin();
		location.reload();
	}

	hideSynccitSettings() {
		this.hideSettings = true;
		localStorage['synccit-hideSettings'] = true;
		location.reload();
	}

	// utility check that item is not undefined or 'undefined'
	// i don't 100% remember why this was needed, but i do remember an edge case where this was needed
	isUndefined (value) {
		return value == undefined || value == 'undefined';
	}

	addSettingsLink() {
		let item = document.createElement('a');
		item.innerHTML = 'Synccit';
		item.id = 'synccitSettingsButton';
		item.style = "cursor: pointer;";

		item.onclick = (e) => {
			this.hideSettings = false;
			this.showLoginForm();
		}

		this.synccit.selectors.getButtonLocation().appendChild(item);
	}

	showLoginForm() {
		// don't get in a loop of showing the settings screen, hitting cancel will prevent it from showing up again
		if (this.hideSettings) {
			return false;
		}
		document.body.style = 'width: 100%; height: 100%;';
		document.body.innerHTML = `
		<div style="display: flex; text-align: center; align-items: center; justify-content: center; font-family: IBMPlexSans,sans-serif; margin-top: 50px;">
			<div style="display: flex; flex-direction: column; min-width: 500px; border: 2px solid #ccc; border-radius: 10px; padding: 20px;">
				<h1 style="font-size: 200%; font-weight: 300;">synccit login</h1><br><br>
				<p>
					<fieldset class="AnimatedForm__field m-required login hideable">
						<input type="text" id="synccitUsername" placeholder="username" value="${this.synccit.getCleanUsername()}" class="AnimatedForm__textInput" style="
							font-size: 120%;
							max-width: 100%;
							width: 400px;
							padding: 10px;
							border: 1px solid rgba(0,0,0,.2);
							border-radius: 4px;
							background-color: #fcfcfb;
							margin-bottom: 15px;
						">
					</fieldset>
					<fieldset class="AnimatedForm__field m-required login hideable">
						<input type="text" id="synccitAuth" placeholder="auth code" value="${this.synccit.getCleanAuth()}" class="AnimatedForm__textInput" style="
							font-size: 120%;
							max-width: 100%;
							width: 400px;
							padding: 10px;
							border: 1px solid rgba(0,0,0,.2);
							border-radius: 4px;
							background-color: #fcfcfb;
							margin-bottom: 15px;
						">
					</fieldset>
					<fieldset class="AnimatedForm__field m-required login hideable">
						<input type="text" id="synccitApi" placeholder="api url" value="${this.synccit.getCleanApi()}" class="AnimatedForm__textInput" style="
							font-size: 120%;
							max-width: 100%;
							width: 400px;
							padding: 10px;
							border: 1px solid rgba(0,0,0,.2);
							border-radius: 4px;
							background-color: #fcfcfb;
							margin-bottom: 15px;
						">
					</fieldset>

					<fieldset class="AnimatedForm__field m-required login hideable">
						<button class="AnimatedForm__submitButton" id="synccitSubmit" style="
							color: #fff;
							border-radius: 4px;
							text-align: center;
							background: #0079d3;
							cursor: pointer;

							font-size: 120%;
								max-width: 100%;
								width: 400px;
								padding: 10px;
								border: 1px solid rgba(0,0,0,.2);
								border-radius: 4px;
								background-color: #0079d3;
								margin-bottom: 15px;
						">Submit</button>
					</fieldset>

					<fieldset class="AnimatedForm__field m-required login hideable">
						<button class="AnimatedForm__submitButton" id="synccitCancel" style="
							color: #fff;
							border-radius: 4px;
							text-align: center;
							background: #0079d3;
							cursor: pointer;

							font-size: 120%;
								max-width: 100%;
								width: 400px;
								padding: 10px;
								border: 1px solid rgba(0,0,0,.2);
								border-radius: 4px;
								background-color: rgb(255, 69, 0);
								margin-bottom: 15px;
						">Cancel</button>
					</fieldset>
				</p>
			</div>
		</div>`;

		document.getElementById('synccitSubmit').onclick = (e) => {
			this.saveSynccitSettings();
		};

		document.getElementById('synccitCancel').onclick = (e) => {
			this.hideSynccitSettings();
		}
	}

}

var z = new RedditLinks();
