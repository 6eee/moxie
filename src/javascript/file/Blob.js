/**
 * Blob.js
 *
 * Copyright 2013, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 */

/*jshint smarttabs:true, undef:true, unused:true, latedef:true, curly:true, bitwise:true, scripturl:true, browser:true */
/*global define:true */

define('moxie/file/Blob', [
	'moxie/core/utils/Basic',
	'moxie/runtime/RuntimeClient'
], function(Basic, RuntimeClient) {
	
	var blobpool = {};

	/**
	@class Blob
	@constructor
	@param {String} ruid Unique id of the runtime, to which this blob belongs to
	@param {Object} blob Object "Native" blob object, as it is represented in the runtime
	*/
	function Blob(ruid, blob) {

		function _sliceDetached(start, end, type) {
			var blob, data = blobpool[this.uid];

			if (Basic.typeOf(data) !== 'string' || !data.length) {
				return null; // or throw exception
			}

			blob = new Blob(null, {
				type: type,
				size: end - start
			});
			blob.detach(data.substr(start, blob.size));

			return blob;
		}

		function _getRuntime() {
			if (Basic.typeOf(this.connectRuntime) !== 'function') {		
				RuntimeClient.call(this);
			}
			return this.connectRuntime(this.ruid);
		}


		if (!blob) {
			blob = {};
		}

		Basic.extend(this, {
			
			/**
			Unique id of the component

			@property uid
			@type {String}
			*/
			uid: blob.uid || Basic.guid('uid_'),
			
			/**
			Unique id of the connected runtime, if falsy, then runtime will have to be initialized 
			before this Blob can be used, modified or sent

			@property ruid
			@type {String}
			*/
			ruid: ruid,
	
			/**
			Size of blob

			@property size
			@type {Number}
			@default 0
			*/
			size: blob.size || 0,
			
			/**
			Mime type of blob

			@property type
			@type {String}
			@default ''
			*/
			type: blob.type || '',
			
			/**
			@method slice
			@param {Number} [start=0]
			*/
			slice: function(start, end, type) {		
				if (this.isDetached()) {
					return _sliceDetached.apply(this, arguments);
				}
				return _getRuntime.call(this).exec.call(this, 'Blob', 'slice', this.getSource(), start, end, type);
			},

			/**
			Returns "native" blob object (as it is represented in connected runtime) or null if not found

			@method getSource
			@return {Blob} Returns "native" blob object or null if not found
			*/
			getSource: function() {
				if (!blobpool[this.uid]) {
					return null;	
				}
				
				return blobpool[this.uid];
			},

			/** 
			Detaches blob from any runtime that it depends on and initialize with standalone value

			@method detach
			@protected
			@param {DOMString} [data=''] Standalone value
			*/
			detach: function(data) {
				if (this.ruid) {
					_getRuntime.call(this).exec.call(this, 'Blob', 'destroy', blobpool[this.uid]);
					this.ruid = null;
				}

				data = data || '';
				this.size = data.length;

				blobpool[this.uid] = data;
			},

			/**
			Checks if blob is standalone (detached of any runtime)
			
			@method isDetached
			@protected
			@return {Boolean}
			*/
			isDetached: function() {
				return !this.ruid && Basic.typeOf(blobpool[this.uid]) === 'string';
			},
			
			/** 
			Destroy Blob and free any resources it was using

			@method destroy
			*/
			destroy: function() {
				this.detach();
				delete blobpool[this.uid];
			}
		});

		
		if (blob.data) {
			this.detach(blob.data); // auto-detach if payload has been passed
		} else {
			blobpool[this.uid] = blob;	
		}
	}
	
	return Blob;
});