'use strict';

var utils = require('utils');

function PaymentsClient(config) {
  config = config || {};

  this.modalParent = config.modalParent || document.documentElement;
  // Create a unique instance id.
  this.id = '_' + Math.random().toString(36).substr(2, 9);
  this.modalWidth = config.modalWidth || 300;
  this.modalHeight = config.modalHeight || 500;
  this.closeDelayMs = typeof config.closeDelayMs === 'number' ?
                        config.closeDelayMs : 300;
  this.accessToken = config.accessToken;
  this.product = config.product;
  this.paymentHost = config.paymentHost || 'http://pay.dev:8000/';
  this.httpsOnly =
    typeof config.httpsOnly === 'undefined' ? true : config.httpsOnly;

  var paymentHostProtocol = utils.getProtocol(this.paymentHost);
  if (this.httpsOnly === true && paymentHostProtocol !== 'https:') {
    throw new Error('paymentHost is not https');
  }

  if (paymentHostProtocol !== 'http:' && paymentHostProtocol !== 'https:') {
    throw new Error('paymentHost must be http or https');
  }

  if (typeof this.product !== 'string') {
    throw new Error('A \'product\' string must be provided');
  }

  if (typeof this.accessToken !== 'string') {
    throw new Error('An \'accessToken\' string must be provided');
  }

  if (this.httpsOnly === false) {
    console.warn('httpsOnly is set to false. Only use for dev');
  }
  return this;
}

PaymentsClient.prototype = {
  classPrefix: 'fxa-pay',

  prefix: function(str) {
    return this.classPrefix + '-' + str;
  },

  getStyle: function (elm, prop) {
    if (typeof getComputedStyle !== 'undefined') {
      return getComputedStyle(elm, null).getPropertyValue(prop);
    } else {
      return elm.currentStyle[prop];
    }
  },

  iframeStyle: {
    border: 'none',
    width: '100%',
    height: '100%',
  },

  closeButtonStyle: {
    color: '#666',
    fontSize: '20px',
    position: 'absolute',
    padding: '10px',
    top: 0,
    right: 0,
    textDecoration: 'none',
  },

  outerStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    transition: 'opacity 0.3s',
    opacity: 0,
  },

  getInnerStyle: function() {
    var that = this;
    return {
      padding: '5px',
      paddingTop: '25px',
      position: 'absolute',
      top: '50%',
      left: '50%',
      height: that.modalHeight + 'px',
      width: that.modalWidth + 'px',
      backgroundColor: '#fff',
      marginTop: '-' + that.modalHeighto / 2 + 'px',
      marginLeft: '-' + that.modalWidth / 2 + 'px',
      border: '1px solid #666',
      boxShadow: '0 3px 7px rgba(0, 0, 0, 0.5)',
      zIndex: 2010,
      transition: 'opacity 0.3s',
      opacity: 0,
    };
  },

  applyStyles: function(elm, styleObj) {
    Object.keys(styleObj).forEach(function(key) {
      elm.style[key] = styleObj[key];
    });
  },

  buildModal: function() {
    var that = this;
    var doc = document;
    var outer = doc.createElement('div');
    outer.setAttribute('id', this.id);
    outer.className = this.prefix('container');
    outer.addEventListener('click', function(e) {
      e.preventDefault();
      that.close();
    }, false);

    var inner = doc.createElement('div');
    inner.className = this.prefix('modal');
    inner.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, false);

    outer.appendChild(inner);
    this.applyStyles(outer, this.outerStyle);

    var closeButton = doc.createElement('a');
    closeButton.href = '#';
    var buttonText = doc.createTextNode('×');
    closeButton.appendChild(buttonText);

    this.applyStyles(closeButton, this.closeButtonStyle);

    closeButton.addEventListener('click', function(e) {
      e.preventDefault();
      that.close();
    }, false);

    inner.appendChild(closeButton);

    var iframe_ = doc.createElement('iframe');
    var iframeSrc = utils.buildIframeSrc(this.paymentHost, {
      access_token: this.accessToken,
      product: this.product,
    });
    iframe_.setAttribute('src', iframeSrc);
    inner.appendChild(iframe_);

    this.applyStyles(iframe_, this.iframeStyle);
    this.applyStyles(inner, this.getInnerStyle());

    outer._inner = inner;

    return outer;
  },

  show: function() {
    this.modal = this.buildModal();
    // Turn off scroll for document.
    this.parentOverflow = this.getStyle(this.modalParent, 'overflowY');
    this.modalParent.style.overflowY = 'hidden';
    this.modalParent.appendChild(this.modal);
    this.modal.style.opacity = 1;
    this.modal._inner.style.opacity = 1;
  },

  close: function() {
    // Restore scroll
    this.modalParent.style.overflow = this.parentOverflow;
    this.modal.style.opacity = 0;
    this.modal._inner.style.opacity = 0;
    var that = this;
    window.setTimeout(function(){
      that.modalParent.innerHTML = '';
    }, this.closeDelayMs);
  },
};

module.exports = PaymentsClient;