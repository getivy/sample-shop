# sample-shop

## How to run it

1. Create an copy .env from .env.example.
2. Get your api-key and webhook-signing secret from your local merchant from which you want to make sample purchases.
3. Insert them into your .env file
4. run `npm run dev`

Adopt all env vars to the one you need. For all deployed version of this shop, the envs will be set through terraform

# How to use it

After changes you need to create a new release of this lib so you can use it in your project. Don't forget to update the version of this new release in the package.json of the corresponding project.