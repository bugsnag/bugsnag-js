module.exports = {
    "env": {
        "browser": true,
        "node":    true,
        "amd":     true
    },
    "extends": "eslint:recommended",
    // Rule definitions
    //
    // key: [code, {value}]
    // codes:
    //   * 0 - turn the rule off
    //   * 1 - turn the rule on as a warning (doesn't affect exit code)
    //   * 2 - turn the rule on as an error (exit code will be 1)
    "rules": {
        "camelcase":          [2],
        "curly":              [2],
        "eqeqeq":             [2, "smart"],
        "indent":             [2, 2],
        "linebreak-style":    [2, "unix"],
        "no-console":         [0],
        "no-trailing-spaces": [2],
        "quotes":             [2, "double"],
        "semi":               [2, "always"],
        "no-unused-vars":     [2, {"args": "none"}]
    }
};
