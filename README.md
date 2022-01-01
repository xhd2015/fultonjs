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