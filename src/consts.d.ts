declare module 'consts:*' {
  /**
   * Constant that will be inlined by Rollup and rollup-plugin-consts.
   */
  const constant: any
  export default constant
}
declare module 'consts:port' {
  const port: number
  export default port
}

declare module 'consts:database' {
  const databaseUrl: string
  export default databaseUrl
}
declare module 'consts:pat' {
  const token: string
  export default token
}
