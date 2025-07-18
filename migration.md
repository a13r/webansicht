# Migration Plan

This plan describes the steps necessary to support the current Node.js LTS version as well as the current MongoDB version.

## Dependencies

### Build Tools

* [ ] Upgrade engine requirements in package.json
* [ ] Upgrade Babel and related packages (babel-core, babel-loader, etc.)
* [ ] Replace babel-preset-es2015 (deprecated) with @babel/preset-env
* [ ] Upgrade Webpack to 5.x and related plugins

### React Ecosystem

* [ ] Upgrade React and React DOM to 18.x
* [ ] Upgrade React Router to 6.x
* [ ] Upgrade React Bootstrap

### MobX

* [ ] Upgrade MobX to 6.x
* [ ] Upgrade mobx-react to 9.x
* [ ] Update mobx-react-router

### FeathersJS

* [ ] Upgrade FeathersJS to 5.x
* [ ] Upgrade Mongoose to 8.x

### Development Dependencies

* [ ] Upgrade webpack-dev-server to a version compatible with Webpack 5
* [ ] Upgrade Mocha

## React

First, upgrade `react` and `react-dom` to `^16.14.0`.

* [ ] Replace `React.PropTypes` with `prop-types` package
* [ ] Update any deprecated lifecycle methods
* [ ] Handle changes in error handling

Then, upgrade to `^18.2.0`.

* [ ] Update the React 18 root API:
    ```javascript
    // Old React 15 code
    import { render } from 'react-dom';
    render(<App />, document.getElementById('root'));
    
    // New React 18 code
    import { createRoot } from 'react-dom/client';
    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(<App />);
    ```

## Dockerfile

* [ ] Upgrade NodeJS version
