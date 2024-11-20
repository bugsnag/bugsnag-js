const matchPageProtocol = (endpoint: string, pageProtocol: string) =>
  pageProtocol === 'http:'
    ? endpoint.replace(/^https:/, 'http:')
    : endpoint

export default matchPageProtocol
