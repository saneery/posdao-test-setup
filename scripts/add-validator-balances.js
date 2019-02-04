const fs = require('fs');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const assert = require('assert');

const hasOwnProperty = (x, y) => {
  assert(typeof y === 'string');
  return Object.prototype.hasOwnProperty.call(x, y);
}

const getValidatorSetFromEnv = () => {
  const initial_validators = process.env.INITIAL_VALIDATORS;
  if (typeof initial_validators !== 'string')
    throw new TypeError('Must set INITIAL_VALIDATORS env var');
  const validator_set_re = /^0x[0-9a-fA-F]{40}(,0x[0-9a-fA-F]{40})*$/s;
  if (!validator_set_re.test(initial_validators))
    throw new TypeError('invalid INITIAL_VALIDATORS env var');
  return initial_validators.split(',');
}

async function main() {
  const source_spec = __dirname + '/../pos-contracts/spec.json';
  const destination_spec = __dirname + '/../parity-data/spec.json';
  const specFile = await readFile(source_spec, 'UTF-8').then(JSON.parse);
  const accounts = specFile.accounts;
  assert(accounts != null && Object.getPrototypeOf(accounts) === Object.prototype);
  const initial_validators = getValidatorSetFromEnv();
  for (const validator of initial_validators) {
    assert(!hasOwnProperty(accounts, validator));
    accounts[validator] = { balance: '0x100000000000000000' };
  }
  await writeFile(destination_spec, JSON.stringify(specFile, null, '  '), 'UTF-8');
}

main().catch(e => {
   console.error(e.message);
   process.exitCode = 1;
});
