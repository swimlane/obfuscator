import { Obfuscator } from '../src/Obfuscator';
import { expect } from 'chai';

describe('Obfuscator', () => {
  describe('.value()', () => {
    it('should obfuscate a value', done => {
      const value = '12345';
      const schema = { type: 'password' };

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

      expect(Obfuscator.object(obj, schema)).to.deep.equal({ foo: Obfuscator.defaultReplaceString, fizz: 'buzz' });
      done();
    });

    it('should obfuscate an object with a user supplied function', done => {
      const obj = { foo: 'bar', fizz: 'buzz' };
      const schema = { type: 'object', properties: { foo: { type: 'password' }, fizz: { type: 'string' } } };
      const replace = (input: any) => JSON.stringify(input).toUpperCase();

      expect(Obfuscator.object(obj, schema, replace)).to.deep.equal({
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

      expect(Obfuscator.object(obj, schema)).to.deep.equal({
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
      expect(Obfuscator.object(4, {})).to.equal(4);
      expect(Obfuscator.object('foo', {})).to.equal('foo');
      expect(Obfuscator.object(true, {})).to.equal(true);
      done();
    });

    it('should ignore a missing property', done => {
      const obj = { foo: 'bar' };
      const schema = { type: 'object', properties: { foo: { type: 'password' }, fizz: { type: 'string' } } };

      expect(Obfuscator.object(obj, schema)).to.deep.equal({ foo: Obfuscator.defaultReplaceString });
      done();
    });

    it('should replace items in an array', done => {
      const arr = ['foo', 'bar'];
      const schema = { type: 'array', items: { type: 'password' } };
      expect(Obfuscator.object(arr, schema)).to.deep.equal([
        Obfuscator.defaultReplaceString,
        Obfuscator.defaultReplaceString
      ]);
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
      expect(Obfuscator.array(arr, schema)).to.deep.equal([
        Obfuscator.defaultReplaceString,
        Obfuscator.defaultReplaceString
      ]);
      done();
    });

    it('should ignore missing type schema', done => {
      const arr = ['foo', 'bar'];
      const schema = {};
      expect(Obfuscator.array(arr, schema)).to.deep.equal(arr);
      done();
    });

    it('should ignore non-array schema', done => {
      const arr = ['foo', 'bar'];
      const schema = { type: 'string' };
      expect(Obfuscator.array(arr, schema)).to.deep.equal(arr);
      done();
    });

    it('should ignore array with undefined items', done => {
      const arr = ['foo', 'bar'];
      const schema = { type: 'array' };
      expect(Obfuscator.array(arr, schema)).to.deep.equal(arr);
      done();
    });

    it('should ignore a non-array value', done => {
      const arr: any = 42;
      const schema = { type: 'array', items: { type: 'string' } };
      expect(Obfuscator.array(arr, schema)).to.equal(arr);
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
      expect(Obfuscator.array(arr, schema)).to.deep.equal([
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
  });
});