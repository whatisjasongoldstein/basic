const nunjucks = require('nunjucks');
const marked = require('marked');

function markSafe(html) {
  return new nunjucks.runtime.SafeString(html);
}

module.exports.manageEnvironment = (environment) => {
  environment.addFilter('slug', function(str) {
    return str && str.replace(/\s/g, '-', str).toLowerCase();
  });

  environment.addFilter('markdown', (str) => {
    return markSafe(marked(String(str)));
  });

  environment.addGlobal('render', (template, context) => {
    const mergedContext = Object.assign({}, this.ctx, context);
    return markSafe(environment.render(template, mergedContext));
  });

}