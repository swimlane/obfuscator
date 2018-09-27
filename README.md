# Obfuscator

🗝 Obfuscate values based on [JSON Schemas](https://json-schema.org/)

[![Build Status](https://travis-ci.org/swimlane/obfuscator.svg?branch=master)](https://travis-ci.org/swimlane/obfuscator) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/aa997267ef6048fea131d6f28b984c4b)](https://www.codacy.com/app/Swimlane/obfuscator?utm_source=github.com&utm_medium=referral&utm_content=swimlane/obfuscator&utm_campaign=Badge_Grade) [![Codacy Badge](https://api.codacy.com/project/badge/Coverage/aa997267ef6048fea131d6f28b984c4b)](https://www.codacy.com/app/Swimlane/obfuscator?utm_source=github.com&utm_medium=referral&utm_content=swimlane/obfuscator&utm_campaign=Badge_Coverage)

## Quickstart

By default, Obfuscator will replace any values defined in the schema of type `password` with `**********`.

### Example

```typescript
import { Obfuscator } from '@swimlane/obfuscator';

const obj = {
  foo: 'bar',
  fizz: 'buzz'
};
const schema = {
  type: 'object',
  properties: {
    foo: {
      type: 'password'
    },
    fizz: {
      type: 'string'
    }
  }
};

console.log(Obfuscator.value(obj, schema));
// {
//   "foo": "**********",
//   "fizz": "buzz"
// }
```

## Functions

### Obfuscator.value(value, schema, [replace], [types])

This function will obfuscate a value based on a JSON schema provided.

- _value_: Any type of value you want to obfuscate
- _schema_: A [JSON Schema](https://json-schema.org/) object
- _replace_: _(optional)_ The value to obfuscate with. By default, this is `**********`. It can be a:
  - _string_: Any value you want to replace it with. (ex. `'[ REDACTED ]'`)
  - _function_: A function that accepts `(value, key)` and returns a string. This is useful if you want to obfuscate differently based on the value of key name. (ex. `(value, key) => 'REDACTED ' + value.length`)
- _types_: _(optional)_ An array of JSON schema types you want to redact. By default, this is `['password']`

### Obfuscator.unObfuscate(newValue, prevValue, [replaceString])

A little helper function to try and unobfuscate a value based on its previous value. The usage here is when updating an obfuscated object, you can save the new object with the unobfuscated values (assuming you have access to them)

- _newValue_: The new values
- _prevValue_: The previous version of the value
- _replaceString_: _(optional)_ The expected obfuscated result. By default it's `**********`

#### Unobfuscate Example

```typescript
import { Obfuscate } from '@swimlane/obfuscator';

async function update(newValue): Promise<void> {
  // get previous value from DB or something
  const previous = await yourRepo.findById(newValue.id);

  //replace any obfuscated values with their DB version
  const updatedAsset = Obfuscator.unObfuscate(newValue, previous);

  // Save new version with unobfuscated value
  const result = await yourRepo.save(updatedAsset);
}
```

## More Examples

See `tests/Obfuscator.spec.ts` for various examples of usage.

## Credits

Obfuscator is a [Swimlane](http://swimlane.com) open-source project; we believe in giving back to the open-source community by sharing some of the projects we build for our application. Swimlane is an automated cyber security operations and incident response platform that enables cyber security teams to leverage threat intelligence, speed up incident response and automate security operations.
