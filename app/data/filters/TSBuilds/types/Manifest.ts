export interface Manifest {
  format_version: number;
  modules: [
    {
      description: string;
      language: string;
      type: string;
      uuid: string;
      version: [number, number, number];
      entry: string;
    },
  ];
}
