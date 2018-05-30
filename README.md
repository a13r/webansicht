# webansicht

## About

This project uses

* [Feathers](http://feathersjs.com)
* [NodeJS](https://nodejs.org/)
* [React](https://reactjs.org/)
* [React-Bootstrap](https://react-bootstrap.github.io/)
* [MobX](https://github.com/mobxjs/mobx) with [mobx-react](https://github.com/mobxjs/mobx-react) and [mobx-react-form](https://github.com/foxhound87/mobx-react-form)
* [Docker](https://www.docker.com/)

## Running production

1. Run docker containers

    ```
    docker-compose up
    ```

2. Open app in browser [http://localhost:3030](http://localhost:3030)

## Development

You can run development instances of frontend and backend separately (with frontend supporting hot-reloading).
Make sure a [Mongo DB](https://www.mongodb.com/) server is running locally.

    npm run api:dev
    npm run web:dev
    
If no user exists, a new user admin with password `changeme` is created automatically.

## License

Licensed under the [MIT license](LICENSE).
