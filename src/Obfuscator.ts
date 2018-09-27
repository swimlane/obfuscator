export type TransformFunc = (input: any) => any;

export class Obfuscator {
  /* The default replacement value */
  static defaultReplaceString = '**********';
  static defaultReplaceTypes = ['password'];

  /**
   * Obfuscate a value
   * Defaults to any value of type 'password'
   *
   * @static
   * @param {*} value The value value
   * @param {*} schema The schema describing the value
   * @param {string|TransformFunc} [replace=Obfuscator.defaultReplaceString] The default replace string, can be function
   * @param {string[]} [types=Obfuscator.defaultReplaceTypes] They types to replace
   * @returns {*}
   * @memberof Obfuscator
   */
  static value(
    value: any,
    schema: any,
    replace: string | TransformFunc = Obfuscator.defaultReplaceString,
    types: string[] = Obfuscator.defaultReplaceTypes
  ): any {
    if (typeof schema !== 'object' || schema === null || !('type' in schema)) {
      return value;
    }

    const replaceFunc = Obfuscator.wrapReplace(replace);

    if (schema.type === 'object') {
      return Obfuscator.object(value, schema, replaceFunc, types);
    } else if (schema.type === 'array') {
      return Obfuscator.array(value, schema, replace, types);
    }

    if (types.indexOf(schema.type) !== -1) {
      return replaceFunc(value);
    } else {
      return value;
    }
  }

  /**
   * Obfuscate an object based on a JSON schema
   * Defaults to any value of type 'password'
   *
   * @static
   * @param {*} obj The object to obfuscate
   * @param {*} schema The JSON schema describing the object
   * @param {string|TransformFunc} [replace=Obfuscator.defaultReplaceString] What to replace value with, can be function
   * @param {string[]} [types=Obfuscator.defaultReplaceTypes] What types of values to replace
   * @returns {*}
   * @memberof Obfuscator
   */
  static object(
    obj: any,
    schema: any,
    replace: string | TransformFunc = Obfuscator.defaultReplaceString,
    types: string[] = Obfuscator.defaultReplaceTypes
  ): any {
    // check that object is an object or array
    if (typeof obj !== 'object' || obj === null) return obj;

    // check that schema describes an object or array
    if (
      typeof schema !== 'object' ||
      schema === null ||
      !('type' in schema) ||
      !(schema.type === 'object' || schema.type === 'array') ||
      !('properties' in schema || 'items' in schema)
    ) {
      // unknown type // not an object/array // properties/items not defined
      return obj;
    }

    const replaceFunc = Obfuscator.wrapReplace(replace);

    if (schema.type === 'array') {
      return Obfuscator.array(obj, schema, replaceFunc, types);
    }

    const newObj = Object.assign({}, obj);

    for (const propertyName in schema.properties) {
      const propertySchema = schema.properties[propertyName];

      if (
        !('type' in propertySchema) || // skip undefined types
        !(propertyName in obj) // skip missing properties
      ) {
        continue;
      }

      newObj[propertyName] = Obfuscator.value(newObj[propertyName], propertySchema, replaceFunc, types);
    }

    return newObj;
  }

  /**
   * Obfuscate an array based on a JSON schema
   * Defaults to any value of type 'password'
   *
   * @static
   * @param {any[]} obj The array to obfuscate
   * @param {*} schema The JSON schema describing the array
   * @param {string|TransformFunc} [replace=Obfuscator.defaultReplaceString] What to replace value with, can be function
   * @param {string[]} [types=Obfuscator.defaultReplaceTypes] What types of values to replace
   * @returns {*}
   * @memberof Obfuscator
   */
  static array(
    arr: any[],
    schema: any,
    replace: string | TransformFunc = Obfuscator.defaultReplaceString,
    types: string[] = Obfuscator.defaultReplaceTypes
  ): any[] {
    // check that object is an object or array
    if (typeof arr !== 'object' || arr === null) return arr;

    // check that schema describes an array
    if (
      typeof schema !== 'object' ||
      schema === null ||
      !('type' in schema) ||
      schema.type !== 'array' ||
      !('items' in schema) ||
      !Array.isArray(arr)
    ) {
      return arr;
    }

    const replaceFunc = Obfuscator.wrapReplace(replace);

    const newArr: any[] = [];

    for (const item of arr) {
      if (schema.items.type && types.indexOf(schema.items.type) !== -1) {
        newArr.push(replaceFunc(item));
      } else {
        newArr.push(Obfuscator.value(item, schema.items, replaceFunc, types));
      }
    }

    return newArr;
  }

  /**
   * Normalize a replace string/fucntion
   *
   * @static
   * @param {(string|TransformFunc)} replace
   * @returns {TransformFunc}
   * @memberof Obfuscator
   */
  static wrapReplace(replace: string | TransformFunc): TransformFunc {
    if (replace instanceof Function) return replace;
    return (input: string) => replace;
  }

  /**
   * Replaces obfuscated text with the previous value.
   * Useful when accepting a modified object that contains obfuscated values that you wish to store
   * the unobfuscated values. (basically an unobfuscator)
   *
   * @static
   * @param {*} newValue
   * @param {*} prevValue
   * @param {*} [replaceString=Obfuscator.defaultReplaceString]
   * @returns {*}
   * @memberof Obfuscator
   */
  static unObfuscate(newValue: any, prevValue: any, replaceString = Obfuscator.defaultReplaceString): any {
    // if there is no pre-existing value, we take the new (and improved) value
    if (prevValue === undefined) return newValue;

    // if the value is the replaceString, return the previous value
    if (newValue === replaceString) return prevValue;

    // unobfuscate values in an array if the previous was an array too
    if (Array.isArray(newValue) && Array.isArray(prevValue)) {
      return newValue.map((nv, idx) => Obfuscator.unObfuscate(nv, prevValue[idx], replaceString));
    }

    // unobfuscate values in an object
    if (newValue !== null && typeof newValue === 'object' && prevValue !== null && typeof prevValue === 'object') {
      const newObj = { ...newValue };
      for (const key in newObj) {
        newObj[key] = Obfuscator.unObfuscate(newObj[key], prevValue[key], replaceString);
      }

      return newObj;
    }

    return newValue;
  }
}
