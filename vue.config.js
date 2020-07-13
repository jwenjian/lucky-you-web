// Inside vue.config.js
module.exports = {
  // ...other vue-cli plugin options...
  pwa: {
    name: 'Lucky You',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    // disable apple mobile web app
    appleMobileWebAppCapable: 'no',
    appleMobileWebAppStatusBarStyle: 'black',

    iconPaths: {
      favicon32: '/icons/favicon-32x32.png',
      favicon16: '/icons/favicon-16x16.png',
      appleTouchIcon: '/icons/apple-touch-icon-152x152.png',
      maskIcon: '/icons/safari-pinned-tab.svg',
      msTileImage: '/icons/msapplication-icon-144x144.png'
    }
  }
}