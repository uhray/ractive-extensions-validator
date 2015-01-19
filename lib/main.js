/**
 * @license ractive-validator Copyright (c) 2014, Uhray LLC
 * Available via the MIT license.
 * see: http://github.com/uhray for details
 */
define(['rv!./template', 'css!./style'],
function(template) {
  var extension, MessageDiv;

  // ========================== Create MessageDiv =========================== //

  MessageDiv = Ractive.extend({
    el: document.body,
    append: true,
    template: template,
    data: {},
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

  // ========================== Define Extension ============================ //

  extension = Ractive.extend({

    // Initialize on render ----------------------------------------------------
    onrender: function(options) {
      var self = this;

      this._super(options);

      this.on('validator-clear', function() {
        this.validatorDivs.forEach(function(d) {
          var el = d.get('element');
          if (el) delete el._validatorError;
          d.teardown();
          el && el.classList && el.classList.remove('validator-error');
        });
        this.set('validatorDivs', []);
      });

      this.on('validator', function(event) {
        var node = event.node,
            els = node.querySelectorAll('*[validator]'),
            valid = true;

        forEach(els, function(el) {
          var x = this.validatorDo(el);
          valid = !valid ? false : x;
        }, this);

        if (valid) {
          this.fire('validator-clear');
          node && node._fireValidatorSuccess(event.original);
        }
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
          msg = 'Value must be at least ' + min + ' characters';
        else if (min == -Infinity)
          msg = 'Value cannot be more than ' + max + ' characters';
        else
          msg = 'Value must be between ' + min + ' and ' + max + 'characters';

        return { value: String(val), valid: valid, message: msg };
      },

      required: function(val) {
        var str = String(val);
        return { value: val, valid: !!str, message: 'Value is required' };
      },

      email: function(val) {
        var str = String(val),
            re = /^([\w\-\.]+)@((\[([0-9]{1,3}\.){3}[0-9]{1,3}\])|(([\w\-]+\.)+)([a-zA-Z]{2,4}))$/;
        return { value: val, valid: re.test(str),
                 message: 'Not a valid email' };
      }
    },

    // Handle Validation -------------------------------------------------------

    validatorDivs: [],
    validatorDo: function(el) {
      var value = el.value,
          args = (el && el.getAttribute('validator') || '').split(','),
          type = args.shift(),
          validator = this.validators[type],
          msg, res;

      if (!validator) return console.warn('no validator found: %s', type);

      // Test Validity
      args.unshift(value);
      res = validator.apply(Ractive, args);
      if (res.valid && el.value != res.value) el.value = res.value;

      // Get message
      msg = el && el.getAttribute('validator-message') ||
            res.message || 'Invalid value: ' + type,

      // create div
      this.validatorCreateDiv(el, msg, res.valid);

      // return validity
      return res.valid;
    },

    validatorCreateDiv: function(el, msg, valid) {
      var div = el._validatorError;

      // Already has a div
      if (div) {
        div.set('valid', valid);
        div.set('message', msg);
        return;
      }

      // need to create one
      div = el._validatorError = new MessageDiv({
        data: {
          name: createName(),
          element: el,
          valid: valid,
          message: msg,
          parent: this
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

    if (arr.length) {
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
});