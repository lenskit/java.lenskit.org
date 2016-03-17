function navMatches($, elt) {
  var path = window.location.pathname;
  var url = $('a', elt).attr('href');
  if (url === undefined || url.match('^(https?:)?\\/\\/')) {
    return false;
  }
  var mode = $('a', elt).attr('data-match');
  if (!mode) {
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

$('.side-nav li').each(function() {
  if (navMatches($, this)) {
    console.log('found active URL');
    $(this).addClass('active');
  }
});
$('.nav-menu li').each(function() {
  if (navMatches($, this)) {
    console.log('found active URL');
    $(this).addClass('active');
  }
});
