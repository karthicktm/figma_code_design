interface FileTypeInfo {
  typename: string,
  bytes: string[],
  info: {
    mime: string,
    extension: string,
  }
}

export const patternMap: { [key: number]: FileTypeInfo } = {
  0: {
    typename: 'rar',
    bytes: ['0x52', '0x61', '0x72', '0x21'],
    info: {
      mime: 'application/vnd.rar',
      extension: 'rar',
    },
  }
}

export const fileTypeInfo = (
  bytes: Uint8Array
): FileTypeInfo[] => {
  const hexSignature = [...bytes]
    .map(x => x.toString(16).padStart(4, '0x0'))
    .join(' ');
  return Object.values(patternMap).filter(fileTypeInfo => fileTypeInfo.bytes.join(' ').startsWith(hexSignature));
};

export const fileTypeMime = (
  bytes: Uint8Array
): string[] =>
  fileTypeInfo(bytes)
    .map((e) => (e.info.mime ? e.info.mime : null))
    .filter((x) => x !== null) as string[];
