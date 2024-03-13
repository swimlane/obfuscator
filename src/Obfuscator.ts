export type TransformFunc = (input: any) => any;

export class Obfuscator {
  /* The default replacement value */
  static defaultReplaceString = '**********';

  /* The default schema types to obfuscate */
  static defaultReplaceTypes: Array<Record<string, unknown>> = [
    { type: 'password' }, // backward compatibility
    { type: 'string', format: 'password' }
  ];

  /**
   * Obfuscate a value based on a JSON schema.
   *
   * @remarks
   * Defaults to any value of type 'password' or type 'string' with format 'password'.
   *
   * @static
   * @param value The value to obfuscate.
   * @param schema The JSON schema describing the value.
   * @param replace The string to replace/obfuscate with, can be function.
   * @param types The types of values to replace.
   * @returns The obfuscated value.
   * @memberof Obfuscator
   */
  static value(
    value: any,
    schema: any,
    replace: string | TransformFunc = Obfuscator.defaultReplaceString,
    types: Array<Record<string, unknown> | string> = Obfuscator.defaultReplaceTypes
  ): any {
    if (typeof schema !== 'object' || schema === null) {
      return value;
    }

    const replaceFunc = Obfuscator.wrapReplace(replace);

    if (Obfuscator.predicateTypeFormat(schema, types)) {
      return replaceFunc(value);
    }

    if (
      schema.type === 'object' &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      typeof value !== 'function'
    ) {
      const newObj = Object.assign({}, value);
      for (const propertyName in schema.properties) {
        const propertySchema = schema.properties[propertyName];

        if (!(propertyName in value)) {
          // Skip missing properties
          continue;
        }

        newObj[propertyName] = Obfuscator.value(value[propertyName], propertySchema, replaceFunc, types);
      }

      return newObj;
    } else if (schema.type === 'array' && Array.isArray(value)) {
      const newArr: any[] = [];
      if (Array.isArray(schema.items)) {
        for (const i in value) {
          newArr.push(Obfuscator.value(value[i], schema.items[i], replaceFunc, types));
        }
      } else {
        for (const item of value) {
          newArr.push(Obfuscator.value(item, schema.items, replaceFunc, types));
        }
      }
      return newArr;
    } else {
      return value;
    }
  }

  /**
   * This is an alias for the "value" method
   *
   * @remarks
   * Defaults to any value of type 'password' or type 'string' with format 'password'.
   *
   * @static
   * @param obj The value to obfuscate.
   * @param schema The JSON schema describing the value.
   * @param replace The string to replace/obfuscate with, can be function.
   * @param types The types of values to replace.
   * @returns The obfuscated value.
   * @memberof Obfuscator
   */
  static object(
    obj: any,
    schema: any,
    replace: string | TransformFunc = Obfuscator.defaultReplaceString,
    types: Array<Record<string, unknown> | string> = Obfuscator.defaultReplaceTypes
  ): any {
    return this.value(obj, schema, replace, types);
  }

  /**
   * This is an alias for the "value" method
   *
   * @remarks
   * Defaults to any value of type 'password' or type 'string' with format 'password'.
   *
   * @static
   * @param arr The value to obfuscate.
   * @param schema The JSON schema describing the value.
   * @param replace The string to replace/obfuscate with, can be function.
   * @param types The types of values to replace.
   * @returns The obfuscated value.
   * @memberof Obfuscator
   */
  static array(
    arr: any,
    schema: any,
    replace: string | TransformFunc = Obfuscator.defaultReplaceString,
    types: Array<Record<string, unknown> | string> = Obfuscator.defaultReplaceTypes
  ): any {
    return this.value(arr, schema, replace, types);
  }
  /**
   * Normalize a replace string/function.
   *
   * @static
   * @param replace String or function to replace values.
   * @returns Transform function to replace values.
   * @memberof Obfuscator
   */
  static wrapReplace(replace: string | TransformFunc): TransformFunc {
    if (replace instanceof Function) return replace;
    return (input: string) => replace;
  }

  /**
   * Check if schema is one of type and optionally format.
   *
   * @static
   * @param schema The JSON schema describing a field.
   * @param types Types and optionally format to check that schema is.
   * @returns  If schema matches any of the types provided returns true, otherwise false.
   * @memberof Obfuscator
   */
  static predicateTypeFormat(schema: any, types: Array<Record<string, unknown> | string>) {
    if (schema) {
      for (const i in types) {
        const type: any = types[i];
        if (typeof type === 'string' && schema.type === type) {
          return true;
        }
        const matchesFormat = Object.keys(type).every(value => value in schema && type[value] === schema[value]);
        if (matchesFormat) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Replaces obfuscated text with the previous value.
   *
   * @remarks
   * Useful when accepting a modified object that contains obfuscated values that you wish to store
   * the unobfuscated values (basically an unobfuscator).
   *
   * @static
   * @param newValue The value to search for replacement string.
   * @param prevValue The value to replace the new value if replacement string.
   * @param replaceString The replacement string to search for.
   * @returns The unobfuscated value.
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

    // date objects are safe
    if (newValue !== null && newValue instanceof Date) {
      return newValue;
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
