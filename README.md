# files layout
```
src/       # contains *.js, *.ts. *.js is ES6 syntax, for browser usage
  A.js     #
  B.ts     # 
  B.js     # generated from yy.ts using
lib/       # contains commonjs file, for node usage
  C.js     #
```

generally all coe should be written with B.ts. But for those like process, filesystem, commonjs is used.

B.ts to B.js:
```bash
npm run genFromTS
```

A.js to C.js:
```bash
npm run generate
```

# debug Typescript

# debug ES6

# local debug

# generat ES-to-node files
```bash
npm run generate
```

# publish
```bash
npm publish --registry https://xxx.npm.org/
```
If the scope does not exists, go to https://xxx.npm.org/scope to register one.


# generate .d.ts
```bash
# after which *.d.ts will be generated next to *.js
npx typescript
```

# directory structure
```
lib contains all generated code from src
src/node is copied verbatim into lib/node

src/protomock
src/debug used to hold a copy of source files, used to debug
```

# debug
```bash
# gen src/debug
npm run genFromTSDebug

# start from src/debug
node src/debug/protomock/test/test.js
```

# publish
The core idea to use typescript iteratively is: 
- write all es2015 code in src, and ts code in place with it
- run `npm run genFromTS`,which reads [tsconfig-ts-to-es2015.json](./tsconfig-ts-to-es2015.json) to convert ts code into es2015 code
- run `npm run generate`, which invokes babel to convert es2015 code to commonjs code,used by nodejs.

```bash
# first: ts -> es2015
npm run genFromTS

# second: es2015 -> node(commonjs)
npm run generate
```

