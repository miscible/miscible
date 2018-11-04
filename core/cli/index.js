const dedent = require("dedent");
const log = require("npmlog");
const yargs = require("yargs/yargs");
const globalOptions = require("../global-options");

module.exports = miscibleCLI;

/**
 * A factory that returns a yargs() instance configured with everything except commands.
 * Chain .parse() from this method to invoke.
 *
 * @param {Array = []} argv
 * @param {String = process.cwd()} cwd
 */
function miscibleCLI(argv, cwd) {
    const cli = yargs(argv, cwd);

    return globalOptions(cli)
        .usage("Usage: $0 <command> [options]")
        .demandCommand(1, "A command is required. Pass --help to see all available commands and options.")
        .recommendCommands()
        .strict()
        .fail((msg, err) => {
            // certain yargs validations throw strings :P
            const actual = err || new Error(msg);

            // ValidationErrors are already logged, as are package errors
            if (actual.name !== "ValidationError" && !actual.pkg) {
                // the recommendCommands() message is too terse
                if (/Did you mean/.test(actual.message)) {
                    log.error("miscible", `Unknown command "${cli.parsed.argv._[0]}"`);
                }

                log.error("miscible", actual.message);
            }

            // exit non-zero so the CLI can be usefully chained
            cli.exit(actual.code || 1, actual);
        })
        .alias("h", "help")
        .alias("v", "version")
        .wrap(cli.terminalWidth()).epilogue(dedent`
        When a command fails, all logs are written to miscible-debug.log in the current working directory.
      `);
}