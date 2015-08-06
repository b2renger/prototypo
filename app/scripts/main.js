import pleaseWait from 'please-wait';

pleaseWait.instance = pleaseWait.pleaseWait({
	logo: '/assets/images/prototypo-loading.svg',
	// backgroundColor: '#49e4a9',
	loadingHtml: `Hello Prototypo`,
});

var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

import React from 'react';
import Router from 'react-router';

import Dashboard from './components/dashboard.components.jsx';
import SitePortal from './components/site-portal.components.jsx';
import NotLoggedIn from './components/not-logged-in.components.jsx';
import Subscriptions from './components/subscriptions.components.jsx';
import Signin from './components/signin.components.jsx';
import ForgottenPassword from './components/forgotten-password.components.jsx';
import NotABrowser from './components/not-a-browser.components.jsx';

import Remutable from 'remutable';
import LocalClient from './stores/local-client.stores.jsx';
import LocalServer from './stores/local-server.stores.jsx';
import RemoteClient from './stores/remote-client.stores.jsx';
const { Patch } = Remutable;

import {Typefaces} from './services/typefaces.services.js';
// import Prototypo from '../../node_modules/prototypo.js/dist/prototypo.js';
import PrototypoCanvas from '../../node_modules/prototypo-canvas/dist/prototypo-canvas.js';
import HoodieApi from './services/hoodie.services.js';
import uuid from 'node-uuid';
import {FontValues, AppValues} from './services/values.services.js';

if (!isSafari && !isIE) {

	Stripe.setPublishableKey('pk_test_bK4DfNp7MqGoNYB3MNfYqOAi');

	const stores = {};
	const localServer = new LocalServer(stores).instance;
	LocalClient.setup(localServer);
	const localClient = LocalClient.instance();
	const eventBackLog = stores['/eventBackLog'] = new Remutable({
		from: 0,
		to: undefined,
		eventList: [
			undefined
		]
	});

	const fontTab = stores['/fontTab'] = new Remutable({});

	const fontControls = stores['/fontControls'] = new Remutable({
		values: {},
	});

	const fontParameters = stores['/fontParameters'] = new Remutable({});

	const sideBarTab = stores['/sideBarTab'] = new Remutable({});

	const fontStore = stores['/fontStore'] = new Remutable({});

	const tagStore = stores['/tagStore'] = new Remutable({
		selected: 'all',
		pinned: [],
	});

	const glyphs = stores['/glyphs'] = new Remutable({
		selected: 'A',
	});

	const fontTemplate = stores['/fontTemplate'] = new Remutable({
	});

	const panel = stores['/panel'] = new Remutable({
		mode: [],
		textFontSize: 1,
		wordFontSize: 1,
	});

	const canvasEl = window.canvasElement = document.createElement('canvas');
	canvasEl.className = "prototypo-canvas-container-canvas";
	canvasEl.width = 0;
	canvasEl.height = 0;
	//RemoteClient.createClient('sub80scription','http://localhost:43430');

	//HoodieApi.on('connected',() => {
	//	RemoteClient.initRemoteStore('stripe', `/stripe${uuid.v4()}$$${HoodieApi.instance.hoodieId}`,'subscription');
	//});

	async function createStores() {

		//I know this is ugly but for now it's like this.
		//We need some transient state to know when we loaded appValues
		let appValuesLoaded = false;

		const saveAppValues = _.debounce(() => {
			if (!appValuesLoaded) {
				return;
			}

			const appValues = panel.head.toJS();
			appValues.selected = glyphs.get('selected');
			appValues.tab = fontTab.get('tab');
			appValues.pinned = tagStore.get('pinned');
			appValues.template = fontTemplate.get('selected');

			AppValues.save({typeface:'default', values:appValues});
		}, 300);

		window.addEventListener('unload', () => {
			saveAppValues();
			FontValues.save({typeface: 'default', values: fontControls.head.toJS()});
		})

		const actions = {
			'/load-params': ({controls, presets}) => {
				const patch = fontParameters
					.set('parameters',controls)
					.set('presets', presets)
					.commit();
				localServer.dispatchUpdate('/fontParameters',patch);
			},
			'/load-values': (params) => {
				const patch = fontControls
					.set('values',params)
					.commit();
				localServer.dispatchUpdate('/fontControls',patch);
				localClient.dispatchAction('/store-action',{store:'/fontControls',patch});
				localClient.dispatchAction('/update-font', params);
			},
			'/load-glyphs': (params) => {
				const patch = glyphs
					.set('glyphs',params)
					.commit()
				localServer.dispatchUpdate('/glyphs',patch);
			},
			'/load-tags': (params) => {
				const patch = tagStore
					.set('tags',params)
					.commit()
				localServer.dispatchUpdate('/tagStore',patch);
			},
			'/select-tag': (params) => {
				const patch = tagStore
					.set('selected',params)
					.commit();

				localServer.dispatchUpdate('/tagStore',patch);
			},
			'/toggle-pinned': (params) => {
				const pinned = _.xor(tagStore.get('pinned'),[params]);
				const patch = tagStore
					.set('pinned',pinned)
					.commit();

				localServer.dispatchUpdate('/tagStore',patch);
				saveAppValues();
			},
			'/create-font': (params) => {
				const patch = fontStore
					.set('fontName', params.font.ot.familyName)
					.commit();
				localServer.dispatchUpdate('/fontStore',patch);
			},
			'/update-font': (params) => {
				// we need a non-empty params object
				if ( !params || !Object.keys( params ).length ) {
					return;
				}

				fontInstance.update(params);
			},
			'/go-back': () => {

				const eventIndex = eventBackLog.get('to') || eventBackLog.get('from');
				const event = eventBackLog.get('eventList')[eventIndex];
				const eventList = eventBackLog.get('eventList');

				if (eventIndex > 1) {

					const revert = Patch.revert(Patch.fromJSON(event.patch));
					localServer.dispatchUpdate('/eventBackLog',
						eventBackLog.set('from',eventIndex)
							.set('to',eventIndex - 1).commit());
					localServer.dispatchUpdate(event.store,revert);

				}
			},
			'/go-forward':() => {

				const eventIndex = eventBackLog.get('to');

				if (eventIndex) {

					const event = eventBackLog.get('eventList')[eventIndex+1];
					const eventList = eventBackLog.get('eventList');

					if (event) {

						localServer.dispatchUpdate('/eventBackLog',
							eventBackLog.set('from',eventIndex)
								.set('to',eventIndex + 1).commit());
						localServer.dispatchUpdate(event.store,Patch.fromJSON(event.patch));

					}

				}

			},
			'/store-action':({store,patch,label}) => {

				const newEventList = Array.from(eventBackLog.get('eventList'));
				const eventIndex = eventBackLog.get('to') || eventBackLog.get('from');

				if (newEventList.length - 1 > eventIndex) {

					newEventList.splice(eventIndex + 1, newEventList.length);

				}

				newEventList.push(
					{
						patch:patch.toJSON(),
						store:store,
						label:label,
					});
				const eventPatch = eventBackLog.set('eventList',newEventList)
					.set('to',undefined)
					.set('from',newEventList.length - 1).commit();
				localServer.dispatchUpdate('/eventBackLog',eventPatch);
			},
			'/select-glyph':({unicode}) => {
					const patch = glyphs.set('selected',unicode).commit();
					localServer.dispatchUpdate('/glyphs', patch);

					fontInstance.displayChar(String.fromCharCode(unicode));

					const newViewMode = _.union(panel.get('mode'),['glyph']);
					if (newViewMode.length > 0) {
						const patch = panel.set('mode',newViewMode).commit();
						localServer.dispatchUpdate('/panel', patch);
					}

					saveAppValues();
			},
			'/toggle-lock-list': ({}) => {
				const lockState = glyphs.get('locked');
				const patch = glyphs.set('locked', !lockState).commit();
				localServer.dispatchUpdate('/glyphs', patch);
			},
			'/store-panel-param': (params) => {
				_.forEach(params, (value, name) => {
					panel.set(name,value);
				});
				const patch = panel.commit();
				localServer.dispatchUpdate('/panel',patch);
				saveAppValues();
			},
			'/store-text': ({value, propName}) => {
				const patch = panel.set(propName,value).commit();
				localServer.dispatchUpdate('/panel',patch);
				fontInstance.subset = panel.head.toJS().text + panel.head.toJS().word || false;
				saveAppValues();
			},
			'/load-app-values': ({values}) => {
				values.selected = values.selected || 'A'.charCodeAt(0);
				const patchGlyph = glyphs.set('selected', values.selected).commit();
				fontInstance.displayChar(String.fromCharCode(values.selected));
				localServer.dispatchUpdate('/glyphs', patchGlyph);

				const patchTab = fontTab.set('tab', values.tab || 'Func').commit();
				localServer.dispatchUpdate('/fontTab',patchTab);

				const patchTag = tagStore.set('pinned', values.pinned || []).commit();
				localServer.dispatchUpdate('/tagStore',patchTag);

				values.mode = values.mode || ['glyph'];

				_.forEach(values, (value, name) => {
					panel.set(name,value);
				})

				const patchPanel = panel.commit();

				localServer.dispatchUpdate('/panel', patchPanel);
				const patchTemplate = fontTemplate.set('selected',values.template).commit();
				localServer.dispatchUpdate('/fontTemplate', patchTemplate);

				appValuesLoaded = true;
			},
			'/change-tab-font':({name}) => {

				const patch = fontTab.set('tab',name).commit();
				localServer.dispatchUpdate('/fontTab', patch);
				saveAppValues();

			},
			'/change-font': async (repo) => {
				const patch = fontTemplate.set('selected',repo)
					.set('loadingFont',true).commit();
				localServer.dispatchUpdate('/fontTemplate', patch);

				const typedataJSON = await Typefaces.getFont(repo);
				const typedata = JSON.parse(typedataJSON);

				await fontInstance.changeFont({
					fontSource: typedataJSON,
				});

				localClient.dispatchAction('/create-font', fontInstance);

				localClient.dispatchAction('/load-params', typedata);
				localClient.dispatchAction('/load-glyphs', fontInstance.font.altMap);
				localClient.dispatchAction('/load-tags', typedata.fontinfo.tags);
				const patchEndLoading = fontTemplate.set('loadingFont',false).commit();
				localServer.dispatchUpdate('/fontTemplate',patch);
			}
		}

		localServer.on('action',({path, params}) => {

			if(actions[path] !== void 0) {

				actions[path](params);

			}

		}, localServer.lifespan);


		//Login checking and app and font values loading
		try {
			await HoodieApi.setup();

			let appValues;
			try {
				appValues = await AppValues.get({typeface: 'default'});
			}
			catch(err) {
				appValues = {
					values: {
						mode: 'glyph',
						selected: 'A',
						template: 'john-fell.ptf',
					}
				};

				console.log(err);
			}

			const typedataJSON = await Typefaces.getFont(appValues.values.template || 'john-fell.ptf');
			const typedata = JSON.parse(typedataJSON);

			const initValues = {};
			_.each(typedata.parameters ,(group) => {
				return _.each(group.parameters, (param) => {
					initValues[param.name] = param.init;
				});
			});

			const presetValues = typedata.presets['Modern'];
			const prototypoSource = await Typefaces.getPrototypo();
			let workerUrl;
			let prototypoUrl;

			// The worker will be built from URL when during development, and from
			// source in production.
			if ( process.env.NODE_ENV !== 'production' ) {
				workerUrl = '/prototypo-canvas/src/worker.js';
				prototypoUrl = '/prototypo.js/dist/prototypo.js';
			}

			const fontPromise = PrototypoCanvas.load({
				canvas: canvasEl,
				fontSource: typedataJSON,
				prototypoSource: prototypoSource,
				workerUrl,
				prototypoUrl,
			});

			const font = window.fontInstance = await fontPromise;
			font.displayChar('A');
			localClient.dispatchAction('/create-font', font);

			localClient.dispatchAction('/load-params', typedata);
			localClient.dispatchAction('/load-glyphs', font.font.altMap);
			localClient.dispatchAction('/load-tags', typedata.fontinfo.tags);
			localClient.dispatchAction('/load-app-values', appValues);

			try {
				const fontValues = await FontValues.get({typeface: 'default'});
				localClient.dispatchAction('/load-values', _.extend(initValues,_.extend(presetValues,fontValues.values)));
			}
			catch (err) {
				localClient.dispatchAction('/load-values', _.extend(fontControls.get('values'), _.extend(initValues,presetValues)));
				console.log(err);
			}
		}
		catch (err) {
			location.href = '#/signin';
		}
	}

	createStores()
		.then(() => {
			const Route = Router.Route,
				RouteHandler = Router.RouteHandler,
				DefaultRoute = Router.DefaultRoute;

			const content = document.getElementById('content');

			class App extends React.Component {
				render() {
					return (
						<RouteHandler />
					);
				}
			}

			let Routes = (
				<Route handler={App} name="app" path="/">
					<DefaultRoute handler={SitePortal}/>
					<Route name="dashboard" handler={Dashboard}/>
					<Route name="signin" handler={NotLoggedIn}>
						<Route name="forgotten" handler={ForgottenPassword}/>
						<DefaultRoute handler={Signin}/>
					</Route>
					<Route name="subscription" handler={Subscriptions}/>
				</Route>
			);

			Router.run(Routes, function (Handler) {
				React.render(<Handler />, content);
			});
		});
}
else {
	const Route = Router.Route,
		RouteHandler = Router.RouteHandler,
		DefaultRoute = Router.DefaultRoute;

	const content = document.getElementById('content');

	React.render(<NotABrowser />, content);
}