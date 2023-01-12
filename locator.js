
const form = typeof global !== 'undefined' ? global : this,
	baker = function (name, bread) {
		if (
			typeof bread === 'object'
			&& !Array.isArray(bread)
			&& bread.init
		) {
			(initialized = bread.init(form)) && (bread = initialized);
		}

		if (typeof define === 'function' && (define.amd || define.cmd)) {
			define(function () { return bread; });
		} else if (typeof module !== 'undefined' && module.exports) { // commonjs
			module.exports = bread;
		} else {
			form[name] = bread;
		}
	};

baker('locator', {
	window: null,
	document: null,

	// vars
	acceptedLangs: ['en', 'es', 'fr', 'pt', 'zh-cn', 'zh-tw'],
	defaultLang: 'en',

	documentLang: null,
	browserLang: null,
	pathLang: null,
	baseGoogle: null,
	lang: null,

	googleTranslator: null,

	init: function (global) {
		this.window = global;
		this.document = global.document;

		// init vars
		this.browserLang = (global.navigator.language || global.navigator.userLanguage).toLowerCase();
		this.pathLang = this.document.location.pathname.split('/')[1] || '';
		this.baseGoogle = '/auto/';

		// inject
		global.googleTranslateElementInit = this.initGoogleTranslator;
	},

	translateByQuery: function (query = 'lang') {
		this.lang = this.getAccepted(this.getParam(query));
		this.translate();
	},
	translateByPath: function () {
		this.lang = this.getAccepted(this.pathLang);
		this.translate();
	},

	// getCookie: function (name) {
	// 	let parts = ('; ' + this.document.cookie).split(`; ${name}=`);

	// 	return parts.length === 2
	// 		? parts.pop().split(';').shift()
	// 		: null;
	// },
	getParam: function (key) {
		return (q = this.window.location.search.match(new RegExp(key + '=([^$&]+)'))) && q[1] || !1;
	},
	insertCss: function (code) {
		var style = this.document.createElement('style');
		style.type = 'text/css';

		if (style.styleSheet) {
			// IE
			style.styleSheet.cssText = code;
		} else {
			// Other browsers
			style.innerHTML = code;
		}

		this.document.getElementsByTagName('head')[0].appendChild(style);
	},
	loadJs: function (src, cb) {
		var ref = this.document.getElementsByTagName('script')[0],
			script = this.document.createElement('script');
		script.src = src;

		this.document.head.appendChild(script);
		ref.appendChild(script);

		if (cb && typeof cb === 'function') {
			script.onload = cb;
		}
		return script;
	},

	splitLang: function (lang) {
		if (lang.indexOf('-') > -1) {
			lang = lang.split('-');
		} else if (lang.indexOf('_') > -1) {
			lang = lang.split('_');
		} else {
			lang = [lang];
		}

		return lang.map(v => v.toLowerCase());
	},

	isLang: function (source, lang) {
		if (!source || !lang) {
			return false;
		}

		source = source.toLowerCase();
		lang = lang.toLowerCase();

		return source == lang || source.indexOf(lang) == 0;
	},

	canTranslate: function (lang) {
		return lang && !this.isLang(this.documentLang, lang);
	},

	isAccepted: function (lang) {
		return this.acceptedLangs.includes(lang)
			|| this.acceptedLangs.includes(this.splitLang(lang).slice(0, 1)[0]);
	},
	getAccepted: function (lang) {
		if (this.acceptedLangs.includes(lang)) {
			return lang;
		} else if (this.acceptedLangs.includes(lang = this.splitLang(lang).slice(0, 1)[0])) {
			return lang;
		}

		return this.defaultLang;
	},

	redirect: function () {
		if (!this.isAccepted(this.pathLang)) {
			this.window.location.href = this.getAccepted(this.browserLang) + this.document.location.pathname;
		}
	},
	translateTo: function (lang = 0) {
		!lang && (lang = this.lang);

		if (!this.canTranslate(lang)) {
			return;
		}

		this.document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
		this.document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + this.document.location.host + ";";

		var now = new Date();
		now.setTime(now.getTime() * 2);

		this.document.cookie = "googtrans=" + this.baseGoogle + lang + "; expires=" + now.toGMTString() + "; path=/";

		// remove and init again the google translator
	},

	translate: function () {
		this.insertCss('.skiptranslate{display:none}.goog-text-highlight{background-color:transparent!important;-webkit-box-shadow:none!important;-moz-box-shadow:none!important;box-shadow:none!important;box-sizing:initial!important;-webkit-box-sizing:initial!important;}font{vertical-align:unset!important}');

		this.loadJs('//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit', function () {
			locator.translateTo()
		});
	},
	initGoogleTranslator: function () {
		if (!this.locator.canTranslate(this.locator.pathLang)) {
			return;
		}

		this.locator.googleTranslator = new this.window.google.translate.TranslateElement({
			pageLanguage: null,
			layout: this.window.google.translate.TranslateElement.InlineLayout.SIMPLE,
			autoDisplay: false
		}, 'google_translate_element');

		// this.googleTranslator.setEnabled(false)
		document.body.style = '';
		document.getElementById('goog-gt-tt').remove();
	}
});
