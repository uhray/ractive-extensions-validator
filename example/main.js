
require.config({
  baseUrl: '/',
  paths: {
    css:           'bower_components/require-css/css.min',
    'css-builder': 'bower_components/require-css/css-builder',
    normalize:     'bower_components/require-css/normalize',
    ractive:       'bower_components/ractive/ractive',
    rv:            'bower_components/rv/rv'
  },
  shim: {
    'lib/main': ['ractive']
  }
});

requirejs(['ractive', 'rv!example/template', 'lib/main'],
function(Ractive, template) {
  var ractive = new Ractive({
        el: '#container',
        template: template,
        data: {
        }
      });

  ractive.validatorDefaultOptions({
    orientation: 'inline'
  });
});
