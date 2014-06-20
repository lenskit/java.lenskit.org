$(document).foundation();
hljs.initHighlighting();

$('.side-nav li').each(function() {
  var url = $('a', this).attr('href');
  if (url === undefined || url.match('^(https?:)?\\/\\/')) {
    return;
  }
  var mode = $('a', this).attr('data-match');
  var active = false;
  if (mode === 'exact') {
    active = url === window.location.pathname;
  } else {
    var pat;
    if (url.charAt(0) == '/') {
      pat = '^' + url;
    } else {
      pat = '(^|/)' + url;
    }
    var regex = new RegExp(pat);
    active = window.location.pathname.match(regex);
  }
  if (active) {
    $(this).addClass('active');
  }
});
