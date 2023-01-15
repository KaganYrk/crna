/* global __DEV__ */

const config = {

  config: {
    debug: __DEV__,
  },
  api: {
    release: {
      app: '',
    },
    debug: {
      app: '',
    },
    smoothie: (url: string) => (config.config.debug ? config.api.debug.app.concat(url) : config.api.release.app.concat(url)),
  },

};

export default config;
