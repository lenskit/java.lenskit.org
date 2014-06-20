$(document).foundation();
hljs.initHighlighting();

$('.side-nav li').each(function() {
  var url = $('a', this).attr('href');
  if (url === undefined || url.match('^(https?:)?\\/\\/')) {
    return;
  }
  var pat;
  if (url.charAt(0) == '/') {
    pat = '^' + url;
  } else {
    pat = '(^|/)' + url;
  }
  var regex = new RegExp(pat);
  if (window.location.pathname.match(regex)) {
    $(this).addClass('active');
  }
});
