/**
 * Returns a greeting message.
 *
 * @param name - Optional name to greet. Defaults to "World".
 * @returns A greeting string in the format "Hello, {name}!"
 */
export function hello(name: string = 'World'): string {
  return `Hello, ${name}!`;
}
