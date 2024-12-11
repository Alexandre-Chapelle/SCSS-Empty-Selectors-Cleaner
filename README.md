# SCSS-Refactor-Toolkit

## Feature: scss-clean-unused-selectors
  ### Before Usage :
  
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
  
  ### After Usage:
  
  ```scss
  // file.scss
  .other_selector {
    color: red;
  }
  ```

## Feature: scss-refactor-transitions
    ### Before Usage :
  
      ```scss
      
      // file.scss
      .button {
        background: #a7ef6f;
        border-radius: 8px;
        transition: all 0.15s;
        cursor: pointer;
      
        &:hover {
          opacity: 0.7;
          background-color: red;
        }
      
        &:disabled {
          background: green;
          cursor: not-allowed;
          color: white;
        }
      }
      ```
      
   ### After Usage:
      
      ```scss
      // file.scss
      .button {
        background: #a7ef6f;
        border-radius: 8px;
        transition: background-color 0.15s, color 0.15s, opacity 0.15s;
        cursor: pointer;
      
        &:hover {
          opacity: 0.7;
          background-color: red;
        }
      
        &:disabled {
          background: green;
          cursor: not-allowed;
          color: white;
        }
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
