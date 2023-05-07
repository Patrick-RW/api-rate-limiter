## API rate limiter.
This solution makes use of the sliding window logs algorithm and redis sorted sets to implement an API rate limiter.
## Steps to test the solution

### 1. Add environment variables
```bash
# add redis URL
$ echo 'REDIS_URL=<REDIS_URL>' >> .env # Replace <REDIS_URL> with the actual URL of any redis instance
```
### 2. Install dependencies

```bash
$ npm install
# or with yarn
$ yarn install
```
### 3. Run the solution
Make sure port 3000 is free and run:
```bash
$ npm run start
# or with yarn
$ yarn start
```
### 4. Test
Open a browser and head to http://localhost:3000