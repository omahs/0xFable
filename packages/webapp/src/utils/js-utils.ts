/**
 * General Javascript utilities
 *
 * @module utils/react-utils
 */

// =================================================================================================

/**
 * Returns a string representation of the object that is prettier than `JSON.stringify`. In
 * particular, keys are not quoted, sensible whitespace is applied (after comma and colons).
 *
 * The function supports single-line or multiline output (with indent size two), defaulting to
 * single-line.
 */
export function format(obj: any, multiline = false, indent = 0) {
  const linePrefix =  multiline ? " ".repeat(indent + 2) : undefined
  const separator = multiline ? ",\n" : ", "
  const pairs = []

  for (const key in obj) {
    const value = obj[key]
    let pair = multiline ? `${linePrefix}${key}: ` : `${key}: `

    if (typeof value === "object" && value !== null) {
      pair += format(value, multiline, indent + 2)
    } else if (typeof value === "string") {
      pair += `"${value}"`
    } else {
      pair += value
    }

    pairs.push(pair)
  }

  const openingBracket = multiline ? "{\n" : "{ "
  const closingBracket = multiline ? `\n${" ".repeat(indent)}}` : " }"

  return `${openingBracket}${pairs.join(separator)}${closingBracket}`
}

// -------------------------------------------------------------------------------------------------

/**
 * Returns the standard string represetnation for most values (as used in string interpolation), or
 * {@linkcode format(obj)} for objects (`typeof value === "object"`).
 */
export function toString(obj: any) {
  return typeof obj === "object" ? format(obj) : `${obj}`
}

// -------------------------------------------------------------------------------------------------

/**
 * Shallowly compares two objects with depth 1 by checking the equality of their members.
 */
export function shallowCompare(obj1: any, obj2: any): boolean {
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length)
    return false

  for (const key of keys1)
    if (obj1[key] !== obj2[key])
      return false

  return true
}

// -------------------------------------------------------------------------------------------------

/**
 * Converts the bigint to a hex string. The string does *not* start with 0x.
 *
 * If `extendTo` is specified, the string is padded with leading zeros to reach the given BYTE
 * length (meaning the actual string length is twice as big). Otherwise, the string is padded with a
 * leading zero if needed to give it even string length (i.e. no half bytes).
 */
export function bigintToHexString(n: bigint, extendTo?: number): string {
  const str = n.toString(16)
  return extendTo !== undefined
    ? str.padStart(extendTo * 2, "0")
    : str.length % 2 === 1
      ? "0" + str
      : str
}

// -------------------------------------------------------------------------------------------------

/**
 * Converts a byte array to a hex string. The string does *not* start with 0x, and has length
 * `2 * array.length`.
 */
export function bytesToHexString(array: Uint8Array): string {
  return Array.from(array).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

// -------------------------------------------------------------------------------------------------

/**
 * Parses a bigint-compatible value into a bigint.
 */
export function parseBigInt(value: string|number|bigint|Uint8Array): bigint {
  if (typeof value === "bigint") return value
  if (value instanceof Uint8Array)
    return BigInt("0x" + bytesToHexString(value))
  return BigInt(value).valueOf()
}

// -------------------------------------------------------------------------------------------------

/**
 * Parses a bigint-compatible value into a bigint.
 * Returns null if the value is null or if it cannot be parsed.
 */
export function parseBigIntOrNull(value: string|number|bigint|Uint8Array|null): bigint|null {
  if (value === null) return null
  try {
    return parseBigInt(value)
  } catch(e) {
    return null
  }
}

// -------------------------------------------------------------------------------------------------

/** Check if the string represents a positive integer. */
export function isStringPositiveInteger(str: string): boolean {
  const n = Math.floor(Number(str))
  return n !== Infinity && String(n) === str && n >= 0
}

// -------------------------------------------------------------------------------------------------

/**
 * Formats a UNIX timestamp as a string in the format "HH:MM:SS".
 */
export function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp)
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((num) => num < 10 ? "0" + num : num)
    .join(":")
}

// -------------------------------------------------------------------------------------------------

/** Async function that waits for the given number of milliseconds. */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// -------------------------------------------------------------------------------------------------

/** Returns a random 256-bit unsigned integer using {@link crypto.getRandomValues}. */
export function randomUint256(): bigint {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return parseBigInt(bytes)
}

// =================================================================================================