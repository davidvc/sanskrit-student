/**
 * Vercel Serverless Function for GraphQL API
 *
 * This function wraps the GraphQL Yoga server to run as a Vercel serverless function.
 * It's invoked for requests to /graphql (configured in vercel.json rewrites).
 */

// Import the compiled server from the dist directory
const { createProductionConfig, createServer } = require('../dist/server.js');

// Create the GraphQL Yoga server instance (singleton pattern)
let yogaServer;

function getYogaServer() {
  if (!yogaServer) {
    const config = createProductionConfig();
    yogaServer = createServer(config);
  }
  return yogaServer;
}

/**
 * Vercel serverless function handler
 *
 * @param {import('http').IncomingMessage} req - HTTP request
 * @param {import('http').ServerResponse} res - HTTP response
 */
module.exports = async (req, res) => {
  const yoga = getYogaServer();

  // Yoga handles the request and response
  return yoga.handle(req, res);
};
