var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var gi = require('gulp-ignore');
var through = require('through');
var VF = require('vinyl');
var cheerio = require('cheerio');
var path = require('path');
var yaml = require('js-yaml');
var lunr = require('lunr');

gulp.task('uglify', function() {
  return gulp.src(['s/lenskit.js', 'bower_components/modernizr/modernizr.js'])
    .pipe(uglify({
      preserveComments: 'license'
    }))
    .pipe(rename(function(path) {
      path.dirname = ''
      path.basename += '.min'
    }))
    .pipe(gulp.dest('s'))
});

gulp.task('index-apidocs', function() {
  return gulp.src('apidocs/**/*.html')
    .pipe(gi.exclude([
      'overview-*.html',
      'help-doc.html',
      'overview-*.html',
      'serialized-form.html',
      'allclasses-*.html',
      '**/package-tree.html',
      '**/package-frame.html',
      'constant-values.html',
      'deprecated-list.html',
      'index-all.html',
      'index.html'
    ]))
    .pipe(through(function(vf) {
      var $ = cheerio.load(vf.contents)
      var fname = path.basename(vf.path, '.html')

      function stringify($, node) {
        return node.map(function() {
          return $(this).text()
        }).get().join(' ').replace(/\s+/g, ' ').trim();
      }

      if (fname == 'package-summary') {
        // handle a package summary file
        var base = '.contentContainer a[name="package.description"]';
        var head = $('h1.title').text()
        var name = head.replace(/Package\s+(.*)/, '$1');
        var summary = $('.docSummary').text()
        var text = stringify($, $(base + ' + h2 ~ *'))
        this.emit('data', {
          type: 'package',
          url: '/apidocs/' + vf.relative,
          name: name,
          summary: summary.trim(),
          description: text
        })
      } else {
        // let's parse a class!
        var package = $('.header .subTitle').text()
        var header = $('.header .title').text()
        var np = /(Class|Interface|Annotation|Enum)\s+(\w+)/.exec(header)
        if (np == null) {
          this.emit('error', 'File ' + vf.relative + ' is not a class doc');
        }
        var record = {
          type: np[1].toLowerCase(),
          url: '/apidocs/' + vf.relative,
          package: package,
          name: np[2]
        }
        record.description = stringify($, $('.description'))
        // emit the class record
        this.emit('data', record);

        // scan the method summaries
        var methods = {}
        $('table.memberSummary td.colLast').each(function() {
          var link = $('.memberNameLink a', this).attr('href')
          var anchor = link.replace(/[^#].*#(.*)$/, '$1');
          // console.log('found anchor %s', anchor)
          var summary = stringify($, $('.block', this))
          methods[anchor] = {
            anchor: anchor,
            summary: summary
          }
        })

        // fill in method details
        var lastA
        $('a[name="method.detail"] + h3 ~ *').each(function() {
          var tag = this.tagName
          if (tag == 'a') {
            lastA = $(this).attr('name')
          } else if (tag == 'ul') {
            if (lastA === undefined) {
              console.warn('found blocklist without name')
            } else {
              var method = methods[lastA]
              if (method === undefined) {
                method = methods[lastA] = {
                  anchor: lastA, summary: null
                }
              }
              method.name = $('h4:first-child', this).text();
              method.declaration = $('h4:first-child + pre', this).text()
                .replace(/\s+/g, ' ').trim();
              method.description = stringify($, $('h4:first-child + pre ~ *', this));
              lastA = undefined;
            }
          } else {
            console.warn('found unexpected tag %s', tag)
          }
        })

        for (ma in methods) {
          var m = methods[ma]
          this.emit('data', {
            type: 'method',
            url: '/apidocs/' + vf.relative + '#' + ma,
            name: m.name || null,
            declaration: m.declaration || null,
            summary: m.summary,
            description: m.description || null,
          })
        }
      }
    }))
    .pipe(through(function(obj) {
      if (this.objs == undefined) {
        this.objs = []
        this.index = lunr(function() {
          this.field('name', {boost: 10})
          this.field('summary', {boost: 5})
          this.field('body')
        })
      }
      this.objs.push(obj)
      this.index.add({
        id: obj.url,
        name: obj.name,
        summary: obj.summary,
        body: obj.description,
        declaration: obj.declaration || null
      })
    }, function() {
      this.emit('data', new VF({
        base: '/apidocs/',
        path: '/apidocs/doc-objects.yaml',
        contents: new Buffer(yaml.safeDump(this.objs))
      }))
      this.emit('data', new VF({
        base: '/apidocs/',
        path: '/apidocs/doc-objects.json',
        contents: new Buffer(JSON.stringify(this.objs))
      }))
      this.emit('data', new VF({
        base: '/apidocs/',
        path: '/apidocs/search-index.json',
        contents: new Buffer(JSON.stringify(this.index))
      }))
      this.emit('data', new VF({
        base: '/apidocs/',
        path: '/apidocs/search-index.yaml',
        contents: new Buffer(yaml.safeDump(this.index.toJSON()))
      }))
    }))
    .pipe(gulp.dest('_site'))
})
