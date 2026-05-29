import type { RemoteOptionSource, SelectOption } from './types';

export const createRemoteOptions = <TRawItem>(opts: {
  fetcher: (keyword: string) => Promise<TRawItem[]>;
  mapFn: (raw: TRawItem) => SelectOption;
}): RemoteOptionSource => {
  return {
    resolver: async (keyword: string) => {
      const rawList = await opts.fetcher(keyword);
      return rawList.map(opts.mapFn);
    },
  };
};

export const createDictRemoteOptions = (
  _dictCode: string,
): RemoteOptionSource => {
  throw new Error('createDictRemoteOptions: not implemented yet');
};

export const createStaticOptions = (items: SelectOption[]): SelectOption[] => {
  return items;
};
