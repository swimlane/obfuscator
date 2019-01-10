export type TransformFunc = (input: any) => any;

export interface ObfuscateTypeFormat {
  /**
   * Type to obfuscate.
   */
  type: string;

  /**
   * Format to obfuscate.
   */
  format?: string;
}

export class Obfuscator {
  /* The default replacement value */
  static defaultReplaceString = '**********';

  /* The default schema types to obfuscate */
  static defaultReplaceTypes: ObfuscateTypeFormat[] = [
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
    types: string[] | ObfuscateTypeFormat[] = Obfuscator.defaultReplaceTypes
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

    if (Obfuscator.predicateTypeFormat(schema, types)) {
      return replaceFunc(value);
    } else {
      return value;
    }
  }

  /**
   * Obfuscate an object based on a JSON schema.
   *
   * @remarks
   * Defaults to any value of type 'password' or type 'string' with format 'password'.
   *
   * @static
   * @param obj The object to obfuscate.
   * @param schema The JSON schema describing the object.
   * @param replace The string to replace/obfuscate with, can be function.
   * @param types The types of values to replace.
   * @returns The obfuscated object.
   * @memberof Obfuscator
   */
  static object(
    obj: any,
    schema: any,
    replace: string | TransformFunc = Obfuscator.defaultReplaceString,
    types: string[] | ObfuscateTypeFormat[] = Obfuscator.defaultReplaceTypes
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
   * Obfuscate an array based on a JSON schema.
   *
   * @remarks
   * Defaults to any value of type 'password' or type 'string' with format 'password'.
   *
   * @static
   * @param arr The array to obfuscate.
   * @param schema The JSON schema describing the array.
   * @param replace The string to replace/obfuscate with, can be function.
   * @param types The types of values to replace.
   * @returns The obfuscated array.
   * @memberof Obfuscator
   */
  static array(
    arr: any[],
    schema: any,
    replace: string | TransformFunc = Obfuscator.defaultReplaceString,
    types: string[] | ObfuscateTypeFormat[] = Obfuscator.defaultReplaceTypes
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
      if (schema.items.type && Obfuscator.predicateTypeFormat(schema.items, types)) {
        newArr.push(replaceFunc(item));
      } else {
        newArr.push(Obfuscator.value(item, schema.items, replaceFunc, types));
      }
    }

    return newArr;
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
  static predicateTypeFormat(schema: any, types: string[] | ObfuscateTypeFormat[]) {
    if (schema && schema.type) {
      for (const i in types) {
        const type: any = types[i];
        if (typeof type === 'string' && schema.type === type) {
          return true;
        } else if (type.type === schema.type && (type.format === undefined || type.format === schema.format)) {
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
