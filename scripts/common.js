const { execSync } = require("child_process");

module.exports = {
    run: function run(command) {
        return execSync(command).toString().trim()
    }
}
