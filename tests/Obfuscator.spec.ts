import { Obfuscator } from '../src/Obfuscator';
import { expect } from 'chai';

describe('Obfuscator', () => {
  describe('.value()', () => {
    it('should obfuscate a value with password type', done => {
      const value = '12345';
      const schema = { type: 'password' };

      expect(Obfuscator.value(value, schema)).to.equal(Obfuscator.defaultReplaceString);
      done();
    });

    it('should obfuscate a value with password format', done => {
      const value = '12345';
      const schema = { type: 'string', format: 'password' };

      expect(Obfuscator.value(value, schema)).to.equal(Obfuscator.defaultReplaceString);
      done();
    });

    it('should obfuscate a value with a user supplied string', done => {
      const value = '12345';
      const schema = { type: 'password' };
      const replace = '54321';

      expect(Obfuscator.value(value, schema, replace)).to.equal(replace);
      done();
    });

    it('should obfuscate a value with a user supplied function', done => {
      const value = 'abcde';
      const schema = { type: 'password' };
      const replace = (input: string) => input.toUpperCase(); // no one will ever know!

      expect(Obfuscator.value(value, schema, replace)).to.equal('ABCDE');
      done();
    });

    it('should obfuscate a value with a user supplied type', done => {
      const value = '12345';
      const schema = { type: 'string' };
      const type = ['string'];

      expect(Obfuscator.value(value, schema, undefined, type)).to.equal(Obfuscator.defaultReplaceString);
      done();
    });

    it('should obfuscate a value with a user supplied type and no format', done => {
      const value = '12345';
      const schema = { type: 'string' };
      const type: Array<Record<string, unknown>> = [{ type: 'string' }];

      expect(Obfuscator.value(value, schema, undefined, type)).to.equal(Obfuscator.defaultReplaceString);
      done();
    });

    it('should obfuscate a value with a user supplied type and any format', done => {
      const value = '12345';
      const schema = { type: 'string', format: 'secret' };
      const type: Array<Record<string, unknown>> = [{ type: 'string' }];

      expect(Obfuscator.value(value, schema, undefined, type)).to.equal(Obfuscator.defaultReplaceString);
      done();
    });

    it('should obfuscate a value with a user supplied type and format', done => {
      const value = '12345';
      const schema = { type: 'string', format: 'secret' };
      const type: Array<Record<string, unknown>> = [{ type: 'string', format: 'secret' }];

      expect(Obfuscator.value(value, schema, undefined, type)).to.equal(Obfuscator.defaultReplaceString);
      done();
    });

    it('should not obfuscate a value with a user supplied type and non-matching format', done => {
      const value = '12345';
      const schema = { type: 'string', format: 'not-secret' };
      const type: Array<Record<string, unknown>> = [{ type: 'string', format: 'secret' }];

      expect(Obfuscator.value(value, schema, undefined, type)).to.equal(value);
      done();
    });

    it('should ignore non-typed values', done => {
      const value = '12345';
      const schema = {};

      expect(Obfuscator.value(value, schema)).to.equal(value);
      done();
    });

    it('should ignore a null schema', done => {
      const value = 12345;
      const obj = { foo: 'bar' };
      const arr = ['foo'];
      const schema = null;

      expect(Obfuscator.value(value, schema)).to.equal(value);
      expect(Obfuscator.value(obj, schema)).to.equal(obj);
      expect(Obfuscator.value(arr, schema)).to.equal(arr);
      expect(Obfuscator.value(null, schema)).to.equal(null);
      done();
    });
  });

  describe('.object()', () => {
    it('should obfuscate an object', done => {
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

      expect(Obfuscator.value(obj, schema)).to.deep.equal({ foo: Obfuscator.defaultReplaceString, fizz: 'buzz' });
      done();
    });

    it('should obfuscate an object with a user supplied function', done => {
      const obj = { foo: 'bar', fizz: 'buzz' };
      const schema = { type: 'object', properties: { foo: { type: 'password' }, fizz: { type: 'string' } } };
      const replace = (input: any) => JSON.stringify(input).toUpperCase();

      expect(Obfuscator.value(obj, schema, replace)).to.deep.equal({
        foo: '"BAR"',
        fizz: 'buzz'
      });
      done();
    });

    it('should obfuscate an object recursivly', done => {
      const obj = { foo: 'bar', fizz: 'buzz', obj: { foo: 'foop', bar: { foo: 'foo' } } };
      const schema = {
        type: 'object',
        properties: {
          foo: { type: 'password' },
          fizz: { type: 'string' },
          obj: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: {
                type: 'object',
                properties: {
                  foo: { type: 'password' }
                }
              }
            }
          }
        }
      };

      expect(Obfuscator.value(obj, schema)).to.deep.equal({
        foo: Obfuscator.defaultReplaceString,
        fizz: 'buzz',
        obj: {
          foo: 'foop',
          bar: {
            foo: Obfuscator.defaultReplaceString
          }
        }
      });
      done();
    });

    it('should ignore a non-object', done => {
      expect(Obfuscator.value(4, {})).to.equal(4);
      expect(Obfuscator.value('foo', {})).to.equal('foo');
      expect(Obfuscator.value(true, {})).to.equal(true);
      done();
    });

    it('should ignore a missing property', done => {
      const obj = { foo: 'bar' };
      const schema = { type: 'object', properties: { foo: { type: 'password' }, fizz: { type: 'string' } } };

      expect(Obfuscator.value(obj, schema)).to.deep.equal({ foo: Obfuscator.defaultReplaceString });
      done();
    });

    it('should replace items in an array', done => {
      const arr = ['foo', 'bar'];
      const schema = { type: 'array', items: { type: 'password' } };
      expect(Obfuscator.value(arr, schema)).to.deep.equal([
        Obfuscator.defaultReplaceString,
        Obfuscator.defaultReplaceString
      ]);
      done();
    });
    it('should obfuscate an object using isSensitive', done => {
      const value = {
        foo: {
          bin: 'bar'
        },
        fizz: 'buzz'
      };
      const schema = {
        type: 'object',
        properties: {
          foo: {
            name: 'test',
            isSensitive: true
          },
          fizz: {
            type: 'string'
          }
        }
      };
      let obfuscateDefinition = [...Obfuscator.defaultReplaceTypes, { isSensitive: true }];

      expect(Obfuscator.value(value, schema, undefined, obfuscateDefinition)).to.deep.equal({
        foo: Obfuscator.defaultReplaceString,
        fizz: 'buzz'
      });
      done();
    });
  });

  describe('.array()', () => {
    it('should replace items in an array', done => {
      const arr = ['foo', 'bar'];
      const schema = {
        type: 'array',
        items: {
          type: 'password'
        }
      };
      expect(Obfuscator.value(arr, schema)).to.deep.equal([
        Obfuscator.defaultReplaceString,
        Obfuscator.defaultReplaceString
      ]);
      done();
    });

    it('should ignore missing type schema', done => {
      const arr = ['foo', 'bar'];
      const schema = {};
      expect(Obfuscator.value(arr, schema)).to.deep.equal(arr);
      done();
    });

    it('should ignore non-array schema', done => {
      const arr = ['foo', 'bar'];
      const schema = { type: 'string' };
      expect(Obfuscator.value(arr, schema)).to.deep.equal(arr);
      done();
    });

    it('should ignore array with undefined items', done => {
      const arr = ['foo', 'bar'];
      const schema = { type: 'array' };
      expect(Obfuscator.value(arr, schema)).to.deep.equal(arr);
      done();
    });

    it('should ignore a non-array value', done => {
      const arr: any = 42;
      const schema = { type: 'array', items: { type: 'string' } };
      expect(Obfuscator.value(arr, schema)).to.equal(arr);
      done();
    });

    it('should obfuscate an array of objects', done => {
      const arr = [{ foo: 'bar' }, { foo: 'buzz' }];
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            foo: {
              type: 'password'
            }
          }
        }
      };
      expect(Obfuscator.value(arr, schema)).to.deep.equal([
        { foo: Obfuscator.defaultReplaceString },
        { foo: Obfuscator.defaultReplaceString }
      ]);
      done();
    });
  });

  describe('.unObfuscate()', () => {
    it('should replace an obfuscated string with the unobfuscated version', done => {
      const oldVal = 'foo';
      expect(Obfuscator.unObfuscate(Obfuscator.defaultReplaceString, oldVal)).to.equal(oldVal);
      done();
    });

    it('should replace an obfuscated string in an array with the unobfuscated version', done => {
      const newVal = [Obfuscator.defaultReplaceString, 'bar', Obfuscator.defaultReplaceString, 'buzz'];
      const oldVal = ['foo', 'bar', 'fizz', 'buzz'];
      expect(Obfuscator.unObfuscate(newVal, oldVal)).to.deep.equal(oldVal);
      done();
    });

    it('should replace an obfuscated string in an object with the unobfuscated version', done => {
      const newVal = {
        foo: Obfuscator.defaultReplaceString,
        fizz: 'buzz'
      };
      const oldVal = { foo: 'bar', fizz: 'buzz' };
      expect(Obfuscator.unObfuscate(newVal, oldVal)).to.deep.equal(oldVal);
      done();
    });

    it('should replace an obfuscated string with the unobfuscated version recursively', done => {
      const newVal = {
        foo: Obfuscator.defaultReplaceString,
        fizz: 'buzz',
        deep: {
          obj: Obfuscator.defaultReplaceString,
          arr: [Obfuscator.defaultReplaceString, { key: Obfuscator.defaultReplaceString }]
        }
      };
      const oldVal = {
        foo: 'bar',
        fizz: 'buzz',
        deep: {
          obj: { some: 'obj' },
          arr: [1234, { key: 'val' }]
        }
      };
      expect(Obfuscator.unObfuscate(newVal, oldVal)).to.deep.equal(oldVal);
      done();
    });

    it('should return the new value if there is not an old value', done => {
      const newVal = {
        foo: Obfuscator.defaultReplaceString,
        fizz: 'buzz',
        deep: { obj: { some: 'obj' }, arr: [1234, { key: 'val' }] }
      };
      const oldVal = { foo: 'bar', fizz: 'buzz' };
      const combinedVal = { foo: 'bar', fizz: 'buzz', deep: { obj: { some: 'obj' }, arr: [1234, { key: 'val' }] } };
      expect(Obfuscator.unObfuscate(newVal, oldVal)).to.deep.equal(combinedVal);
      done();
    });

    it('should handle nulls', done => {
      const newVal = {
        foo: Obfuscator.defaultReplaceString,
        fizz: null,
        deep: { obj: { some: 'obj' }, arr: [1234, { key: 'val' }] }
      };
      const oldVal = { foo: 'bar', fizz: 'buzz' };
      const combinedVal = { foo: 'bar', fizz: null, deep: { obj: { some: 'obj' }, arr: [1234, { key: 'val' }] } };
      expect(Obfuscator.unObfuscate(newVal, oldVal)).to.deep.equal(combinedVal);
      expect(Obfuscator.unObfuscate(newVal, null)).to.deep.equal(newVal);
      expect(Obfuscator.unObfuscate(null, null)).to.be.null;
      done();
    });

    it('should handle dates', done => {
      const newDate = new Date();
      const oldDate = new Date(new Date().getTime() - 1000);
      const newVal = {
        foo: Obfuscator.defaultReplaceString,
        fizz: newDate
      };
      const oldVal = { foo: 'bar', fizz: oldDate };
      const result = Obfuscator.unObfuscate(newVal, oldVal);
      expect(result.fizz instanceof Date);
      expect(result.fizz.getTime()).to.eq(newDate.getTime());
      done();
    });
  });

  describe('.predicateTypeFormat()', () => {
    it('should match on a matching string type value', done => {
      expect(Obfuscator.predicateTypeFormat({ type: 'string' }, ['string'])).to.be.true;
      done();
    });

    it('should not match on a non-matching string type value', done => {
      expect(Obfuscator.predicateTypeFormat({ type: 'string' }, ['integer'])).to.be.false;
      done();
    });

    it('should match on a string type value with multiple options', done => {
      expect(Obfuscator.predicateTypeFormat({ type: 'string' }, ['integer', 'string'])).to.be.true;
      done();
    });

    it('should match on a matching ObfuscateTypeFormat type value', done => {
      expect(Obfuscator.predicateTypeFormat({ type: 'string' }, [{ type: 'string' }])).to.be.true;
      done();
    });

    it('should not match on a non-matching ObfuscateTypeFormat type value', done => {
      expect(Obfuscator.predicateTypeFormat({ type: 'string' }, [{ type: 'boolean' }])).to.be.false;
      done();
    });

    it('should match on an ObfuscateTypeFormat type value with multiple options', done => {
      expect(Obfuscator.predicateTypeFormat({ type: 'string' }, [{ type: 'integer' }, { type: 'string' }])).to.be.true;
      done();
    });

    it('should match on a matching ObfuscateTypeFormat type/format value', done => {
      expect(
        Obfuscator.predicateTypeFormat({ type: 'string', format: 'password' }, [{ type: 'string', format: 'password' }])
      ).to.be.true;
      done();
    });

    it('should not match on a non-matching ObfuscateTypeFormat type/format value', done => {
      expect(
        Obfuscator.predicateTypeFormat({ type: 'string', format: 'password' }, [{ type: 'string', format: 'date' }])
      ).to.be.false;
      done();
    });

    it('should not match on a non-matching ObfuscateTypeFormat type/format value', done => {
      expect(Obfuscator.predicateTypeFormat({ type: 'string', isSensitive: true }, [{ isSensitive: true }])).to.be.true;
      done();
    });

    it('should not match on a non-matching ObfuscateTypeFormat type/format value', done => {
      expect(Obfuscator.predicateTypeFormat({ type: 'string', isSensitive: false }, [{ isSensitive: true }])).to.be
        .false;
      done();
    });
  });
});
