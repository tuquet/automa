declare module './handlerTrigger.js' {
  const handler: any;
  export default handler;
}

declare module './handlerConditions.js' {
  const handler: any;
  export default handler;
}

declare module './handlerInsertData.js' {
  const handler: any;
  export default handler;
}

declare module './handlerLoopData.js' {
  const handler: any;
  export default handler;
}

declare module './handlerLoopBreakpoint.js' {
  const handler: any;
  export default handler;
}

declare module '../utils/testConditions.js' {
  const testConditions: any;
  export default testConditions;
}

declare module '../utils/getFile.js' {
  export function readFileAsBase64(blob: any): Promise<string>;
  const getFile: any;
  export default getFile;
}
