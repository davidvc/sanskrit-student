/**
 * Vercel Serverless Function for root route
 * Redirects to GraphQL endpoint or shows API info
 */

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sanskrit Student API</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 { color: #333; }
          a { color: #0070f3; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .endpoint {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1>Sanskrit Student API</h1>
        <p>Sanskrit sutra translation service with word-by-word breakdowns</p>

        <h2>API Endpoints</h2>
        <div class="endpoint">
          <strong>GraphQL API:</strong> <a href="/graphql">/graphql</a>
        </div>

        <p>Visit the <a href="/graphql">GraphQL endpoint</a> to explore the API.</p>
      </body>
    </html>
  `);
};
