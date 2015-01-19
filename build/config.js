({
    mainConfigFile: '../example/main.js',
    baseUrl: '../',
    name: 'bower_components/almond/almond',
    include: ['lib/main'],
    wrap: {
      startFile: './startFile.frag.js',
      endFile: './endFile.frag.js'
    },
    exclude: ['ractive'],
    optimize: 'none',
    stubModules: ['rv', 'css'],
    pragmasOnSave: {
      excludeRequireCss: true
    }
})
