import fs from 'fs';
import path from 'path';

import cors from 'cors';
import express from 'express';
import { json } from 'body-parser';
import mongoose from 'mongoose';
import * as admin from 'firebase-admin';
import { ApolloServer, gql, PubSub } from 'apollo-server-express';
import costAnalysis from 'graphql-cost-analysis';
import exphbs from 'express-handlebars';

import {Config} from './interfaces';

import schoolEndpoints from './legacy/schools';
import busEndpoints from './legacy/buses';
import stopEndpoints from './legacy/stops';
import dismissalEndpoints from './legacy/dismissal';
import alertEndpoints from './legacy/alerts';
import makeAuthRoutes from './auth/routes';
import resolvers from './graphql/resolvers';
import makeProvider from './auth/provider';
import { authContext } from './auth/context';
import Context from './graphql/context';
import { setupPubsub } from './graphql/pubsub';
import errorPage from './errorpage';

// Read the config and Firebase service account.
const config: Config = JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json"), "utf8"));
let serviceAccount: admin.ServiceAccount | undefined;

try {
  serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, "../service-account.json"), "utf8"));
} catch (e) {
  console.log("Failed to read service-account.json:");
  console.log(e.message);
  console.log("Push notifications will not be sent.")
}

// Read the typedefs in yourbcabus.graphql.
const typeDefs = gql(fs.readFileSync(path.join(__dirname, "../yourbcabus.graphql"), "utf8"));

// Connect to the database.
mongoose.connect(config.mongo, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

// Initialize Firebase.
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Set up the Pub/Sub event bus.
const pubsub = new PubSub(); // TODO: Make this more scalable
setupPubsub(pubsub);

// Set up the GraphQL server.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  validationRules: [
    costAnalysis({
      maximumCost: 50 // TODO: Tweak
    })
  ],
  playground: true,
  async context(context): Promise<Context> {
    return {
      ...context,
      ...(await authContext(provider, context.req)),
      pubsub
    };
  }
});

// Set up the Express application with Handlebars support.
const app = express();
app.engine("hbs", exphbs({ extname: ".hbs" }));
app.set("view engine", "hbs");
app.set("json spaces", "\t"); // Pretty-print JSON
// @ts-ignore
app.use("/schools", cors()); // CORS support for the legacy REST API
app.use(json()); // Body parsing stuff

// Set up the legacy REST API.
[
  schoolEndpoints,
  busEndpoints,
  stopEndpoints,
  dismissalEndpoints,
  alertEndpoints
].forEach(fn => fn({app, config, serviceAccount}));

// Set up authentication.
const provider = makeProvider(config, errorPage(app));
app.use("/auth", makeAuthRoutes(config, provider));

// Random easter egg, because why not
app.get("/teapot", (_, res) => {
  res.status(418).send("☕");
});

// Add the GraphQL API to the Express application.
server.applyMiddleware({app});

// Static files used during login.
app.use("/static", express.static(path.join(__dirname, "../static")));

// More authentication setup.
app.use(provider.callback());

// Start the server.
app.listen(config.port, config.bindTo);
