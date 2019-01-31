const deployToken = require('./deployERC677Token')

async function main() {
    await deployToken()
}

main().catch(e => console.log('Error: ', e))
