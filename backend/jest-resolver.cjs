// Source files import siblings as './x.js' (required by native ES modules) but the real file is x.ts.
// Try the normal resolution first; if it fails, retry without the .js extension.
module.exports = (request, options) => {
  try {
    return options.defaultResolver(request, options);
  } catch (error) {
    if (/^\.{1,2}\/.*\.js$/.test(request)) {
      return options.defaultResolver(request.slice(0, -3), options);
    }
    throw error;
  }
};
