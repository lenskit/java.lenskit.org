var hjsb = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/'
require.config({
  paths: {
    'foundation': '/bower_components/foundation/js/foundation.min',
    // 'modernizr': '/bower_components/modernizr/modernizr',
    'jquery': '/bower_components/jquery/dist/jquery.min',
    'hljs': '/bower_components/highlightjs/highlight.pack'
  }
})
require(["jquery", "modernizr"], function($) {
  require(["foundation"], function() {
    $(document).foundation();
  })
})

function navMatches($, elt) {
  var path = window.location.pathname;
  var url = $('a', elt).attr('href');
  if (url === undefined || url.match('^(https?:)?\\/\\/')) {
    return false;
  }
  var mode = $('a', elt).attr('data-match');
  if (mode === undefined) {
    mode = 'prefix';
  }
  console.log('checking url ' + url);
  if (mode == 'exact') {
    return url === path;
  } else if (mode.substring(0,3) == 're:') {
    var regex = mode.substring(3);
    console.log('testing regex ' + regex);
    return new RegExp(regex).test(path);
  } else {
    var pat;
    if (url.charAt(0) == '/') {
      pat = '^' + url;
    } else {
      pat = '(^|/)' + url;
    }
    var regex = new RegExp(pat);
    return path.match(regex);
  }
}

require(["jquery"], function($) {
  $('.side-nav li').each(function() {
    if (navMatches($, this)) {
      console.log('found active URL');
      $(this).addClass('active');
    }
  });
  $('#site-menu li').each(function() {
    if (navMatches($, this)) {
      console.log('found active URL');
      $(this).addClass('active');
    }
  });
  // check if we need to enable HighlightJS
  if ($('pre code').length > 0) {
    console.log('enabling highlight.js')
    $('head').append('<link rel="stylesheet" type="text/css" href="' + hjsb + 'styles/github.min.css">')
    require(['hljs'], function(hljs) {
      console.log('highlight.js loaded, initializing')
      window.hljs.initHighlighting();
    })
  }
})
