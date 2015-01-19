

TODO:

  * Handle emitting validation event
  * Some sort of build
  * Repo with examples or whatever
  * Location to place error message (top, left, bottom)
  * Other configurable features
  * Documentation. Explain css setup
     -> how to setup (with requirejs?)
     -> how to add validators
     -> events it listens for
     -> events emitted

Example:


<form action="javascript:;" on-submit="validate">
  <h1>Form</h1>

  <input type="text" placeholder="name"
         validate-message="Value is required." validate="required" />
  <input type="text" placeholder="email"
         validate-message="Must be a valid email"
         validate="email" />
  <br/>
  <br/>
  <input type="submit" />
</form>
