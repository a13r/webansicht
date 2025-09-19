# Migration Plan

This plan describes the steps necessary to support the current Node.js LTS version as well as the current MongoDB version.

## Dependencies

### Build Tools

* [x] Upgrade engine requirements in package.json
* [x] Upgrade Babel and related packages (babel-core, babel-loader, etc.)
* [x] Replace babel-preset-es2015 (deprecated) with @babel/preset-env
* [x] Upgrade Webpack to 5.x and related plugins

### React Ecosystem

* [x] Upgrade React and React DOM to 18.x
* [x] Upgrade React Router to 6.x
* [x] Upgrade React Bootstrap

### MobX

* [x] Upgrade MobX to 6.x
* [x] Upgrade mobx-react to 9.x
* [x] Update mobx-react-router

### FeathersJS

* [x] Upgrade FeathersJS to 4.x
* [x] Upgrade FeathersJS to 5.x
* [x] Upgrade Mongoose to 8.x

### Development Dependencies

* [x] Upgrade webpack-dev-server to a version compatible with Webpack 5
* [ ] Upgrade Mocha

## Dockerfile

* [x] Upgrade NodeJS version
