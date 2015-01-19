ractive-extensions-validator
=======

[Ractive](http://www.ractivejs.org/) extension for form validation.

  * [Example](#example)
  * [Overview](#overview)
  * [Validators](#validators)
  * [Options](#options)
  * [Styling](#styling)
  * [See Example](#see-example)
  * [Contribute](#contribute)

## Example

The goal is to extend Ractive to have some easy, useful tools for form validation. Something like this:

```html
<form action="javascript:;"
      on-submit="validator"
      on-validatorSuccess="success">
  <input type="text" placeholder="name"
         validator-message="Value is required." validator="required" />
  <br/>
  <br/>
  <input type="text" placeholder="email"
         validator-message="Must be a valid email"
         validator="email" />
  <br/>
  <br/>
  <input type="submit" />
</form>
```

As you can see, there are two inputs each with validation. The two validators are `string` and `email`. Using Ractive events, you can trigger the validator plugin to run with the `on-submit="validator"`. Validator will listen for the event "validator" on a container and validate all inputs or textareas with the `validator` field set.

When validator succeeds, the container will emit and event `validatorSuccess`, so you can tell that to fire any ractive command you want. Here, it emits "success" with `on-validatorSuccess="success"`.

## Overview

To get started, you need to include the distributed file in your project. 

```
bower install git://github.com/uhray/ractive-extensions-validator.git
```

Then you need to make sure that the module is loaded before you use Ractive. It will add the necessary features and event listeners to the Ractive object. If you're using [requirejs](http://requirejs.org/), you could do something like this:

```
define(['ractive', 'path/to/validator/dist/validator.min'], function(Ractive) {
  var ractive = new Ractive({
   /* Define Ractive object here */
  })
})
```

Now the validator is yours to use how you wish.

To set the validator on an input or textarea, do like this:

```html
<input type="text" validator="email" />
```

Where the value of the attribute `validator` is a type of [validator](#validators). 

> You can also pass options to these validators. See [validators](#validators) for more info.

However, this doesn't actually do anything yet. Instead, it just sets an attribute. But you can trigger the validator to run by firing the `validator` event on a container (a `form` for example):

```html
<form action="javacript:;" on-submit="validator">
  <input type="text" validator="email" />
  <input type="submit" />
</form>
```

So, when the form is submitted, validator will run its validation. The validation works like this:

  1. When you first run the validation, it will validate each input. If everything is good, it fires `validatorSuccess`. If something is wrong, keep going.
  2. Once the validator has been initially called, the inputs will be watched for any key-ups that change the value. If the value ever becomes "valid", then the styled validator warnings will be hidden (until/unless it becomes invalid again). If it ever becomes invalid, the styled validator warnings will appear.
  3. If you ever fire submit again, it will jump back to number 1.

The point is that nothing is validated until you fire `validator`, but then it keeps constant watch until you fire `validator` again and everything is correct.

When `validator` is fired and everything is correct, the container div emits the Ractive event `validatorSuccess` where you can listen like this:

```html
<form action="javacript:;" on-submit="validator"
      on-validatorSuccess="whateveryouwant">
  <input type="text" validator="email" />
  <input type="submit" />
</form>
```

## Validators

The plugin comes with some pre-defined validators. You can overwrite these or create new ones as you wish.

 * [Using validators](#using-validators)
 * [Adding validators](#adding-validators)
 * [Pre-defined validators](#pre-defined-validators)

### Using Validators

To use a validator, you need to set the `validator` attribute on an `input` or `textarea` element. Like this:

```html
<input type="text" validator="email" />
```

Where `email` is the name of the validator.

You can also pass arguments to the validator, separated by a comma. For example, the `string` validator can be used to make sure a string is between a certain min and max length. You can call it like this:

```html
<input type="text" validator="string,5,10" />
```

This would make sure the length of the input value is >=5 and <= 10 characters. See [pre-defined validators](#pre-defined-validators) for more information on each validator.

### Adding Validators

To add a validator (or overwrite one), you simply add it to the value of `Ractive.prototype.validators`. 

The value should be a function that takes arguments that are `(value, *args)` where the rest of the arguments are things provided in the `validator` html attribute. Example:

```
<input type="text" validator="string,5,10" value="test" />
```

Would call the `Ractive.prototype.validators.string` function with `('test', 5, 10)`.

The return value of a validator should be an object with the following:

  * *value*: The value. This is useful if you want to modify the value. Say you're validator phone numbers and you want it formatted like `(555) 555-5555`, you can modify it and it will be updated here.
  * *valid*: `Boolean` of whether the value is valid or not.
  * *message*: String containing the default error message if invalid (see [option](#options) for more info on overriding this).

Here is the example for the string validator:

```js
Ractive.prototype.validators.string = function(val, min, max) {
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
}
```

### Pre-defined Validators

The following are the predefined validators.

  * [string](#validator-string)
  * [required](#validator-required)
  * [email](#validator-email)

<a href="#validator-string" name="#validator-string">#</a> **string**(*min*, *max*)

  * *min* - `Number` (Default: `-Infinity`) - minimum value
  * *max* - `Number`  (Default: `Infinity`) - maximum value

Makes sure the string length is between *min* and *max*.

<a href="#validator-required" name="#validator-required">#</a> **required*()

Makes sure there is some non-empty value.

<a href="#validator-email" name="#validator-email">#</a> **email**()

Makes sure the value is an email address.

## Options

You can set various options on validator elements. See here:

<a href="#options-message" name="#options-message">#</a> validator-**message** = "*msg*"

You can set a non-default message for if this input/textarea fails validation:

Example:

```html
<input type="text" validator="email"
       validator-message="You must provide an email!" />
```


## Styling

The default styling is in [lib/style.css]. The container div is structured like this:

```html
<div class="ractive-validator">
  <div class="rv-message">{{errorMessage}}</div>
  <div class="rv-alert">!</div>
</div>
```

And all css tags start with `.ractive-validator`. So, i you wish to overwrite the default styling, you can do so by making the tag more specific like `body .ractive-validator ...` or `div.ractive-validator`.

## See Example

To see the example page, clone the repo and run:

```
npm install
bower install
gulp example
```

Then visit http://127.0.0.1:8080/example/. 

> You'll need [bower](http://bower.io/) and [gulp](http://gulpjs.com/) installed.

## Contribute

The development code is located in [lib](lib). The example code is in [example](example).

After you develop, run `gulp build` to build the files to [dist](dist). Make sure to test out that the built files work.
