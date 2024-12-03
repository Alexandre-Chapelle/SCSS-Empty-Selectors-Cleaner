# SCSS Empty Selectors Cleaner

## Before Usage:

```scss

// file.scss
.selector {
  .selector2 {
    .selector3 {
    }
  }
}

.other_selector {
  color: red;
}
```

## After Usage:

```scss
// file.scss
.other_selector {
  color: red;
}
```

## To Install Dependencies:

```bash
bun install
```

## To Run:
```bash
bun run index.ts
```

## FAQ:

**Q:** Does it work with nested folders?  
**A:** Yes, it does.

**Q:** Does it work with nested selectors?  
**A:** Yes, it does.

**Q:** Can I use it without having to install dependencies?  
**A:** Yes, please view the releases section.

**Q:** Does it create backups just in case?  
**A:** Yes, it does. After running the executable or via `npm run start`, you will be prompted:  
`Do you want to create backups for each modified file? (Y/n)`

## Contributing
Please see the <a href="https://github.com/Alexandre-Chapelle/SCSS-Empty-Selectors-Cleaner/blob/main/CONTRIBUTING.md">Contributing</a> guideline.
