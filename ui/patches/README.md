# How to add a patch

From App root do as following with the file to be patched.

```bash
# fix a bug in one of your dependencies
vim node_modules/some-package/brokenFile.js

# run patch-package to create a .patch file
npx patch-package some-package

# commit the patch file to share the fix with your team
git add patches/some-package+3.14.15.patch
git commit -m "fix brokenFile.js in some-package"
```

The patches will automatically be applied when running `npm install` as part of the postinstall.

When the 3pp is fixed review the patch and clean-up.

## Reference

Used 3pp code is available at https://github.com/ds300/patch-package