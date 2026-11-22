# TypeScript compiler and tooling

The project uses TypeScript 7.0.2 for type checking and the TypeScript 6 API for
tools such as typescript-eslint. TypeScript 7.0 does not provide the JavaScript
compiler API required by those tools. See Microsoft's
[side-by-side installation guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-60).

The dependencies in [package.json](../package.json) have separate npm aliases:

- `typescript` resolves to `@typescript/typescript6`, which provides the compatible
  TypeScript 6 API.
- `typescript-compiler` resolves to TypeScript 7.0.2. This alias also avoids
  typescript-eslint's optional `@typescript/native` peer, which requires the
  TypeScript 7.1 API.

Run `npm run typecheck` to generate React Router types and check all project
references with TypeScript 7. The script invokes the compiler's entry point
explicitly: the compatibility package's transitive dependencies also expose a
`tsc` executable, so a bare `tsc` can resolve to TypeScript 6.

Keep both dependencies and the lockfile in sync when updating TypeScript.
Remove the compatibility dependency only once the tools using its API support
the native compiler's API.
