This plugin allows combining a raml file and its dependencies into a unique file within the gulp
pipeline mechanism.
# Install with npm
```batch
npm install --save-dev gulp-flatraml
```

# Add it in your gulpfile
```js
const flat = require('gulp-flatraml');

gulp.task('flatten', function() {
    return gulp.src('*.raml')
    .pipe(flat())
    .pipe(gulp.dest('dist'));
});
```
