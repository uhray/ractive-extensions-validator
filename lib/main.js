/**
 * @license ractive-validator Copyright (c) 2014, Uhray LLC
 * Available via the MIT license.
 * see: http://github.com/uhray for details
 */
define(['rv!./template', 'css!./style', './polyfills'],
function(template) {
  var extension, MessageDiv, defaultOptions;

  // ========================== Default Options ============================= //

  defaultOptions = {
    _orientation: {
      _default: 'left',
      options: ['top', 'bottom', 'left', 'right']
    },
    _class: ''
  };

  // ========================== Create MessageDiv =========================== //

  MessageDiv = Ractive.extend({
    el: document.body,
    append: true,
    template: template,
    data: {
      orientation: 'top'
    },
    onrender: function() {
      var self = this,
          element = this.get('element'),
          parent = this.get('parent'),
          bound = element.getBoundingClientRect();

      this.set({
        width: bound.width,
        top: element.offsetTop,
        left: element.offsetLeft,
        height: bound.height,
        alert: {
          width: Math.min(bound.height - 4, 23)
        }
      });

      this.observe('valid', function(v) {
        var p = element.parentElement;
        if (v) {
          element.classList.remove('validator-invalid');
          p && p.classList && p.classList.remove('validator-child-invalid');
        } else {
          element.classList.add('validator-invalid');
          p && p.classList && p.classList.add('validator-child-invalid');
        }
      });

      element.addEventListener('focus', focus);
      element.addEventListener('blur', blur);
      element.addEventListener('keyup', change);
      element.addEventListener('change', change);

      this.on('alert-click', function() {
        element && element.focus && element.focus();
      });

      this.on('teardown', function() {
        element.removeEventListener('focus', focus);
        element.removeEventListener('blur', blur);
        element.removeEventListener('keyup', change);
        element.removeEventListener('change', change);
      });

      function focus() { self.set('active', true); }
      function blur() { self.set('active', false); }
      function change() { parent.validatorDo(element); }
    }
  });

  // ========================== Custom Events =============================== //

  Ractive.events.validatorSuccess = function(node, fire) {
    var self = this;

    node._fireValidatorSuccess = function(event, e) {
      fire({
        node: node,
        name: 'validator',
        target: self,
        original: event
      });
    }
  };

  Ractive.events.validatorFailure = function(node, fire) {
    var self = this;

    node._fireValidatorFailure = function(event, e) {
      fire({
        node: node,
        name: 'validator-failure',
        target: self,
        original: event
      });
    }
  };

  // ========================== Define Extension ============================ //

  extension = Ractive.extend({

    // Initialize on render ----------------------------------------------------
    onrender: function(options) {
      var self = this;

      this._super(options);

      this.on('validator', function(event) {
        var node = event.node,
            els = node.querySelectorAll('*[validator]'),
            valid = true;

        forEach(els, function(el) {
          var x = this.validatorDo(el);
          valid = !valid ? false : x;
        }, this);

        if (valid) {
          this.fire('validator-clear', node);
          node && node._fireValidatorSuccess &&
                  node._fireValidatorSuccess(event.original);
        } else {
          node && node._fireValidatorFailure &&
                  node._fireValidatorFailure(event.original);
        }
      });

      this.on('validator-clear', function(form) {
        var els = form.querySelectorAll('*[validator]'),
            divs = this.validatorDivs;

        forEach(els, function(el) {
          var err = el._validatorError,
              idx = divs.indexOf(err);

          if (err) err.teardown();
          if (el && el._validatorError) delete el._validatorError;
          if (~idx) divs.slice(idx, 1);

          el && el.classList && el.classList.remove('validator-error');
        });
      });

      this.on('teardown', function() {
        this.validatorDivs.forEach(function(d) {
          var el = d.get('element');
          if (el && el._validatorError) delete el._validatorError;
          d.teardown();
          el && el.classList && el.classList.remove('validator-error');
        });
        this.set('validatorDivs', []);
      });

    },

    // Create default validators -----------------------------------------------

    validators: {
      string: function(val, min, max) {
        var min = min === undefined ? 0 : min,
            max = max === undefined ? Infinity : max,
            str = String(val),
            valid = val === undefined
                     ? false
                     : (val.length >= min && val.length <= max),
            msg;

        if (max == Infinity)
          msg = 'Value must be at least ' + min + ' characters.';
        else if (min == -Infinity)
          msg = 'Value cannot be more than ' + max + ' characters.';
        else
          msg = 'Value must be between ' + min + ' and ' + max + ' characters.';

        return { value: String(val), valid: valid, message: msg };
      },

      required: function(val) {
        var str = String(val);
        return { value: val, valid: !!str, message: 'Value is required.' };
      },

      email: function(val) {
        var str = String(val),
            re = /^([\w\-\.]+)@((\[([0-9]{1,3}\.){3}[0-9]{1,3}\])|(([\w\-]+\.)+)([a-zA-Z]{2,4}))$/;
        return { value: val, valid: re.test(str),
                 message: 'Not a valid email.' };
      },

      checked: function() {
        return { value: this.value, valid: this.checked,
                 message: 'Must be checked' };
      },

      url: function(val, http, required) {
        var str = String(val),
            re = new RegExp('^((http|https|ftp)\://)?[a-zA-Z0-9\-\.]+\.' +
                            '[a-zA-Z]{2,3}(:[a-zA-Z0-9]*)?/?' +
                            '([a-zA-Z0-9\-\._\?\,\'/\\\+&amp;%\$#\=~])*$'),
            re2 = new RegExp('((http|https|ftp)(\://)?)$'),
            t1 = re.test(str) && str.match(/\.[a-z]/i),
            t2 = re2.test(str);

        if (!str) {  // no value
          return { value: str, valid: !required, message: 'URL required.' };
        }

        if (http && t1 && !t2 &&
            !str.match(new RegExp('^(http|https|ftp)\://'))) {
          str = 'http://' + str;
        }

        return { value: str, valid: t1 && !t2, message: 'Not a valid url.' };
      },

      pattern: function(val, p) {
        var str = String(val),
            re = new RegExp(p);
        return { value: val, valid: re.test(str), message: 'Not a valid url.' };
      },

      samevalue: function(val, s) {
        var el = document.querySelector(s || '');

        if (!el)
          return { value: val, valid: false, message: 'Match not found.' };

        return {
          value: val,
          valid: val == el.value,
          message: 'Values must match'
        }
      }
    },

    // Handle Validation -------------------------------------------------------

    validatorDivs: [],
    validatorDo: function(el) {
      var value = el.value,
          args = (el && el.getAttribute('validator') || '').split(','),
          type = args.shift(),
          validator = this.validators[type],
          msg, res, evt;

      if (!validator) return console.warn('no validator found: %s', type);

      // Test Validity
      args.unshift(value);
      res = validator.apply(el, args);
      if (res.valid && el.value != res.value) {
        el.value = res.value;
        if ('createEvent' in document) {
          evt = document.createEvent('HTMLEvents');
          evt.initEvent('input', false, true);
          el.dispatchEvent(evt);
        } else el.fireEvent('oninput');
      }

      // Get message
      msg = el && el.getAttribute('validator-message') ||
            res.message || 'Invalid value: ' + type,

      // create div
      this.validatorCreateDiv(el, msg, res.valid);

      // return validity
      return res.valid;
    },

    validatorCreateDiv: function(el, msg, valid) {
      var div = el._validatorError,
          getParent, opts;

      // Already has a div
      if (div) {
        div.set('valid', valid);
        div.set('message', msg);
        return;
      }

      // need to create one
      opts = getOptions(el, defaultOptions);
      div = el._validatorError = new MessageDiv({
        el: opts.parent && document.querySelector(opts.parent) ||
            el.parentElement || document.body,
        data: {
          name: createName(),
          element: el,
          valid: valid,
          message: msg,
          parent: this,
          options: getOptions(el, defaultOptions)
        }
      });

      // Add to list
      this.validatorDivs.push(div);
    }
  });

  // ========================= Activate Extension =========================== //

  Ractive.prototype = extension.prototype;

  // ============================= Utility Fns ============================== //

  function forEach(arr, fn, ctx) {
    var k;

    if ('length' in arr) {
      for (k = 0; k < arr.length; k++) fn.call(ctx || this, arr[k], k);
    } else {
      for (k in arr) fn.call(ctx || this, arr[k], k);
    }
  }

  function createName() {
    return 'rv-' +
           Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1) +
           Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1)
  }

  function getOptions(element, defaults) {
    var opts = {};

    forEach(element.attributes, function(d) {
      var m = d.name.match(/^validator-(.*)/),
          val = d.value,
          name = m && m[1];

      if (!m) return;

      // no default
      if (!defaults[name]) {
        opts[name] = val;
      } else if (defaults[name] && defaults[name].options) {
        if (~defaults[name].options.indexOf(val)) opts[name] = val;
      } else {
        opts[name] = val;
      }
    });

    forEach(defaults, function(d, k) {
      k = k.replace(/^_/, '');
      if (!opts.hasOwnProperty(k)) {
        opts[k] = d && d._default ? d._default : d;
      }
    });

    return opts;
  }
});
